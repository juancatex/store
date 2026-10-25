<script>
  import { onMount, onDestroy } from 'svelte';
  import { 
    BarChart3, 
    Calendar, 
    Download, 
    TrendingUp, 
    FileText, 
    Filter,
    DollarSign,
    ShoppingBag,
    Layers
  } from 'lucide-svelte';
  import { Chart, registerables } from 'chart.js';
  import { 
    obtenerReporteDiario, 
    obtenerReporteSemanal, 
    obtenerReporteMensual,
    formatDateISO,
    exportarVentasCSV 
  } from '../lib/services/reporteService.js';
  import { toast } from '../lib/services/toastService.js';

  Chart.register(...registerables);

  let activeTab = 'diario'; // 'diario', 'semanal', 'mensual'
  let loading = false;

  // Parámetros de filtros
  let fechaDiaria = formatDateISO(new Date());
  let fechaSemanal = formatDateISO(new Date());
  let mesMensual = new Date().getMonth() + 1;
  let anioMensual = new Date().getFullYear();

  // Resultados
  let reporteDiarioData = {
    fecha: '',
    totalOperaciones: 0,
    unidadesVendidas: 0,
    totalIngresos: 0,
    totalAnuladas: 0,
    ventas: []
  };

  let reporteSemanalData = {
    fechaInicio: '',
    fechaFin: '',
    totalOperaciones: 0,
    totalUnidades: 0,
    totalIngresos: 0,
    totalAnuladas: 0,
    resumenDias: [],
    ventas: []
  };

  let reporteMensualData = {
    anio: 2026,
    mes: 1,
    totalOperaciones: 0,
    totalUnidades: 0,
    totalIngresos: 0,
    totalAnuladas: 0,
    ventasPorDia: [],
    ventas: []
  };

  let mensualCanvas;
  let mensualChart = null;

  $: listaVentas = activeTab === 'diario' 
    ? reporteDiarioData.ventas 
    : activeTab === 'semanal' 
      ? reporteSemanalData.ventas 
      : reporteMensualData.ventas;

  async function cargarReporte() {
    try {
      loading = true;
      if (activeTab === 'diario') {
        reporteDiarioData = await obtenerReporteDiario(fechaDiaria);
      } else if (activeTab === 'semanal') {
        reporteSemanalData = await obtenerReporteSemanal(fechaSemanal);
      } else if (activeTab === 'mensual') {
        reporteMensualData = await obtenerReporteMensual(anioMensual, mesMensual);
        setTimeout(renderMensualChart, 50);
      }
    } catch (err) {
      toast.error('Error al generar reporte: ' + err.message);
    } finally {
      loading = false;
    }
  }

  function renderMensualChart() {
    if (!mensualCanvas || !reporteMensualData.ventasPorDia.length) return;

    if (mensualChart) {
      mensualChart.destroy();
    }

    const labels = reporteMensualData.ventasPorDia.map(d => `Día ${d.dia}`);
    const values = reporteMensualData.ventasPorDia.map(d => d.total);

    const ctx = mensualCanvas.getContext('2d');
    mensualChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Ventas Diarias ($)',
          data: values,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#1d4ed8',
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` Total: $${Number(ctx.raw).toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v) => `$${v}`
            },
            grid: { color: '#f1f5f9' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  onMount(() => {
    cargarReporte();
  });

  onDestroy(() => {
    if (mensualChart) {
      mensualChart.destroy();
    }
  });

  function cambiarTab(tab) {
    activeTab = tab;
    cargarReporte();
  }

  function exportarActual() {
    let ventasAExportar = [];
    let nombre = 'reporte.csv';

    if (activeTab === 'diario') {
      ventasAExportar = reporteDiarioData.ventas;
      nombre = `reporte_diario_${fechaDiaria}.csv`;
    } else if (activeTab === 'semanal') {
      ventasAExportar = reporteSemanalData.ventas;
      nombre = `reporte_semanal_${reporteSemanalData.fechaInicio}_al_${reporteSemanalData.fechaFin}.csv`;
    } else if (activeTab === 'mensual') {
      ventasAExportar = reporteMensualData.ventas;
      nombre = `reporte_mensual_${anioMensual}_${mesMensual}.csv`;
    }

    exportarVentasCSV(ventasAExportar, nombre);
    toast.success('Archivo CSV exportado con éxito.');
  }
</script>

<div class="reportes-view">
  <div class="page-header">
    <div class="page-header-info">
      <h1>Reportes de Ventas</h1>
      <p>Análisis de ingresos por períodos con exclusión de operaciones anuladas</p>
    </div>
    <div class="page-header-actions">
      <button type="button" class="btn btn-secondary" on:click={exportarActual} disabled={loading}>
        <Download size={18} />
        <span>Exportar a CSV</span>
      </button>
    </div>
  </div>

  <!-- Selector de Pestañas -->
  <div class="tabs-container">
    <button 
      type="button" 
      class="tab-btn" 
      class:active={activeTab === 'diario'} 
      on:click={() => cambiarTab('diario')}
    >
      <Calendar size={17} />
      <span>Reporte Diario</span>
    </button>

    <button 
      type="button" 
      class="tab-btn" 
      class:active={activeTab === 'semanal'} 
      on:click={() => cambiarTab('semanal')}
    >
      <Layers size={17} />
      <span>Reporte Semanal</span>
    </button>

    <button 
      type="button" 
      class="tab-btn" 
      class:active={activeTab === 'mensual'} 
      on:click={() => cambiarTab('mensual')}
    >
      <BarChart3 size={17} />
      <span>Reporte Mensual</span>
    </button>
  </div>

  <!-- Barra de Filtros del Período -->
  <div class="card period-filter-card">
    <div class="filter-controls">
      {#if activeTab === 'diario'}
        <div class="filter-item">
          <label for="f-diaria" class="form-label">Seleccionar Fecha:</label>
          <input 
            id="f-diaria" 
            type="date" 
            class="form-input" 
            bind:value={fechaDiaria} 
            on:change={cargarReporte}
          />
        </div>
      {:else if activeTab === 'semanal'}
        <div class="filter-item">
          <label for="f-semanal" class="form-label">Fecha de Referencia en la Semana:</label>
          <input 
            id="f-semanal" 
            type="date" 
            class="form-input" 
            bind:value={fechaSemanal} 
            on:change={cargarReporte}
          />
        </div>
        <div class="week-range-badge">
          Rango calculado: <strong>{reporteSemanalData.fechaInicio}</strong> al <strong>{reporteSemanalData.fechaFin}</strong> (Lunes a Domingo)
        </div>
      {:else if activeTab === 'mensual'}
        <div class="filter-item">
          <label for="f-mes" class="form-label">Mes:</label>
          <select id="f-mes" class="form-select" bind:value={mesMensual} on:change={cargarReporte}>
            <option value={1}>Enero</option>
            <option value={2}>Febrero</option>
            <option value={3}>Marzo</option>
            <option value={4}>Abril</option>
            <option value={5}>Mayo</option>
            <option value={6}>Junio</option>
            <option value={7}>Julio</option>
            <option value={8}>Agosto</option>
            <option value={9}>Septiembre</option>
            <option value={10}>Octubre</option>
            <option value={11}>Noviembre</option>
            <option value={12}>Diciembre</option>
          </select>
        </div>

        <div class="filter-item">
          <label for="f-anio" class="form-label">Año:</label>
          <input 
            id="f-anio" 
            type="number" 
            class="form-input" 
            style="width: 110px;" 
            bind:value={anioMensual} 
            on:change={cargarReporte}
          />
        </div>
      {/if}

      <button type="button" class="btn btn-primary btn-sm" on:click={cargarReporte} style="margin-top: auto;">
        Actualizar
      </button>
    </div>
  </div>

  {#if loading}
    <div class="loading-state card">
      <div class="spinner"></div>
      <p>Procesando datos y cálculos del reporte...</p>
    </div>
  {:else}
    <!-- Resumen de Métricas del Período -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div>
          <div class="kpi-title">Ingresos Válidos</div>
          <div class="kpi-value" style="color: #16a34a;">
            ${(activeTab === 'diario' ? reporteDiarioData.totalIngresos : activeTab === 'semanal' ? reporteSemanalData.totalIngresos : reporteMensualData.totalIngresos).toFixed(2)}
          </div>
          <div class="kpi-subtitle">Ingresos netos reconocidos</div>
        </div>
        <div class="kpi-icon-container" style="color: #16a34a; background-color: #f0fdf4;">
          <DollarSign size={22} />
        </div>
      </div>

      <div class="kpi-card">
        <div>
          <div class="kpi-title">Operaciones Válidas</div>
          <div class="kpi-value">
            {activeTab === 'diario' ? reporteDiarioData.totalOperaciones : activeTab === 'semanal' ? reporteSemanalData.totalOperaciones : reporteMensualData.totalOperaciones}
          </div>
          <div class="kpi-subtitle">Transacciones concretadas</div>
        </div>
        <div class="kpi-icon-container">
          <ShoppingBag size={22} />
        </div>
      </div>

      <div class="kpi-card">
        <div>
          <div class="kpi-title">Unidades Vendidas</div>
          <div class="kpi-value">
            {activeTab === 'diario' ? reporteDiarioData.unidadesVendidas : activeTab === 'semanal' ? reporteSemanalData.totalUnidades : reporteMensualData.totalUnidades}
          </div>
          <div class="kpi-subtitle">Artículos entregados</div>
        </div>
        <div class="kpi-icon-container">
          <Layers size={22} />
        </div>
      </div>

      <div class="kpi-card">
        <div>
          <div class="kpi-title">Operaciones Anuladas</div>
          <div class="kpi-value" style="color: var(--danger-accent);">
            {activeTab === 'diario' ? reporteDiarioData.totalAnuladas : activeTab === 'semanal' ? reporteSemanalData.totalAnuladas : reporteMensualData.totalAnuladas}
          </div>
          <div class="kpi-subtitle">No contabilizadas en total</div>
        </div>
        <div class="kpi-icon-container" style="color: var(--danger-accent); background-color: var(--danger-bg);">
          <FileText size={22} />
        </div>
      </div>
    </div>

    <!-- Si es Semanal: Resumen por día de la semana -->
    {#if activeTab === 'semanal'}
      <div class="card" style="margin-bottom: 24px;">
        <h3 style="margin-bottom: 14px;">Resumen Diario de la Semana</h3>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Día</th>
                <th>Fecha</th>
                <th>Operaciones</th>
                <th>Unidades</th>
                <th>Importe Total ($)</th>
              </tr>
            </thead>
            <tbody>
              {#each reporteSemanalData.resumenDias as d}
                <tr>
                  <td><strong>{d.dia}</strong></td>
                  <td>{d.fecha}</td>
                  <td>{d.operaciones}</td>
                  <td>{d.unidades}</td>
                  <td>
                    <strong style="color: {d.total > 0 ? 'var(--primary-700)' : 'var(--text-light)'};">
                      ${d.total.toFixed(2)}
                    </strong>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Si es Mensual: Gráfico de ventas por día del mes -->
    {#if activeTab === 'mensual'}
      <div class="card" style="margin-bottom: 24px;">
        <h3 style="margin-bottom: 14px;">Gráfico de Ventas del Mes por Día</h3>
        <div style="height: 280px;">
          <canvas bind:this={mensualCanvas}></canvas>
        </div>
      </div>
    {/if}

    <!-- Tabla de ventas del período -->
    <div class="card">
      <div class="card-header">
        <div>
          <h3>Detalle de Ventas del Período</h3>
          <span class="card-subtitle">Listado de transacciones (Las anuladas se muestran sólo con fines históricos)</span>
        </div>
      </div>

      {#if listaVentas.length === 0}
        <div class="empty-state">
          <FileText size={36} class="empty-state-icon" />
          <p>No existen operaciones de venta en el período seleccionado.</p>
        </div>
      {:else}
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Tienda</th>
                <th>Cant.</th>
                <th>Precio Unit.</th>
                <th>Total ($)</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {#each listaVentas as v}
                <tr style="opacity: {v.estado === 'anulada' ? '0.7' : '1'};">
                  <td>{new Date(v.fecha_hora).toLocaleString('es-ES')}</td>
                  <td><strong>{v.clientes?.nombre || 'Cliente'}</strong></td>
                  <td>{v.productos?.nombre || 'Producto'}</td>
                  <td>{v.productos?.tiendas?.nombre || '-'}</td>
                  <td>{v.cantidad}</td>
                  <td>${Number(v.precio_unitario).toFixed(2)}</td>
                  <td>
                    <strong style="color: {v.estado === 'valida' ? 'var(--primary-700)' : 'var(--danger-accent)'};">
                      ${Number(v.total).toFixed(2)}
                    </strong>
                  </td>
                  <td>
                    {#if v.estado === 'valida'}
                      <span class="badge badge-success">Válida</span>
                    {:else}
                      <span class="badge badge-danger">Anulada</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .tabs-container {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 8px;
  }

  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: none;
    background: transparent;
    border-radius: var(--radius-md);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tab-btn:hover {
    color: var(--text-main);
    background-color: #f1f5f9;
  }

  .tab-btn.active {
    color: var(--primary-700);
    background-color: var(--primary-50);
    font-weight: 600;
  }

  .period-filter-card {
    margin-bottom: 24px;
    padding: 16px 20px;
  }

  .filter-controls {
    display: flex;
    align-items: flex-end;
    gap: 16px;
    flex-wrap: wrap;
  }

  .filter-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .week-range-badge {
    align-self: center;
    font-size: 0.85rem;
    color: #1e40af;
    background-color: #eff6ff;
    padding: 6px 12px;
    border-radius: var(--radius-md);
    border: 1px solid #bfdbfe;
  }
</style>
