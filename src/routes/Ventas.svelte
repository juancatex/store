<script>
  import { onMount } from 'svelte';
  import { 
    ShoppingCart, 
    Plus, 
    Search, 
    Calendar, 
    Filter, 
    Eye, 
    Ban, 
    CheckCircle, 
    AlertCircle,
    Receipt,
    User,
    Package
  } from 'lucide-svelte';
  import { 
    listarVentas, 
    registrarVenta, 
    anularVenta 
  } from '../lib/services/ventaService.js';
  import { listarClientes } from '../lib/services/clienteService.js';
  import { listarProductos, calcularPrecioFinal } from '../lib/services/productoService.js';
  import { toast } from '../lib/services/toastService.js';
  import { isAdmin } from '../lib/services/authService.js';
  import Modal from '../lib/components/Modal.svelte';
  import ConfirmDialog from '../lib/components/ConfirmDialog.svelte';

  let ventas = [];
  let clientes = [];
  let productos = [];
  let loading = true;

  // Filtros
  let searchTerm = '';
  let filterFechaInicio = '';
  let filterFechaFin = '';
  let filterEstado = '';

  // Modal Registrar Venta
  let isRegisterModalOpen = false;
  let registerLoading = false;
  let formVenta = {
    id_cliente: '',
    id_producto: '',
    cantidad: 1
  };
  let formError = '';

  // Modal Detalle Venta
  let isDetailModalOpen = false;
  let ventaDetalle = null;

  // Confirmar Anulación
  let isConfirmAnularOpen = false;
  let targetVentaId = null;
  let anularLoading = false;

  async function cargarDatos() {
    try {
      loading = true;
      const [vList, cList, pList] = await Promise.all([
        listarVentas({
          search: searchTerm,
          fechaInicio: filterFechaInicio,
          fechaFin: filterFechaFin,
          estado: filterEstado
        }),
        listarClientes({ activo: true }),
        listarProductos({ activo: true })
      ]);
      ventas = vList;
      clientes = cList;
      productos = pList;
    } catch (err) {
      toast.error('Error al cargar ventas: ' + err.message);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    cargarDatos();
  });

  function openRegisterModal() {
    formVenta = {
      id_cliente: clientes.length > 0 ? clientes[0].id : '',
      id_producto: productos.length > 0 ? productos[0].id : '',
      cantidad: 1
    };
    formError = '';
    isRegisterModalOpen = true;
  }

  // Precios dinámicos calculados para el modal de registro
  $: selectedProduct = productos.find(p => p.id === formVenta.id_producto);
  $: precioUnitarioCalculado = selectedProduct ? calcularPrecioFinal(selectedProduct.precio, selectedProduct.oferta) : 0;
  $: totalCalculado = Math.round(precioUnitarioCalculado * (Number(formVenta.cantidad) || 0) * 100) / 100;

  async function guardarVenta() {
    formError = '';
    if (!formVenta.id_cliente) {
      formError = 'Seleccione un cliente.';
      return;
    }
    if (!formVenta.id_producto) {
      formError = 'Seleccione un producto.';
      return;
    }
    if (!formVenta.cantidad || formVenta.cantidad <= 0) {
      formError = 'La cantidad debe ser mayor a cero.';
      return;
    }

    try {
      registerLoading = true;
      await registrarVenta({
        id_cliente: formVenta.id_cliente,
        id_producto: formVenta.id_producto,
        cantidad: formVenta.cantidad
      });

      toast.success('¡Venta registrada con éxito!');
      isRegisterModalOpen = false;
      await cargarDatos();
    } catch (err) {
      formError = err.message;
      toast.error(formError);
    } finally {
      registerLoading = false;
    }
  }

  function verDetalle(v) {
    ventaDetalle = v;
    isDetailModalOpen = true;
  }

  function promptAnular(v) {
    if (v.estado === 'anulada') {
      toast.info('Esta venta ya se encuentra anulada.');
      return;
    }
    targetVentaId = v.id;
    isConfirmAnularOpen = true;
  }

  async function confirmarAnulacion() {
    if (!targetVentaId) return;
    try {
      anularLoading = true;
      await anularVenta(targetVentaId);
      toast.success('La venta ha sido anulada con éxito.');
      isConfirmAnularOpen = false;
      targetVentaId = null;
      await cargarDatos();
    } catch (err) {
      toast.error('Error al anular venta: ' + err.message);
    } finally {
      anularLoading = false;
    }
  }

  function limpiarFiltros() {
    searchTerm = '';
    filterFechaInicio = '';
    filterFechaFin = '';
    filterEstado = '';
    cargarDatos();
  }
