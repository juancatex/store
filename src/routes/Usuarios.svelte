<script>
  import { onMount } from 'svelte';
  import { 
    UserCog, 
    Plus, 
    Search, 
    Filter, 
    Edit2, 
    UserX, 
    UserCheck,
    Mail,
    User,
    Shield
  } from 'lucide-svelte';
  import { 
    listarUsuarios, 
    crearUsuario, 
    editarUsuario, 
    cambiarEstadoUsuario 
  } from '../lib/services/usuarioService.js';
  import { toast } from '../lib/services/toastService.js';
  import { getCurrentProfile } from '../lib/services/authService.js';
  import Modal from '../lib/components/Modal.svelte';
  import ConfirmDialog from '../lib/components/ConfirmDialog.svelte';

  let usuarios = [];
  let loading = true;
  let searchTerm = '';
  let filterRol = '';
  let filterActivo = '';

  // Modal Crear / Editar
  let isModalOpen = false;
  let isEditing = false;
  let modalLoading = false;
  let editingId = null;

  let formUsuario = {
    nombre_usuario: '',
    nombre_completo: '',
    correo: '',
    password: '',
    rol: 'cliente',
    activo: true
  };
  let formError = '';

  // Modal Confirmar Desactivación
  let isConfirmOpen = false;
  let targetUser = null;
  let confirmLoading = false;

  const currentProfile = getCurrentProfile();

  async function cargarUsuarios() {
    try {
      loading = true;
      usuarios = await listarUsuarios({
        search: searchTerm,
        rol: filterRol,
        activo: filterActivo
      });
    } catch (err) {
      toast.error('Error al cargar usuarios: ' + err.message);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    cargarUsuarios();
  });

  function openCreateModal() {
    isEditing = false;
    editingId = null;
    formUsuario = {
      nombre_usuario: '',
      nombre_completo: '',
      correo: '',
      password: '',
      rol: 'cliente',
      activo: true
    };
    formError = '';
    isModalOpen = true;
  }

  function openEditModal(user) {
    isEditing = true;
    editingId = user.id;
    formUsuario = {
      nombre_usuario: user.nombre_usuario,
      nombre_completo: user.nombre_completo,
      correo: user.correo,
      password: '', // No requerida en edición
      rol: user.rol,
      activo: user.activo
    };
    formError = '';
    isModalOpen = true;
  }

  async function guardarUsuario() {
    formError = '';
    try {
      modalLoading = true;
      if (isEditing) {
        // Validación: Un usuario no puede auto-cambiarse el rol
        if (editingId === currentProfile?.id && formUsuario.rol !== currentProfile?.rol) {
          throw new Error('No puedes modificar tu propio rol por motivos de seguridad.');
        }

        await editarUsuario(editingId, {
          nombre_completo: formUsuario.nombre_completo,
          rol: formUsuario.rol,
          activo: formUsuario.activo
        });
        toast.success('Usuario actualizado correctamente.');
      } else {
        await crearUsuario(formUsuario);
        toast.success('Usuario creado con éxito.');
      }

      isModalOpen = false;
      await cargarUsuarios();
    } catch (err) {
      formError = err.message;
      toast.error(formError);
    } finally {
      modalLoading = false;
    }
  }

  function promptToggleEstado(user) {
    if (user.id === currentProfile?.id && user.activo) {
      toast.warning('No puedes desactivar tu propia cuenta activa.');
      return;
    }
    targetUser = user;
    isConfirmOpen = true;
  }

  async function confirmarToggleEstado() {
    if (!targetUser) return;
    try {
      confirmLoading = true;
      const nuevoEstado = !targetUser.activo;
      await cambiarEstadoUsuario(targetUser.id, nuevoEstado);
      toast.success(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} con éxito.`);
      isConfirmOpen = false;
      targetUser = null;
      await cargarUsuarios();
    } catch (err) {
      toast.error('Error al actualizar estado: ' + err.message);
    } finally {
      confirmLoading = false;
    }
  }
</script>

<div class="usuarios-view">
  <div class="page-header">
    <div class="page-header-info">
      <h1>Control de Usuarios</h1>
      <p>Administración de cuentas con accesos según roles (Administrador / Cliente)</p>
    </div>
    <div class="page-header-actions">
      <button type="button" class="btn btn-primary" on:click={openCreateModal}>
        <Plus size={18} />
        <span>Nuevo Usuario</span>
      </button>
    </div>
  </div>

  <div class="card">
    <!-- Barra de Búsqueda y Filtros -->
    <div class="table-toolbar">
      <div class="search-input-wrapper">
        <Search size={18} class="search-icon" />
        <input 
          type="text" 
          class="form-input" 
          placeholder="Buscar por nombre, usuario o correo..." 
          bind:value={searchTerm}
          on:input={cargarUsuarios}
        />
      </div>

      <div class="filter-group">
        <select class="form-select" bind:value={filterRol} on:change={cargarUsuarios} style="min-width: 140px;">
          <option value="">Todos los Roles</option>
          <option value="administrador">Administrador</option>
          <option value="cliente">Cliente</option>
        </select>

        <select class="form-select" bind:value={filterActivo} on:change={cargarUsuarios} style="min-width: 140px;">
          <option value="">Todos los Estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>
    </div>

    <!-- Tabla de Usuarios -->
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Consultando usuarios en Supabase...</p>
      </div>
    {:else if usuarios.length === 0}
      <div class="empty-state">
        <UserCog size={36} class="empty-state-icon" />
        <p>No se encontraron usuarios con los criterios seleccionados.</p>
      </div>
    {:else}
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre de Usuario</th>
              <th>Nombre Completo</th>
              <th>Correo Electrónico</th>
              <th>Rol</th>
              <th>Estado</th>
              <th style="text-align: right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {#each usuarios as u}
              <tr>
                <td>
                  <strong>@{u.nombre_usuario}</strong>
                </td>
                <td>{u.nombre_completo}</td>
                <td>{u.correo}</td>
                <td>
                  {#if u.rol === 'administrador'}
                    <span class="badge badge-info">Administrador</span>
                  {:else}
                    <span class="badge badge-success">Cliente</span>
                  {/if}
                </td>
                <td>
                  {#if u.activo}
                    <span class="badge badge-success">Activo</span>
                  {:else}
                    <span class="badge badge-danger">Inactivo</span>
                  {/if}
                </td>
                <td style="text-align: right;">
                  <button 
                    type="button" 
                    class="btn-icon" 
                    title="Editar usuario" 
                    on:click={() => openEditModal(u)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    type="button" 
                    class="btn-icon {u.activo ? 'danger' : ''}" 
                    title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                    on:click={() => promptToggleEstado(u)}
                  >
                    {#if u.activo}
                      <UserX size={16} />
                    {:else}
                      <UserCheck size={16} color="#10b981" />
                    {/if}
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Modal Crear / Editar Usuario -->
<Modal 
  isOpen={isModalOpen} 
  title={isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'} 
  size="md"
  on:close={() => (isModalOpen = false)}
>
  {#if formError}
    <div class="alert-error" style="margin-bottom: 16px;">
      {formError}
    </div>
  {/if}

  <form on:submit|preventDefault={guardarUsuario} id="form-user">
    <div class="form-group">
      <label for="nombre_usuario" class="form-label">
        Nombre de Usuario (Único) <span class="required">*</span>
      </label>
      <input 
        id="nombre_usuario" 
        type="text" 
        class="form-input" 
        placeholder="ej: jmendoza" 
        bind:value={formUsuario.nombre_usuario}
        disabled={isEditing || modalLoading}
        required
      />
    </div>

    <div class="form-group">
      <label for="nombre_completo" class="form-label">
        Nombre Completo <span class="required">*</span>
      </label>
      <input 
        id="nombre_completo" 
        type="text" 
        class="form-input" 
        placeholder="ej: Juan Carlos Mendoza" 
        bind:value={formUsuario.nombre_completo}
        disabled={modalLoading}
        required
      />
    </div>

    <div class="form-group">
      <label for="correo" class="form-label">
        Correo Electrónico <span class="required">*</span>
      </label>
      <input 
        id="correo" 
        type="email" 
        class="form-input" 
        placeholder="correo@ejemplo.com" 
        bind:value={formUsuario.correo}
        disabled={isEditing || modalLoading}
        required
      />
    </div>

    {#if !isEditing}
      <div class="form-group">
        <label for="password" class="form-label">
          Contraseña Inicial <span class="required">*</span>
        </label>
        <input 
          id="password" 
          type="password" 
          class="form-input" 
          placeholder="Mínimo 6 caracteres" 
          bind:value={formUsuario.password}
          disabled={modalLoading}
          required
        />
        <span class="form-help">Autenticada de forma segura mediante Supabase Auth</span>
      </div>
    {/if}

    <div class="form-group">
      <label for="rol" class="form-label">
        Rol de Acceso <span class="required">*</span>
      </label>
      <select 
        id="rol" 
        class="form-select" 
        bind:value={formUsuario.rol}
        disabled={modalLoading || (isEditing && editingId === currentProfile?.id)}
      >
        <option value="cliente">Cliente (Consultas de compras y datos personales)</option>
        <option value="administrador">Administrador (Control total del sistema)</option>
      </select>
    </div>

    {#if isEditing}
      <div class="form-group">
        <label for="activo" class="form-label">Estado de la Cuenta</label>
        <select id="activo" class="form-select" bind:value={formUsuario.activo} disabled={modalLoading}>
          <option value={true}>Activo</option>
          <option value={false}>Inactivo (Acceso bloqueado)</option>
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
      form="form-user" 
      class="btn btn-primary"
      disabled={modalLoading}
    >
      {#if modalLoading}
        <span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span>
      {/if}
      <span>{isEditing ? 'Guardar Cambios' : 'Crear Usuario'}</span>
    </button>
  </div>
</Modal>

<!-- Modal Confirmación Desactivar/Activar -->
<ConfirmDialog 
  isOpen={isConfirmOpen}
  title={targetUser?.activo ? '¿Desactivar usuario?' : '¿Activar usuario?'}
  message={targetUser?.activo 
    ? `El usuario "${targetUser?.nombre_completo}" perderá acceso al sistema de forma inmediata.`
    : `El usuario "${targetUser?.nombre_completo}" podrá volver a iniciar sesión.`}
  confirmText={targetUser?.activo ? 'Sí, desactivar' : 'Sí, activar'}
  confirmType={targetUser?.activo ? 'danger' : 'primary'}
  isLoading={confirmLoading}
  on:confirm={confirmarToggleEstado}
  on:cancel={() => (isConfirmOpen = false)}
/>
