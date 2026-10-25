<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { 
    DollarSign, 
    Calendar, 
    TrendingUp, 
    Package, 
    Users, 
    PlusCircle, 
    ArrowRight,
    ShoppingBag,
    Eye,
    Sparkles,
    Store,
    BarChart3,
    ArrowUpRight,
    Clock
  } from 'lucide-svelte';
  import { Chart, registerables } from 'chart.js';
  import { obtenerDatosDashboard } from '../lib/services/dashboardService.js';
  import { isAdmin, getCurrentProfile } from '../lib/services/authService.js';

  Chart.register(...registerables);

  const dispatch = createEventDispatcher();
  const currentProfile = getCurrentProfile();

  let loading = true;
  let dashboardData = {
    kpis: {
      ventasHoy: 0,
      ventasHoyCount: 0,
      ventasSemana: 0,
      ventasSemanaCount: 0,
      ventasMes: 0,
      ventasMesCount: 0,
      totalProductos: 0,
      totalClientes: 0
    },
    productosTop: [],
    grafico7Dias: [],
    ultimasVentas: []
  };

  let chartCanvas;
  let chartInstance = null;

  // Saludo dinámico según la hora local
  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 
    ? '¡Buenos días!' 
    : horaActual < 19 
      ? '¡Buenas tardes!' 
      : '¡Buenas noches!';

  const fechaHoyFormateada = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  async function loadData() {
    try {
      loading = true;
      dashboardData = await obtenerDatosDashboard();
      initOrUpdateChart();
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
    } finally {
      loading = false;
    }
  }

  function initOrUpdateChart() {
    if (!chartCanvas || !dashboardData.grafico7Dias.length) return;

    if (chartInstance) {
      chartInstance.destroy();
    }

    const labels = dashboardData.grafico7Dias.map(d => d.etiqueta);
    const dataValues = dashboardData.grafico7Dias.map(d => d.total);

    const ctx = chartCanvas.getContext('2d');
    
    // Gradiente dinámico para las barras
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(0.5, '#3b82f6');
    gradient.addColorStop(1, '#60a5fa');

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ingresos ($)',
          data: dataValues,
          backgroundColor: gradient,
          borderRadius: 8,
          borderSkipped: false,
          hoverBackgroundColor: '#2563eb'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#ffffff',
            bodyColor: '#e0e7ff',
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: (context) => ` Total ventas: $${Number(context.raw).toFixed(2)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `$${value}`,
              color: '#64748b',
              font: { family: 'Inter', size: 11 }
            },
            grid: {
              color: '#f1f5f9'
            },
            border: { dash: [4, 4], color: 'transparent' }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#475569',
              font: { family: 'Inter', weight: '500', size: 12 }
            }
          }
        }
      }
    });
  }

  onMount(() => {
    loadData();
  });

  onDestroy(() => {
    if (chartInstance) {
      chartInstance.destroy();
    }
  });

  function goTo(route) {
    dispatch('navigate', route);
  }

  // Cálculo de porcentaje para las barras del top productos
  $: maxUnidades = dashboardData.productosTop.length > 0 
    ? Math.max(...dashboardData.productosTop.map(p => p.unidades)) 
    : 1;
</script>

<div class="dashboard-container">
  <!-- Banner Hero Comercial con Gradiente y Accesos Rápidos -->
  <div class="welcome-banner">
    <div class="banner-glow"></div>
    <div class="banner-content">
      <div class="banner-left">
        <div class="date-tag">
          <Clock size={13} />
          <span>{fechaHoyFormateada}</span>
        </div>
        <h1>{saludo} {currentProfile?.nombre_completo || 'Usuario'}</h1>
        <p>
          Panel comercial activo. Aquí tienes el pulso de las operaciones, inventario y facturación de la tienda.
        </p>
      </div>

      {#if isAdmin()}
        <div class="banner-actions">
          <button type="button" class="action-btn primary" on:click={() => goTo('ventas')}>
            <PlusCircle size={18} />
            <span>Nueva Venta</span>
          </button>
          <button type="button" class="action-btn secondary" on:click={() => goTo('productos')}>
            <Package size={18} />
            <span>Catálogo</span>
          </button>
          <button type="button" class="action-btn tertiary" on:click={() => goTo('reportes')}>
            <BarChart3 size={18} />
            <span>Reportes</span>
          </button>
        </div>
      {/if}
    </div>
  </div>

  {#if loading}
    <div class="loading-state card">
      <div class="spinner"></div>
      <p>Cargando indicadores en vivo desde Supabase...</p>
    </div>
  {:else}
    <!-- Grid de Tarjetas KPI Vistosas y Coloridas -->
    <div class="vibrant-kpi-grid">
      <!-- 1. Ventas de Hoy (Verde Esmeralda) -->
      <div class="colorful-kpi card-emerald">
        <div class="kpi-top">
          <span class="kpi-tag">Ventas de Hoy</span>
          <div class="kpi-icon-bubble emerald">
            <DollarSign size={20} />
          </div>
        </div>
        <div class="kpi-amount">${dashboardData.kpis.ventasHoy.toFixed(2)}</div>
        <div class="kpi-footer">
          <span class="micro-badge emerald">
            <ArrowUpRight size={13} />
            {dashboardData.kpis.ventasHoyCount} ventas
          </span>
          <span class="kpi-foot-text">Operaciones de hoy</span>
        </div>
      </div>

      <!-- 2. Ventas de la Semana (Azul Índigo) -->
      <div class="colorful-kpi card-indigo">
        <div class="kpi-top">
          <span class="kpi-tag">Esta Semana</span>
          <div class="kpi-icon-bubble indigo">
            <Calendar size={20} />
          </div>
        </div>
        <div class="kpi-amount">${dashboardData.kpis.ventasSemana.toFixed(2)}</div>
        <div class="kpi-footer">
          <span class="micro-badge indigo">
            {dashboardData.kpis.ventasSemanaCount} ventas
          </span>
          <span class="kpi-foot-text">Lunes a domingo</span>
        </div>
      </div>

      <!-- 3. Ventas del Mes (Púrpura / Violeta) -->
      <div class="colorful-kpi card-purple">
        <div class="kpi-top">
          <span class="kpi-tag">Este Mes</span>
          <div class="kpi-icon-bubble purple">
            <TrendingUp size={20} />
          </div>
        </div>
        <div class="kpi-amount">${dashboardData.kpis.ventasMes.toFixed(2)}</div>
        <div class="kpi-footer">
          <span class="micro-badge purple">
            {dashboardData.kpis.ventasMesCount} transacciones
          </span>
          <span class="kpi-foot-text">Acumulado mensual</span>
        </div>
      </div>

      <!-- 4. Productos Activos (Ámbar / Naranja) -->
      <div class="colorful-kpi card-amber">
        <div class="kpi-top">
          <span class="kpi-tag">Productos</span>
          <div class="kpi-icon-bubble amber">
            <Package size={20} />
          </div>
        </div>
        <div class="kpi-amount">{dashboardData.kpis.totalProductos}</div>
        <div class="kpi-footer">
          <span class="micro-badge amber">Catálogo activo</span>
          <span class="kpi-foot-text">Listos para vender</span>
        </div>
      </div>

      <!-- 5. Clientes en Cartera (Rosa / Magenta) -->
      <div class="colorful-kpi card-rose">
        <div class="kpi-top">
          <span class="kpi-tag">Clientes</span>
          <div class="kpi-icon-bubble rose">
            <Users size={20} />
          </div>
        </div>
        <div class="kpi-amount">{dashboardData.kpis.totalClientes}</div>
        <div class="kpi-footer">
          <span class="micro-badge rose">Fidelizados</span>
          <span class="kpi-foot-text">Cartera comercial</span>
        </div>
      </div>
    </div>

    <!-- Sección Media: Gráfico de Tendencia + Top Productos más Vendidos -->
    <div class="dashboard-main-grid">
      <!-- Tarjeta de Gráfico -->
      <div class="card chart-section">
        <div class="section-header">
          <div>
            <h3>Evolución de Ingresos</h3>
            <span class="section-subtitle">Ventas diarias efectivas de los últimos 7 días</span>
          </div>
          <div class="chart-legend-badge">
            <div class="legend-color-dot"></div>
            <span>Ventas netas</span>
          </div>
        </div>
        <div class="chart-canvas-box">
          <canvas bind:this={chartCanvas}></canvas>
        </div>
      </div>

      <!-- Tarjeta de Productos con Mayor Movimiento -->
      <div class="card top-products-section">
        <div class="section-header">
          <div>
            <h3>Mayor Movimiento</h3>
            <span class="section-subtitle">Top productos con más unidades vendidas</span>
          </div>
          <button type="button" class="text-link-btn" on:click={() => goTo('productos')}>
            Ver todos
          </button>
        </div>

        <div class="top-list">
          {#if dashboardData.productosTop.length === 0}
            <div class="empty-state-mini">
              <Package size={28} color="#cbd5e1" />
              <p>Aún no hay transacciones para generar el ranking.</p>
            </div>
          {:else}
            {#each dashboardData.productosTop as prod, idx}
              {@const pct = Math.round((prod.unidades / maxUnidades) * 100)}
              <div class="ranking-row">
                <div class="rank-medal rank-{idx + 1}">
                  {idx + 1}
                </div>
                <div class="ranking-details">
                  <div class="ranking-title-row">
                    <strong class="prod-name">{prod.nombre}</strong>
                    <span class="prod-total">${prod.montoTotal.toFixed(2)}</span>
                  </div>
                  <!-- Barra de progreso visual -->
                  <div class="progress-track">
                    <div 
                      class="progress-fill fill-{idx % 3}" 
                      style="width: {pct}%;"
                    ></div>
                  </div>
                  <div class="ranking-meta-row">
                    <span>{prod.unidades} unidades comercializadas</span>
                    <span>{pct}% del líder</span>
                  </div>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>

    <!-- Sección Inferior: Tabla de Transacciones Recientes -->
    <div class="card recent-transactions-card">
      <div class="section-header">
        <div>
          <h3>Últimas Transacciones Registradas</h3>
          <span class="section-subtitle">Operaciones recientes procesadas en el sistema comercial</span>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" on:click={() => goTo('ventas')}>
          <span>Ir a Gestión de Ventas</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {#if dashboardData.ultimasVentas.length === 0}
        <div class="empty-state">
          <ShoppingBag size={36} class="empty-state-icon" />
          <p>No hay ventas registradas aún. ¡Registra la primera venta!</p>
        </div>
      {:else}
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Cliente</th>
                <th>Producto y Sucursal</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total ($)</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {#each dashboardData.ultimasVentas as v}
                <tr>
                  <td>
                    <div class="cell-date">
                      <strong>{new Date(v.fecha_hora).toLocaleDateString('es-ES')}</strong>
                      <span>{new Date(v.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td>
                    <div class="customer-cell">
                      <div class="customer-avatar-badge">
                        {v.clientes?.nombre ? v.clientes.nombre.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <strong>{v.clientes?.nombre || 'Cliente'}</strong>
                        {#if v.clientes?.correo}
                          <span class="sub-email">{v.clientes.correo}</span>
                        {/if}
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{v.productos?.nombre || 'Producto'}</strong>
                    {#if v.productos?.tiendas?.nombre}
                      <span class="store-pill">{v.productos.tiendas.nombre}</span>
                    {/if}
                  </td>
                  <td>
                    <span class="badge" style="background:#f1f5f9; color:#334155; font-size:0.85rem;">
                      {v.cantidad} un.
                    </span>
                  </td>
                  <td>${Number(v.precio_unitario).toFixed(2)}</td>
                  <td>
                    <strong class="total-cell-val" class:strike={v.estado === 'anulada'}>
                      ${Number(v.total).toFixed(2)}
                    </strong>
                  </td>
                  <td>
                    {#if v.estado === 'valida'}
                      <span class="status-tag status-success">
                        <span class="status-dot"></span> Válida
                      </span>
                    {:else}
                      <span class="status-tag status-danger">
                        <span class="status-dot"></span> Anulada
                      </span>
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
  .dashboard-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* ==========================================================================
     Banner Hero Comercial
     ========================================================================== */
  .welcome-banner {
    position: relative;
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4338ca 70%, #6366f1 100%);
    border-radius: 20px;
    padding: 32px 36px;
    color: #ffffff;
    overflow: hidden;
    box-shadow: 0 12px 28px -6px rgba(49, 46, 129, 0.35);
  }

  @media (max-width: 768px) {
    .welcome-banner {
      padding: 24px 20px;
    }
  }

  .banner-glow {
    position: absolute;
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(236, 72, 153, 0.2) 50%, transparent 70%);
    top: -80px;
    right: -40px;
    filter: blur(50px);
    pointer-events: none;
  }

  .banner-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  .banner-left {
    max-width: 620px;
  }

  .date-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 0.78rem;
    font-weight: 500;
    color: #f1f5f9;
    margin-bottom: 12px;
    text-transform: capitalize;
  }

  .banner-left h1 {
    font-size: 1.85rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.2;
    letter-spacing: -0.02em;
    margin-bottom: 8px;
  }

  @media (max-width: 640px) {
    .banner-left h1 {
      font-size: 1.4rem;
    }
  }

  .banner-left p {
    font-size: 0.94rem;
    color: #e0e7ff;
    line-height: 1.5;
  }

  .banner-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 18px;
    border-radius: 12px;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .action-btn.primary {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
  }

  .action-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 18px rgba(16, 185, 129, 0.5);
  }

  .action-btn.secondary {
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #ffffff;
  }

  .action-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.28);
    transform: translateY(-2px);
  }

  .action-btn.tertiary {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: #ffffff;
  }

  .action-btn.tertiary:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
  }

  /* ==========================================================================
     Tarjetas KPI Vistosas y Coloridas
     ========================================================================== */
  .vibrant-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 16px;
  }

  .colorful-kpi {
    border-radius: 18px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid transparent;
  }

  .colorful-kpi:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.08);
  }

  /* Variaciones cromáticas de tarjetas */
  .card-emerald {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border-color: #bbf7d0;
  }
  .card-emerald:hover { box-shadow: 0 12px 24px -6px rgba(16, 185, 129, 0.22); }

  .card-indigo {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border-color: #bfdbfe;
  }
  .card-indigo:hover { box-shadow: 0 12px 24px -6px rgba(59, 130, 246, 0.22); }

  .card-purple {
    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
    border-color: #ddd6fe;
  }
  .card-purple:hover { box-shadow: 0 12px 24px -6px rgba(139, 92, 246, 0.22); }

  .card-amber {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    border-color: #fde68a;
  }
  .card-amber:hover { box-shadow: 0 12px 24px -6px rgba(245, 158, 11, 0.22); }

  .card-rose {
    background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
    border-color: #fbcfe8;
  }
  .card-rose:hover { box-shadow: 0 12px 24px -6px rgba(236, 72, 153, 0.22); }

  .kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .kpi-tag {
    font-size: 0.76rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #475569;
  }

  .kpi-icon-bubble {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .kpi-icon-bubble.emerald { background: #10b981; color: #ffffff; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.35); }
  .kpi-icon-bubble.indigo  { background: #3b82f6; color: #ffffff; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.35); }
  .kpi-icon-bubble.purple  { background: #8b5cf6; color: #ffffff; box-shadow: 0 4px 10px rgba(139, 92, 246, 0.35); }
  .kpi-icon-bubble.amber   { background: #f59e0b; color: #ffffff; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.35); }
  .kpi-icon-bubble.rose    { background: #ec4899; color: #ffffff; box-shadow: 0 4px 10px rgba(236, 72, 153, 0.35); }

  .kpi-amount {
    font-size: 1.85rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
    line-height: 1.15;
    margin-bottom: 12px;
  }

  .kpi-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .micro-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
  }
  .micro-badge.emerald { background: rgba(16, 185, 129, 0.2); color: #065f46; }
  .micro-badge.indigo  { background: rgba(59, 130, 246, 0.2); color: #1e40af; }
  .micro-badge.purple  { background: rgba(139, 92, 246, 0.2); color: #5b21b6; }
  .micro-badge.amber   { background: rgba(245, 158, 11, 0.2); color: #92400e; }
  .micro-badge.rose    { background: rgba(236, 72, 153, 0.2); color: #9d174d; }

  .kpi-foot-text {
    font-size: 0.74rem;
    color: #64748b;
  }

  /* ==========================================================================
     Sección Media: Gráficos y Top Productos
     ========================================================================== */
  .dashboard-main-grid {
    display: grid;
    grid-template-columns: 1.75fr 1fr;
    gap: 20px;
  }

  @media (max-width: 960px) {
    .dashboard-main-grid {
      grid-template-columns: 1fr;
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .section-header h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.01em;
  }

  .section-subtitle {
    font-size: 0.78rem;
    color: #64748b;
    display: block;
    margin-top: 2px;
  }

  .chart-legend-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    color: #475569;
    background: #f8fafc;
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .legend-color-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #4f46e5;
  }

  .chart-canvas-box {
    height: 290px;
    position: relative;
  }

  .text-link-btn {
    background: transparent;
    border: none;
    color: #3b82f6;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }
  .text-link-btn:hover {
    text-decoration: underline;
  }

  .top-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .ranking-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 12px;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    transition: background 0.15s ease;
  }

  .ranking-row:hover {
    background-color: #f1f5f9;
  }

  .rank-medal {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 800;
    flex-shrink: 0;
  }
  .rank-1 { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3); }
  .rank-2 { background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%); color: #ffffff; }
  .rank-3 { background: linear-gradient(135deg, #b45309 0%, #92400e 100%); color: #ffffff; }
  .rank-4, .rank-5 { background: #e2e8f0; color: #475569; }

  .ranking-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .ranking-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .prod-name {
    font-size: 0.88rem;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 170px;
  }

  .prod-total {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1e40af;
  }

  .progress-track {
    width: 100%;
    height: 6px;
    background-color: #e2e8f0;
    border-radius: 9999px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 0.4s ease;
  }
  .fill-0 { background: linear-gradient(90deg, #4f46e5 0%, #3b82f6 100%); }
  .fill-1 { background: linear-gradient(90deg, #10b981 0%, #34d399 100%); }
  .fill-2 { background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%); }

  .ranking-meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.72rem;
    color: #64748b;
  }

  .empty-state-mini {
    text-align: center;
    padding: 30px 10px;
    color: #94a3b8;
    font-size: 0.85rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  /* ==========================================================================
     Tabla de Transacciones Recientes
     ========================================================================== */
  .cell-date {
    display: flex;
    flex-direction: column;
    font-size: 0.84rem;
  }
  .cell-date span {
    font-size: 0.72rem;
    color: #64748b;
  }

  .customer-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .customer-avatar-badge {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.8rem;
    flex-shrink: 0;
  }

  .sub-email {
    display: block;
    font-size: 0.72rem;
    color: #64748b;
  }

  .store-pill {
    display: block;
    font-size: 0.72rem;
    color: #3b82f6;
    background: #eff6ff;
    padding: 2px 6px;
    border-radius: 4px;
    width: fit-content;
    margin-top: 2px;
  }

  .total-cell-val {
    font-size: 0.96rem;
    color: #0f172a;
  }

  .total-cell-val.strike {
    text-decoration: line-through;
    color: #94a3b8;
  }

  .status-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 0.76rem;
    font-weight: 600;
  }

  .status-tag.status-success {
    background-color: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .status-tag.status-danger {
    background-color: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .status-success .status-dot { background-color: #10b981; }
  .status-danger .status-dot  { background-color: #ef4444; }
</style>
