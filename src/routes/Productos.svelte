<script>
  import { onMount } from 'svelte';
  import { 
    Package, 
    Plus, 
    Search, 
    Edit2, 
    Archive, 
    CheckCircle, 
    Tag, 
    Store,
    DollarSign,
    Percent
  } from 'lucide-svelte';
  import { 
    listarProductos, 
    crearProducto, 
    editarProducto, 
    cambiarEstadoProducto,
    calcularPrecioFinal 
  } from '../lib/services/productoService.js';
  import { listarTiendas } from '../lib/services/tiendaService.js';
  import { toast } from '../lib/services/toastService.js';
  import { isAdmin } from '../lib/services/authService.js';
  import Modal from '../lib/components/Modal.svelte';
  import ConfirmDialog from '../lib/components/ConfirmDialog.svelte';

  let productos = [];
  let tiendas = [];
  let loading = true;
  let searchTerm = '';
  let filterTienda = '';
  let filterActivo = '';

  // Modal Crear / Editar
  let isModalOpen = false;
  let isEditing = false;
  let modalLoading = false;
  let editingId = null;

  let formProducto = {
    nombre: '',
    descripcion: '',
    precio: '',
    oferta: 0,
    id_tienda: '',
    activo: true
  };
  let formError = '';

  // Confirmación
  let isConfirmOpen = false;
  let targetProducto = null;
  let confirmLoading = false;

  async function cargarDatos() {
    try {
      loading = true;
      const [pList, tList] = await Promise.all([
        listarProductos({
          search: searchTerm,
          id_tienda: filterTienda,
          activo: filterActivo
        }),
        listarTiendas({ activo: true })
      ]);
      productos = pList;
      tiendas = tList;
    } catch (err) {
      toast.error('Error al cargar productos: ' + err.message);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    cargarDatos();
  });

  function openCreateModal() {
    isEditing = false;
    editingId = null;
    formProducto = {
      nombre: '',
      descripcion: '',
      precio: '',
      oferta: 0,
      id_tienda: tiendas.length > 0 ? tiendas[0].id : '',
      activo: true
    };
    formError = '';
    isModalOpen = true;
  }

  function openEditModal(p) {
    isEditing = true;
    editingId = p.id;
    formProducto = {
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio: p.precio,
      oferta: p.oferta || 0,
      id_tienda: p.id_tienda,
      activo: p.activo
    };
    formError = '';
    isModalOpen = true;
  }

  async function guardarProducto() {
    formError = '';
    try {
      modalLoading = true;
      if (isEditing) {
        await editarProducto(editingId, formProducto);
        toast.success('Producto actualizado exitosamente.');
      } else {
        await crearProducto(formProducto);
        toast.success('Producto creado y agregado al catálogo.');
      }
      isModalOpen = false;
      await cargarDatos();
    } catch (err) {
      formError = err.message;
      toast.error(formError);
    } finally {
      modalLoading = false;
    }
  }

  function promptToggleEstado(p) {
    targetProducto = p;
    isConfirmOpen = true;
  }

  async function confirmarToggleEstado() {
    if (!targetProducto) return;
    try {
      confirmLoading = true;
      const nuevoEstado = !targetProducto.activo;
      await cambiarEstadoProducto(targetProducto.id, nuevoEstado);
      toast.success(`Producto ${nuevoEstado ? 'activado' : 'desactivado'} con éxito.`);
      isConfirmOpen = false;
      targetProducto = null;
      await cargarDatos();
    } catch (err) {
      toast.error('Error al cambiar estado: ' + err.message);
    } finally {
      confirmLoading = false;
    }
  }

  $: previewPrecioFinal = calcularPrecioFinal(formProducto.precio, formProducto.oferta);
</script>

