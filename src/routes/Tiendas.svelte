<script>
  import { onMount } from 'svelte';
  import { 
    Store, 
    Plus, 
    Search, 
    Edit2, 
    XCircle, 
    CheckCircle, 
    Package, 
    User,
    Layers
  } from 'lucide-svelte';
  import { 
    listarTiendas, 
    crearTienda, 
    editarTienda, 
    cambiarEstadoTienda,
    obtenerProductosDeTienda 
  } from '../lib/services/tiendaService.js';
  import { listarUsuarios } from '../lib/services/usuarioService.js';
  import { toast } from '../lib/services/toastService.js';
  import { isAdmin } from '../lib/services/authService.js';
  import Modal from '../lib/components/Modal.svelte';
  import ConfirmDialog from '../lib/components/ConfirmDialog.svelte';

  let tiendas = [];
  let usuarios = [];
  let loading = true;
  let searchTerm = '';
  let filterActivo = '';

  // Modal Crear / Editar
  let isModalOpen = false;
  let isEditing = false;
  let modalLoading = false;
  let editingId = null;

  let formTienda = {
    nombre: '',
    descripcion: '',
    id_usuario: '',
    activo: true
  };
  let formError = '';

  // Modal Productos de la Tienda
  let isProductosModalOpen = false;
  let tiendaSeleccionada = null;
  let productosTienda = [];
  let productosLoading = false;

  // Confirmación
  let isConfirmOpen = false;
  let targetTienda = null;
  let confirmLoading = false;

  async function cargarDatos() {
    try {
      loading = true;
      const [tList, uList] = await Promise.all([
        listarTiendas({ search: searchTerm, activo: filterActivo }),
        listarUsuarios({ activo: true })
      ]);
      tiendas = tList;
      usuarios = uList;
    } catch (err) {
      toast.error('Error al cargar tiendas: ' + err.message);
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
    formTienda = {
      nombre: '',
      descripcion: '',
      id_usuario: '',
      activo: true
    };
    formError = '';
    isModalOpen = true;
  }

  function openEditModal(t) {
    isEditing = true;
    editingId = t.id;
    formTienda = {
      nombre: t.nombre,
      descripcion: t.descripcion || '',
      id_usuario: t.id_usuario || '',
      activo: t.activo
    };
    formError = '';
    isModalOpen = true;
  }

  async function guardarTienda() {
    formError = '';
    try {
      modalLoading = true;
      if (isEditing) {
        await editarTienda(editingId, {
          nombre: formTienda.nombre,
          descripcion: formTienda.descripcion,
          id_usuario: formTienda.id_usuario || null,
          activo: formTienda.activo
        });
        toast.success('Tienda actualizada exitosamente.');
      } else {
        await crearTienda({
          nombre: formTienda.nombre,
          descripcion: formTienda.descripcion,
          id_usuario: formTienda.id_usuario || null
        });
        toast.success('Tienda creada exitosamente.');
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

  async function verProductosTienda(t) {
    tiendaSeleccionada = t;
    isProductosModalOpen = true;
    try {
      productosLoading = true;
      productosTienda = await obtenerProductosDeTienda(t.id);
    } catch (err) {
      toast.error('Error al cargar productos de la tienda: ' + err.message);
    } finally {
      productosLoading = false;
    }
  }

  function promptToggleEstado(t) {
    targetTienda = t;
    isConfirmOpen = true;
  }

  async function confirmarToggleEstado() {
    if (!targetTienda) return;
    try {
      confirmLoading = true;
      const nuevoEstado = !targetTienda.activo;
      await cambiarEstadoTienda(targetTienda.id, nuevoEstado);
      toast.success(`Tienda ${nuevoEstado ? 'activada' : 'desactivada'} con éxito.`);
      isConfirmOpen = false;
      targetTienda = null;
      await cargarDatos();
    } catch (err) {
      toast.error('Error al actualizar estado: ' + err.message);
    } finally {
      confirmLoading = false;
    }
  }
</script>

<div class="tiendas-view">
  <div class="page-header">
    <div class="page-header-info">
      <h1>Mantenimiento de Tiendas y Sucursales</h1>
      <p>Organización de locales comerciales y asignación de responsables</p>
    </div>
    {#if isAdmin()}
      <div class="page-header-actions">
        <button type="button" class="btn btn-primary" on:click={openCreateModal}>
          <Plus size={18} />
          <span>Nueva Tienda</span>
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
          placeholder="Buscar por nombre o descripción de tienda..." 
          bind:value={searchTerm}
          on:input={cargarDatos}
        />
      </div>

      <div class="filter-group">
        <select class="form-select" bind:value={filterActivo} on:change={cargarDatos} style="min-width: 140px;">
          <option value="">Todos los Estados</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
      </div>
    </div>

    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Consultando tiendas registradas...</p>
      </div>
    {:else if tiendas.length === 0}
      <div class="empty-state">
        <Store size={36} class="empty-state-icon" />
        <p>No se encontraron tiendas registradas con los filtros seleccionados.</p>
      </div>
    {:else}
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre de la Tienda</th>
              <th>Descripción</th>
              <th>Usuario Responsable</th>
              <th>Estado</th>
              <th style="text-align: right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each tiendas as t}
              <tr>
                <td>
                  <strong>{t.nombre}</strong>
                </td>
                <td style="color: var(--text-muted); max-width: 260px;">
                  {t.descripcion || 'Sin descripción'}
                </td>
                <td>
                  {#if t.perfiles?.nombre_completo}
                    <span class="badge badge-info">{t.perfiles.nombre_completo}</span>
                  {:else}
                    <span style="color: var(--text-light); font-size: 0.8rem;">No asignado</span>
                  {/if}
                </td>
                <td>
                  {#if t.activo}
                    <span class="badge badge-success">Activa</span>
                  {:else}
                    <span class="badge badge-danger">Inactiva</span>
                  {/if}
                </td>
                <td style="text-align: right;">
                  <button 
                    type="button" 
                    class="btn-icon" 
                    title="Ver productos asociados" 
                    on:click={() => verProductosTienda(t)}
                  >
                    <Layers size={16} color="#2563eb" />
                  </button>
                  {#if isAdmin()}
                    <button 
                      type="button" 
                      class="btn-icon" 
                      title="Editar tienda" 
                      on:click={() => openEditModal(t)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      type="button" 
                      class="btn-icon {t.activo ? 'danger' : ''}" 
                      title={t.activo ? 'Desactivar tienda' : 'Activar tienda'}
                      on:click={() => promptToggleEstado(t)}
                    >
                      {#if t.activo}
                        <XCircle size={16} />
                      {:else}
                        <CheckCircle size={16} color="#10b981" />
                      {/if}
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

<!-- Modal Crear / Editar Tienda -->
<Modal
  isOpen={isModalOpen}
  title={isEditing ? 'Editar Tienda' : 'Registrar Nueva Tienda'}
  size="md"
  on:close={() => (isModalOpen = false)}
>
  {#if formError}
    <div class="alert-error" style="margin-bottom: 16px;">
      {formError}
    </div>
  {/if}

  <form on:submit|preventDefault={guardarTienda} id="form-tienda">
    <div class="form-group">
      <label for="tie-nombre" class="form-label">
        Nombre de la Tienda <span class="required">*</span>
      </label>
      <input 
        id="tie-nombre" 
        type="text" 
        class="form-input" 
        placeholder="ej: Sucursal Norte - Mall Plaza" 
        bind:value={formTienda.nombre}
        disabled={modalLoading}
        required
      />
    </div>

    <div class="form-group">
      <label for="tie-desc" class="form-label">Descripción</label>
      <textarea 
        id="tie-desc" 
        class="form-textarea" 
        rows="3" 
        placeholder="Ubicación, tipo de productos o detalles de la tienda..." 
        bind:value={formTienda.descripcion}
        disabled={modalLoading}
      ></textarea>
    </div>

    <div class="form-group">
      <label for="tie-usuario" class="form-label">Usuario Responsable</label>
      <select id="tie-usuario" class="form-select" bind:value={formTienda.id_usuario} disabled={modalLoading}>
        <option value="">-- Sin usuario asignado --</option>
        {#each usuarios as u}
          <option value={u.id}>{u.nombre_completo} (@{u.nombre_usuario})</option>
        {/each}
      </select>
      <span class="form-help">Permite al usuario gestionar inventarios y ventas del local</span>
    </div>

    {#if isEditing}
      <div class="form-group">
        <label for="tie-activo" class="form-label">Estado</label>
        <select id="tie-activo" class="form-select" bind:value={formTienda.activo} disabled={modalLoading}>
          <option value={true}>Activa</option>
          <option value={false}>Inactiva</option>
        </select>
      </div>
    {/if}
  </form>

  <div slot="footer">
    <button type="button" class="btn btn-secondary" on:click={() => (isModalOpen = false)} disabled={modalLoading}>
      Cancelar
    </button>
    <button type="submit" form="form-tienda" class="btn btn-primary" disabled={modalLoading}>
      {#if modalLoading}
        <span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span>
      {/if}
      <span>{isEditing ? 'Guardar Cambios' : 'Crear Tienda'}</span>
    </button>
  </div>
</Modal>

<!-- Modal Productos Asociados a la Tienda -->
<Modal
  isOpen={isProductosModalOpen}
  title={`Productos en: ${tiendaSeleccionada?.nombre || ''}`}
  size="lg"
  on:close={() => (isProductosModalOpen = false)}
>
  {#if productosLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Cargando productos asociados...</p>
    </div>
  {:else if productosTienda.length === 0}
    <div class="empty-state">
      <Package size={32} class="empty-state-icon" />
      <p>Esta tienda aún no tiene productos asociados en el inventario.</p>
    </div>
  {:else}
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio Lista</th>
            <th>Oferta (%)</th>
            <th>Precio Venta</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {#each productosTienda as p}
            <tr>
              <td><strong>{p.nombre}</strong></td>
              <td>${Number(p.precio).toFixed(2)}</td>
              <td>
                {#if p.oferta > 0}
                  <span class="badge badge-warning">-{p.oferta}% OFF</span>
                {:else}
                  <span style="color: var(--text-light); font-size: 0.8rem;">0%</span>
                {/if}
              </td>
              <td>
                <strong style="color: var(--primary-700);">
                  ${(Number(p.precio) * (1 - (p.oferta || 0) / 100)).toFixed(2)}
                </strong>
              </td>
              <td>
                {#if p.activo}
                  <span class="badge badge-success">Activo</span>
                {:else}
                  <span class="badge badge-danger">Inactivo</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <div slot="footer">
    <button type="button" class="btn btn-secondary" on:click={() => (isProductosModalOpen = false)}>
      Cerrar
    </button>
  </div>
</Modal>

<!-- Modal Confirmación -->
<ConfirmDialog 
  isOpen={isConfirmOpen}
  title={targetTienda?.activo ? '¿Desactivar tienda?' : '¿Activar tienda?'}
  message={targetTienda?.activo
    ? `La tienda "${targetTienda?.nombre}" no estará disponible para registrar nuevas ventas.`
    : `La tienda "${targetTienda?.nombre}" volverá a estar habilitada.`}
  confirmText={targetTienda?.activo ? 'Sí, desactivar' : 'Sí, activar'}
  confirmType={targetTienda?.activo ? 'danger' : 'primary'}
  isLoading={confirmLoading}
  on:confirm={confirmarToggleEstado}
  on:cancel={() => (isConfirmOpen = false)}
/>
