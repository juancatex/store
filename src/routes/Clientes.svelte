<script>
  import { onMount } from 'svelte';
  import { 
    Users, 
    Plus, 
    Search, 
    Edit2, 
    UserX, 
    UserCheck, 
    ShoppingBag, 
    Eye,
    Receipt
  } from 'lucide-svelte';
  import { 
    listarClientes, 
    crearCliente, 
    editarCliente, 
    cambiarEstadoCliente,
    obtenerVentasCliente 
  } from '../lib/services/clienteService.js';
  import { toast } from '../lib/services/toastService.js';
  import { isAdmin } from '../lib/services/authService.js';
  import Modal from '../lib/components/Modal.svelte';
  import ConfirmDialog from '../lib/components/ConfirmDialog.svelte';

  let clientes = [];
  let loading = true;
  let searchTerm = '';
  let filterActivo = '';

  // Modal Crear / Editar
  let isModalOpen = false;
  let isEditing = false;
  let modalLoading = false;
  let editingId = null;

  let formCliente = {
    nombre: '',
    correo: '',
    activo: true
  };
  let formError = '';

  // Modal Historial de Ventas del Cliente
  let isVentasModalOpen = false;
  let clienteSeleccionado = null;
  let ventasCliente = [];
  let ventasLoading = false;

  // Modal Confirmación Desactivación
  let isConfirmOpen = false;
  let targetCliente = null;
  let confirmLoading = false;

  async function cargarClientes() {
    try {
      loading = true;
      clientes = await listarClientes({
        search: searchTerm,
        activo: filterActivo
      });
    } catch (err) {
      toast.error('Error al cargar clientes: ' + err.message);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    cargarClientes();
  });

  function openCreateModal() {
    isEditing = false;
    editingId = null;
    formCliente = { nombre: '', correo: '', activo: true };
    formError = '';
    isModalOpen = true;
  }

  function openEditModal(c) {
    isEditing = true;
    editingId = c.id;
    formCliente = {
      nombre: c.nombre,
      correo: c.correo,
      activo: c.activo
    };
    formError = '';
    isModalOpen = true;
  }

  async function guardarCliente() {
    formError = '';
    try {
      modalLoading = true;
      if (isEditing) {
        await editarCliente(editingId, formCliente);
        toast.success('Cliente actualizado correctamente.');
      } else {
        await crearCliente(formCliente);
        toast.success('Cliente registrado exitosamente.');
      }
      isModalOpen = false;
      await cargarClientes();
    } catch (err) {
      formError = err.message;
      toast.error(formError);
    } finally {
      modalLoading = false;
    }
  }

  async function verVentasCliente(c) {
    clienteSeleccionado = c;
    isVentasModalOpen = true;
    try {
      ventasLoading = true;
      ventasCliente = await obtenerVentasCliente(c.id);
    } catch (err) {
      toast.error('Error al consultar historial de ventas: ' + err.message);
    } finally {
      ventasLoading = false;
    }
  }

  function promptToggleEstado(c) {
    targetCliente = c;
    isConfirmOpen = true;
  }

  async function confirmarToggleEstado() {
    if (!targetCliente) return;
    try {
      confirmLoading = true;
      const nuevoEstado = !targetCliente.activo;
      await cambiarEstadoCliente(targetCliente.id, nuevoEstado);
      toast.success(`Cliente ${nuevoEstado ? 'activado' : 'desactivado'} con éxito.`);
      isConfirmOpen = false;
      targetCliente = null;
      await cargarClientes();
    } catch (err) {
      toast.error('Error al actualizar estado: ' + err.message);
    } finally {
      confirmLoading = false;
    }
  }
</script>