<div class="productos-view">
  <div class="page-header">
    <div class="page-header-info">
      <h1>{isAdmin() ? 'Mantenimiento de Productos' : 'Catálogo de Productos'}</h1>
      <p>Gestión de precios, descuentos por oferta y tiendas asociadas</p>
    </div>
    {#if isAdmin()}
      <div class="page-header-actions">
        <button type="button" class="btn btn-primary" on:click={openCreateModal}>
          <Plus size={18} />
          <span>Nuevo Producto</span>
        </button>
      </div>
    {/if}
  </div>

  <div class="card">
    <div class="table-toolbar">
      <div class="search-input-wrapper">
        <Search size={18} class="search-icon" />
        <input 
          type="text" 
          class="form-input" 
          placeholder="Buscar por nombre o descripción..." 
          bind:value={searchTerm}
          on:input={cargarDatos}
        />
      </div>

      <div class="filter-group">
        <select class="form-select" bind:value={filterTienda} on:change={cargarDatos} style="min-width: 170px;">
          <option value="">Todas las Tiendas</option>
          {#each tiendas as t}
            <option value={t.id}>{t.nombre}</option>
          {/each}
        </select>

        {#if isAdmin()}
          <select class="form-select" bind:value={filterActivo} on:change={cargarDatos} style="min-width: 130px;">
            <option value="">Todos los Estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        {/if}
      </div>
    </div>

    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Consultando catálogo de productos...</p>
      </div>
    {:else if productos.length === 0}
      <div class="empty-state">
        <Package size={36} class="empty-state-icon" />
        <p>No se encontraron productos con los criterios de búsqueda actuales.</p>
      </div>
    {:else}
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre del Producto</th>
              <th>Tienda</th>
              <th>Precio Lista</th>
              <th>Oferta / Descuento</th>
              <th>Precio Final</th>
              <th>Estado</th>
              {#if isAdmin()}
                <th style="text-align: right;">Acciones</th>
              {/if}
            </tr>
          </thead>
          <tbody>
            {#each productos as p}
              {@const pFinal = calcularPrecioFinal(p.precio, p.oferta)}
              <tr>
                <td>
                  <strong>{p.nombre}</strong>
                  {#if p.descripcion}
                    <div style="font-size: 0.76rem; color: var(--text-muted); max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      {p.descripcion}
                    </div>
                  {/if}
                </td>
                <td>
                  <span class="badge" style="background: #f1f5f9; color: #475569;">
                    {p.tiendas?.nombre || 'General'}
                  </span>
                </td>
                <td>
                  {#if p.oferta > 0}
                    <span style="text-decoration: line-through; color: var(--text-light); font-size: 0.85rem;">
                      ${Number(p.precio).toFixed(2)}
                    </span>
                  {:else}
                    ${Number(p.precio).toFixed(2)}
                  {/if}
                </td>
                <td>
                  {#if p.oferta > 0}
                    <span class="badge badge-warning">
                      <Tag size={12} />
                      {p.oferta}% OFF
                    </span>
                  {:else}
                    <span style="color: var(--text-light); font-size: 0.82rem;">Sin oferta</span>
                  {/if}
                </td>
                <td>
                  <strong style="color: {p.oferta > 0 ? '#16a34a' : 'var(--text-main)'}; font-size: 0.95rem;">
                    ${pFinal.toFixed(2)}
                  </strong>
                </td>
                <td>
                  {#if p.activo}
                    <span class="badge badge-success">Activo</span>
                  {:else}
                    <span class="badge badge-danger">Inactivo</span>
                  {/if}
                </td>
                {#if isAdmin()}
                  <td style="text-align: right;">
                    <button 
                      type="button" 
                      class="btn-icon" 
                      title="Editar producto" 
                      on:click={() => openEditModal(p)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      type="button" 
                      class="btn-icon {p.activo ? 'danger' : ''}" 
                      title={p.activo ? 'Desactivar producto' : 'Activar producto'}
                      on:click={() => promptToggleEstado(p)}
                    >
                      {#if p.activo}
                        <Archive size={16} />
                      {:else}
                        <CheckCircle size={16} color="#10b981" />
                      {/if}
                    </button>
                  </td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Modal Crear / Editar Producto -->
<Modal
  isOpen={isModalOpen}
  title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
  size="md"
  on:close={() => (isModalOpen = false)}
>
  {#if formError}
    <div class="alert-error" style="margin-bottom: 16px;">
      {formError}
    </div>
  {/if}

  <form on:submit|preventDefault={guardarProducto} id="form-prod">
    <div class="form-group">
      <label for="p-nombre" class="form-label">
        Nombre del Producto <span class="required">*</span>
      </label>
      <input 
        id="p-nombre" 
        type="text" 
        class="form-input" 
        placeholder="ej: Monitor Gamer 27 pulgadas" 
        bind:value={formProducto.nombre}
        disabled={modalLoading}
        required
      />
    </div>

    <div class="form-group">
      <label for="p-desc" class="form-label">Descripción</label>
      <textarea 
        id="p-desc" 
        class="form-textarea" 
        rows="2" 
        placeholder="Especificaciones técnicas, detalles, color, etc." 
        bind:value={formProducto.descripcion}
        disabled={modalLoading}
      ></textarea>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
      <div class="form-group">
        <label for="p-precio" class="form-label">
          Precio de Lista ($) <span class="required">*</span>
        </label>
        <input 
          id="p-precio" 
          type="number" 
          step="0.01" 
          min="0" 
          class="form-input" 
          placeholder="0.00" 
          bind:value={formProducto.precio}
          disabled={modalLoading}
          required
        />
      </div>

      <div class="form-group">
        <label for="p-oferta" class="form-label">
          Descuento u Oferta (%)
        </label>
        <input 
          id="p-oferta" 
          type="number" 
          step="1" 
          min="0" 
          max="100" 
          class="form-input" 
          placeholder="0" 
          bind:value={formProducto.oferta}
          disabled={modalLoading}
        />
      </div>
    </div>

    <!-- Indicador de Precio Final Calculado -->
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 14px; border-radius: var(--radius-md); margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 0.85rem; color: #166534; font-weight: 500;">
        Precio Efectivo de Venta:
      </span>
      <span style="font-size: 1.15rem; font-weight: 700; color: #15803d;">
        ${previewPrecioFinal.toFixed(2)}
      </span>
    </div>

    <div class="form-group">
      <label for="p-tienda" class="form-label">
        Tienda Asociada <span class="required">*</span>
      </label>
      <select id="p-tienda" class="form-select" bind:value={formProducto.id_tienda} disabled={modalLoading} required>
        <option value="" disabled>-- Seleccione una tienda --</option>
        {#each tiendas as t}
          <option value={t.id}>{t.nombre}</option>
        {/each}
      </select>
    </div>

    {#if isEditing}
      <div class="form-group">
        <label for="p-activo" class="form-label">Estado</label>
        <select id="p-activo" class="form-select" bind:value={formProducto.activo} disabled={modalLoading}>
          <option value={true}>Activo</option>
          <option value={false}>Inactivo</option>
        </select>
      </div>
    {/if}
  </form>

  <div slot="footer">
    <button type="button" class="btn btn-secondary" on:click={() => (isModalOpen = false)} disabled={modalLoading}>
      Cancelar
    </button>
    <button type="submit" form="form-prod" class="btn btn-primary" disabled={modalLoading}>
      {#if modalLoading}
        <span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span>
      {/if}
      <span>{isEditing ? 'Guardar Cambios' : 'Registrar Producto'}</span>
    </button>
  </div>
</Modal>

<!-- Modal Confirmación -->
<ConfirmDialog 
  isOpen={isConfirmOpen}
  title={targetProducto?.activo ? '¿Desactivar producto?' : '¿Activar producto?'}
  message={targetProducto?.activo
    ? `El producto "${targetProducto?.nombre}" dejará de estar disponible para el registro de ventas.`
    : `El producto "${targetProducto?.nombre}" volverá a estar disponible.`}
  confirmText={targetProducto?.activo ? 'Sí, desactivar' : 'Sí, activar'}
  confirmType={targetProducto?.activo ? 'danger' : 'primary'}
  isLoading={confirmLoading}
  on:confirm={confirmarToggleEstado}
  on:cancel={() => (isConfirmOpen = false)}
/>