</script>

<div class="ventas-view">
  <div class="page-header">
    <div class="page-header-info">
      <h1>{isAdmin() ? 'Gestión de Ventas' : 'Mis Compras Realizadas'}</h1>
      <p>Registro transaccional, consulta de comprobantes y control de anulaciones</p>
    </div>
    {#if isAdmin()}
      <div class="page-header-actions">
        <button type="button" class="btn btn-primary" on:click={openRegisterModal}>
          <Plus size={18} />
          <span>Registrar Nueva Venta</span>
        </button>
      </div>
    {/if}
  </div>

  <div class="card">
    <!-- Toolbar de filtros avanzados -->
    <div class="table-toolbar">
      <div class="search-input-wrapper">
        <Search size={18} class="search-icon" />
        <input 
          type="text" 
          class="form-input" 
          placeholder="Buscar por cliente o producto..." 
          bind:value={searchTerm}
          on:input={cargarDatos}
        />
      </div>

      <div class="filter-group">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Desde:</span>
          <input 
            type="date" 
            class="form-input" 
            style="padding: 6px 10px; width: 140px;" 
            bind:value={filterFechaInicio}
            on:change={cargarDatos}
          />
        </div>

        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Hasta:</span>
          <input 
            type="date" 
            class="form-input" 
            style="padding: 6px 10px; width: 140px;" 
            bind:value={filterFechaFin}
            on:change={cargarDatos}
          />
        </div>

        <select class="form-select" bind:value={filterEstado} on:change={cargarDatos} style="min-width: 130px;">
          <option value="">Todos los Estados</option>
          <option value="valida">Válidas</option>
          <option value="anulada">Anuladas</option>
        </select>

        {#if searchTerm || filterFechaInicio || filterFechaFin || filterEstado}
          <button type="button" class="btn btn-secondary btn-sm" on:click={limpiarFiltros}>
            Limpiar
          </button>
        {/if}
      </div>
    </div>

    <!-- Tabla de ventas -->
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Consultando registro transaccional en Supabase...</p>
      </div>
    {:else if ventas.length === 0}
      <div class="empty-state">
        <ShoppingCart size={36} class="empty-state-icon" />
        <p>No se encontraron registros de ventas con los filtros aplicados.</p>
      </div>
    {:else}
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Cliente</th>
              <th>Producto y Tienda</th>
              <th>Cant.</th>
              <th>Precio Unit.</th>
              <th>Total ($)</th>
              <th>Estado</th>
              <th style="text-align: right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each ventas as v}
              <tr class:row-anulada={v.estado === 'anulada'}>
                <td>
                  <strong>{new Date(v.fecha_hora).toLocaleDateString('es-ES')}</strong>
                  <div style="font-size: 0.74rem; color: var(--text-muted);">
                    {new Date(v.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td>
                  <strong>{v.clientes?.nombre || 'Cliente'}</strong>
                  {#if v.clientes?.correo}
                    <div style="font-size: 0.74rem; color: var(--text-muted);">{v.clientes.correo}</div>
                  {/if}
                </td>
                <td>
                  <strong>{v.productos?.nombre || 'Producto'}</strong>
                  {#if v.productos?.tiendas?.nombre}
                    <div style="font-size: 0.74rem; color: var(--text-light);">
                      {v.productos.tiendas.nombre}
                    </div>
                  {/if}
                </td>
                <td>{v.cantidad}</td>
                <td>${Number(v.precio_unitario).toFixed(2)}</td>
                <td>
                  <strong style="font-size: 0.95rem; color: {v.estado === 'valida' ? 'var(--primary-700)' : 'var(--text-light)'};">
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
                <td style="text-align: right;">
                  <button 
                    type="button" 
                    class="btn-icon" 
                    title="Ver comprobante y detalle" 
                    on:click={() => verDetalle(v)}
                  >
                    <Eye size={16} />
                  </button>
                  {#if isAdmin() && v.estado === 'valida'}
                    <button 
                      type="button" 
                      class="btn-icon danger" 
                      title="Anular venta" 
                      on:click={() => promptAnular(v)}
                    >
                      <Ban size={16} />
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Modal Registrar Venta -->
<Modal
  isOpen={isRegisterModalOpen}
  title="Registrar Operación de Venta"
  size="md"
  on:close={() => (isRegisterModalOpen = false)}
>
  {#if formError}
    <div class="alert-error" style="margin-bottom: 16px;">
      {formError}
    </div>
  {/if}

  <form on:submit|preventDefault={guardarVenta} id="form-venta">
    <!-- Selección de Cliente -->
    <div class="form-group">
      <label for="v-cliente" class="form-label">
        Cliente <span class="required">*</span>
      </label>
      <select id="v-cliente" class="form-select" bind:value={formVenta.id_cliente} disabled={registerLoading} required>
        <option value="" disabled>-- Seleccione un cliente --</option>
        {#each clientes as c}
          <option value={c.id}>{c.nombre} ({c.correo})</option>
        {/each}
      </select>
    </div>

    <!-- Selección de Producto -->
    <div class="form-group">
      <label for="v-producto" class="form-label">
        Producto <span class="required">*</span>
      </label>
      <select id="v-producto" class="form-select" bind:value={formVenta.id_producto} disabled={registerLoading} required>
        <option value="" disabled>-- Seleccione un producto --</option>
        {#each productos as p}
          <option value={p.id}>
            {p.nombre} - ${calcularPrecioFinal(p.precio, p.oferta).toFixed(2)} 
            {p.oferta > 0 ? `(${p.oferta}% desc)` : ''}
          </option>
        {/each}
      </select>
    </div>

    <!-- Cantidad -->
    <div class="form-group">
      <label for="v-cantidad" class="form-label">
        Cantidad de Unidades <span class="required">*</span>
      </label>
      <input 
        id="v-cantidad" 
        type="number" 
        min="1" 
        step="1" 
        class="form-input" 
        bind:value={formVenta.cantidad}
        disabled={registerLoading}
        required
      />
    </div>

    <!-- Resumen de Cálculo Inmediato -->
    <div class="sale-preview-box">
      <div class="preview-row">
        <span>Precio Unitario Aplicado:</span>
        <strong>${precioUnitarioCalculado.toFixed(2)}</strong>
      </div>
      <div class="preview-row">
        <span>Cantidad:</span>
        <strong>{formVenta.cantidad || 0}</strong>
      </div>
      <div class="preview-row total-row">
        <span>Importe Total:</span>
        <span class="total-amount">${totalCalculado.toFixed(2)}</span>
      </div>
    </div>
  </form>

  <div slot="footer">
    <button type="button" class="btn btn-secondary" on:click={() => (isRegisterModalOpen = false)} disabled={registerLoading}>
      Cancelar
    </button>
    <button type="submit" form="form-venta" class="btn btn-primary" disabled={registerLoading}>
      {#if registerLoading}
        <span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span>
      {/if}
      <span>Confirmar Venta</span>
    </button>
  </div>
</Modal>

<!-- Modal Detalle de Venta -->
<Modal
  isOpen={isDetailModalOpen}
  title="Comprobante de Venta"
  size="md"
  on:close={() => (isDetailModalOpen = false)}
>
  {#if ventaDetalle}
    <div class="receipt-container">
      <div class="receipt-header">
        <Receipt size={36} color="#2563eb" />
        <h3>Comprobante de Transacción</h3>
        <span class="receipt-id">ID: {ventaDetalle.id}</span>
      </div>

      <div class="receipt-details">
        <div class="receipt-item">
          <span>Fecha y Hora:</span>
          <strong>{new Date(ventaDetalle.fecha_hora).toLocaleString('es-ES')}</strong>
        </div>
        <div class="receipt-item">
          <span>Cliente:</span>
          <strong>{ventaDetalle.clientes?.nombre} ({ventaDetalle.clientes?.correo})</strong>
        </div>
        <div class="receipt-item">
          <span>Producto Adquirido:</span>
          <strong>{ventaDetalle.productos?.nombre}</strong>
        </div>
        {#if ventaDetalle.productos?.tiendas?.nombre}
          <div class="receipt-item">
            <span>Tienda:</span>
            <strong>{ventaDetalle.productos.tiendas.nombre}</strong>
          </div>
        {/if}
        <div class="receipt-item">
          <span>Precio Unitario Congelado:</span>
          <strong>${Number(ventaDetalle.precio_unitario).toFixed(2)}</strong>
        </div>
        <div class="receipt-item">
          <span>Cantidad:</span>
          <strong>{ventaDetalle.cantidad}</strong>
        </div>
        <div class="receipt-item">
          <span>Estado de la Operación:</span>
          <span>
            {#if ventaDetalle.estado === 'valida'}
              <span class="badge badge-success">Válida</span>
            {:else}
              <span class="badge badge-danger">Anulada</span>
            {/if}
          </span>
        </div>
        <div class="receipt-item receipt-total">
          <span>Total Facturado:</span>
          <span class="receipt-total-val">${Number(ventaDetalle.total).toFixed(2)}</span>
        </div>
      </div>
    </div>
  {/if}

  <div slot="footer">
    <button type="button" class="btn btn-secondary" on:click={() => (isDetailModalOpen = false)}>
      Cerrar
    </button>
  </div>
</Modal>

<!-- Modal Confirmación Anulación -->
<ConfirmDialog 
  isOpen={isConfirmAnularOpen}
  title="¿Anular venta?"
  message="La venta cambiará a estado 'anulada'. El historial se conservará para auditoría pero los ingresos se descontarán de los reportes y estadísticas."
  confirmText="Sí, anular venta"
  confirmType="danger"
  isLoading={anularLoading}
  on:confirm={confirmarAnulacion}
  on:cancel={() => (isConfirmAnularOpen = false)}
/>

<style>
  .row-anulada td {
    background-color: #fffbfb;
    opacity: 0.8;
  }

  .sale-preview-box {
    background-color: #f8fafc;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 16px;
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .preview-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.88rem;
    color: var(--text-muted);
  }

  .preview-row.total-row {
    margin-top: 6px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);
    font-size: 1rem;
    color: var(--text-main);
  }

  .total-amount {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--primary-600);
  }

  .receipt-container {
    padding: 10px 0;
  }

  .receipt-header {
    text-align: center;
    margin-bottom: 20px;
  }

  .receipt-header h3 {
    margin-top: 8px;
    font-size: 1.2rem;
  }

  .receipt-id {
    font-size: 0.72rem;
    color: var(--text-light);
    font-family: monospace;
  }

  .receipt-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: #f8fafc;
    padding: 16px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
  }

  .receipt-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.88rem;
  }

  .receipt-item span:first-child {
    color: var(--text-muted);
  }

  .receipt-total {
    margin-top: 8px;
    padding-top: 10px;
    border-top: 1px dashed var(--border-color);
    font-size: 1.05rem;
    font-weight: 600;
  }

  .receipt-total-val {
    color: var(--primary-700);
    font-size: 1.25rem;
  }
</style>