<div class="clientes-view">
  <div class="page-header">
    <div class="page-header-info">
      <h1>Mantenimiento de Clientes</h1>
      <p>Gestión de cartera comercial y consulta de historial de compras</p>
    </div>
    {#if isAdmin()}
      <div class="page-header-actions">
        <button type="button" class="btn btn-primary" on:click={openCreateModal}>
          <Plus size={18} />
          <span>Nuevo Cliente</span>
        </button>
      </div>
    {/if}
  </div>

  <div class="card">
    <!-- Toolbar de filtros -->
    <div class="table-toolbar">
      <div class="search-input-wrapper">
        <Search size={18} class="search-icon" />
        <input 
          type="text" 
          class="form-input" 
          placeholder="Buscar por nombre o correo de cliente..." 
          bind:value={searchTerm}
          on:input={cargarClientes}
        />
      </div>

      <div class="filter-group">
        <select class="form-select" bind:value={filterActivo} on:change={cargarClientes} style="min-width: 140px;">
          <option value="">Todos los Estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>
    </div>

    <!-- Tabla -->
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Consultando clientes en Supabase...</p>
      </div>
    {:else if clientes.length === 0}
      <div class="empty-state">
        <Users size={36} class="empty-state-icon" />
        <p>No se encontraron clientes registrados con los filtros actuales.</p>
      </div>
    {:else}
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre del Cliente</th>
              <th>Correo Electrónico</th>
              <th>Cuenta Vinculada</th>
              <th>Estado</th>
              <th style="text-align: right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each clientes as c}
              <tr>
                <td>
                  <strong>{c.nombre}</strong>
                </td>
                <td>{c.correo}</td>
                <td>
                  {#if c.perfil_id}
                    <span class="badge badge-info">Usuario Sistema</span>
                  {:else}
                    <span class="badge" style="background:#f1f5f9; color:#64748b;">Cliente Externo</span>
                  {/if}
                </td>
                <td>
                  {#if c.activo}
                    <span class="badge badge-success">Activo</span>
                  {:else}
                    <span class="badge badge-danger">Inactivo</span>
                  {/if}
                </td>
                <td style="text-align: right;">
                  <button 
                    type="button" 
                    class="btn-icon" 
                    title="Ver historial de ventas" 
                    on:click={() => verVentasCliente(c)}
                  >
                    <Receipt size={16} color="#2563eb" />
                  </button>
                  {#if isAdmin()}
                    <button 
                      type="button" 
                      class="btn-icon" 
                      title="Editar cliente" 
                      on:click={() => openEditModal(c)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      type="button" 
                      class="btn-icon {c.activo ? 'danger' : ''}" 
                      title={c.activo ? 'Desactivar cliente' : 'Activar cliente'}
                      on:click={() => promptToggleEstado(c)}
                    >
                      {#if c.activo}
                        <UserX size={16} />
                      {:else}
                        <UserCheck size={16} color="#10b981" />
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

<!-- Modal Crear / Editar Cliente -->
<Modal 
  isOpen={isModalOpen} 
  title={isEditing ? 'Editar Cliente' : 'Registrar Nuevo Cliente'} 
  size="md"
  on:close={() => (isModalOpen = false)}
>
  {#if formError}
    <div class="alert-error" style="margin-bottom: 16px;">
      {formError}
    </div>
  {/if}

  <form on:submit|preventDefault={guardarCliente} id="form-cliente">
    <div class="form-group">
      <label for="cli-nombre" class="form-label">
        Nombre Completo <span class="required">*</span>
      </label>
      <input 
        id="cli-nombre" 
        type="text" 
        class="form-input" 
        placeholder="ej: María Elena Vásquez" 
        bind:value={formCliente.nombre}
        disabled={modalLoading}
        required
      />
    </div>

    <div class="form-group">
      <label for="cli-correo" class="form-label">
        Correo Electrónico <span class="required">*</span>
      </label>
      <input 
        id="cli-correo" 
        type="email" 
        class="form-input" 
        placeholder="cliente@correo.com" 
        bind:value={formCliente.correo}
        disabled={modalLoading}
        required
      />
      <span class="form-help">Utilizado para comprobantes, reportes y asociación con Supabase Auth</span>
    </div>

    {#if isEditing}
      <div class="form-group">
        <label for="cli-activo" class="form-label">Estado</label>
        <select id="cli-activo" class="form-select" bind:value={formCliente.activo} disabled={modalLoading}>
          <option value={true}>Activo</option>
          <option value={false}>Inactivo</option>
        </select>
      </div>
    {/if}
  </form>

  <div slot="footer">
    <button 
      type="button" 
      class="btn btn-secondary" 
      on:click={() => (isModalOpen = false)}
      disabled={modalLoading}
    >
      Cancelar
    </button>
    <button 
      type="submit" 
      form="form-cliente" 
      class="btn btn-primary"
      disabled={modalLoading}
    >
      {#if modalLoading}
        <span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span>
      {/if}
      <span>{isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
    </button>
  </div>
</Modal>

<!-- Modal Historial de Ventas del Cliente -->
<Modal
  isOpen={isVentasModalOpen}
  title={`Historial de Compras: ${clienteSeleccionado?.nombre || ''}`}
  size="lg"
  on:close={() => (isVentasModalOpen = false)}
>
  {#if ventasLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Consultando transacciones...</p>
    </div>
  {:else if ventasCliente.length === 0}
    <div class="empty-state">
      <ShoppingBag size={32} class="empty-state-icon" />
      <p>Este cliente no registra operaciones de venta en el historial.</p>
    </div>
  {:else}
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Producto</th>
            <th>Cant.</th>
            <th>Precio Unit.</th>
            <th>Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {#each ventasCliente as v}
            <tr>
              <td>{new Date(v.fecha_hora).toLocaleString('es-ES')}</td>
              <td><strong>{v.productos?.nombre || 'Producto'}</strong></td>
              <td>{v.cantidad}</td>
              <td>${Number(v.precio_unitario).toFixed(2)}</td>
              <td><strong>${Number(v.total).toFixed(2)}</strong></td>
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

  <div slot="footer">
    <button type="button" class="btn btn-secondary" on:click={() => (isVentasModalOpen = false)}>
      Cerrar
    </button>
  </div>
</Modal>

<!-- Confirmación Desactivación -->
<ConfirmDialog 
  isOpen={isConfirmOpen}
  title={targetCliente?.activo ? '¿Desactivar cliente?' : '¿Activar cliente?'}
  message={targetCliente?.activo
    ? `El cliente "${targetCliente?.nombre}" no podrá ser seleccionado para nuevas ventas.`
    : `El cliente "${targetCliente?.nombre}" volverá a estar disponible para registrar ventas.`}
  confirmText={targetCliente?.activo ? 'Sí, desactivar' : 'Sí, activar'}
  confirmType={targetCliente?.activo ? 'danger' : 'primary'}
  isLoading={confirmLoading}
  on:confirm={confirmarToggleEstado}
  on:cancel={() => (isConfirmOpen = false)}
/>
