<script>
  import { createEventDispatcher } from 'svelte';
  import { 
    LayoutDashboard, 
    ShoppingCart, 
    BarChart3, 
    Package, 
    Store, 
    Users, 
    UserCog,
    LogOut,
    Sparkles,
    X
  } from 'lucide-svelte';

  export let currentRoute = 'dashboard';
  export let userProfile = null;
  export let isOpen = false;

  const dispatch = createEventDispatcher();

  function navigate(route) {
    dispatch('navigate', route);
  }

  function handleLogout() {
    dispatch('logout');
  }

  function closeSidebar() {
    dispatch('close');
  }

  $: isAdmin = userProfile?.rol === 'administrador';
</script>

<!-- Backdrop para móviles -->
{#if isOpen}
  <button 
    type="button"
    class="sidebar-backdrop" 
    on:click={closeSidebar} 
    aria-label="Cerrar menú lateral"
  ></button>
{/if}

<aside class="sidebar" class:open={isOpen}>
  <div class="sidebar-brand">
    <div class="brand-icon">
      <Sparkles size={22} />
    </div>
    <div class="brand-info">
      <h2>NovaVentas</h2>
      <span>Gestión Comercial</span>
    </div>
    <button class="btn-icon mobile-close" on:click={closeSidebar} aria-label="Cerrar menú">
      <X size={20} color="#94a3b8" />
    </button>
  </div>

  <nav class="sidebar-nav">
    <div class="nav-section-title">PRINCIPAL</div>
    
    <button 
      type="button" 
      class="nav-link" 
      class:active={currentRoute === 'dashboard'} 
      on:click={() => navigate('dashboard')}
    >
      <LayoutDashboard size={19} />
      <span>Dashboard</span>
    </button>

    <button 
      type="button" 
      class="nav-link" 
      class:active={currentRoute === 'ventas'} 
      on:click={() => navigate('ventas')}
    >
      <ShoppingCart size={19} />
      <span>{isAdmin ? 'Gestión de Ventas' : 'Mis Compras'}</span>
    </button>

    {#if isAdmin}
      <button 
        type="button" 
        class="nav-link" 
        class:active={currentRoute === 'reportes'} 
        on:click={() => navigate('reportes')}
      >
        <BarChart3 size={19} />
        <span>Reportes Analíticos</span>
      </button>
    {/if}

    <div class="nav-section-title">CATÁLOGO Y TIENDAS</div>

    <button 
      type="button" 
      class="nav-link" 
      class:active={currentRoute === 'productos'} 
      on:click={() => navigate('productos')}
    >
      <Package size={19} />
      <span>{isAdmin ? 'Productos e Inventario' : 'Catálogo de Productos'}</span>
    </button>

    {#if isAdmin}
      <button 
        type="button" 
        class="nav-link" 
        class:active={currentRoute === 'tiendas'} 
        on:click={() => navigate('tiendas')}
      >
        <Store size={19} />
        <span>Tiendas y Sucursales</span>
      </button>
    {/if}

    <div class="nav-section-title">{isAdmin ? 'ADMINISTRACIÓN' : 'MI CUENTA'}</div>

    <button 
      type="button" 
      class="nav-link" 
      class:active={currentRoute === 'clientes'} 
      on:click={() => navigate('clientes')}
    >
      <Users size={19} />
      <span>{isAdmin ? 'Clientes' : 'Mis Datos de Cliente'}</span>
    </button>

    {#if isAdmin}
      <button 
        type="button" 
        class="nav-link" 
        class:active={currentRoute === 'usuarios'} 
        on:click={() => navigate('usuarios')}
      >
        <UserCog size={19} />
        <span>Control de Usuarios</span>
      </button>
    {/if}
  </nav>

  <div class="sidebar-footer">
    <div class="user-card">
      <div class="user-avatar">
        {userProfile?.nombre_completo ? userProfile.nombre_completo.charAt(0).toUpperCase() : 'U'}
      </div>
      <div class="user-details">
        <span class="user-name">{userProfile?.nombre_completo || 'Usuario'}</span>
        <span class="user-role-badge {userProfile?.rol}">
          {userProfile?.rol === 'administrador' ? 'Administrador' : 'Cliente'}
        </span>
      </div>
      <button 
        type="button" 
        class="btn-icon logout-btn" 
        on:click={handleLogout} 
        title="Cerrar sesión"
      >
        <LogOut size={18} />
      </button>
    </div>
  </div>
</aside>

<style>
  .sidebar-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(15, 23, 42, 0.6);
    z-index: 80;
    backdrop-filter: blur(2px);
    border: none;
    cursor: pointer;
  }

  .sidebar {
    width: 260px;
    background-color: var(--bg-sidebar);
    color: var(--sidebar-text);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    border-right: 1px solid rgba(255, 255, 255, 0.07);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 90;
  }

  @media (max-width: 900px) {
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      transform: translateX(-100%);
    }

    .sidebar.open {
      transform: translateX(0);
    }
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .brand-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: #ffffff;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
  }

  .brand-info h2 {
    color: #ffffff;
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }

  .brand-info span {
    font-size: 0.72rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .mobile-close {
    margin-left: auto;
    display: none;
  }

  @media (max-width: 900px) {
    .mobile-close {
      display: flex;
    }
  }

  .sidebar-nav {
    flex: 1;
    padding: 20px 14px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .nav-section-title {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: #475569;
    padding: 16px 12px 6px;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    color: var(--sidebar-text);
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    text-align: left;
    width: 100%;
    transition: all 0.15s ease;
    font-family: inherit;
  }

  .nav-link:hover {
    color: var(--sidebar-text-active);
    background-color: var(--sidebar-hover);
  }

  .nav-link.active {
    color: #ffffff;
    background-color: var(--primary-600);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }

  .sidebar-footer {
    padding: 16px 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .user-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background-color: rgba(255, 255, 255, 0.04);
    border-radius: var(--radius-md);
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: #3b82f6;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.95rem;
  }

  .user-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .user-name {
    font-size: 0.84rem;
    font-weight: 600;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-role-badge {
    font-size: 0.7rem;
    padding: 1px 6px;
    border-radius: 4px;
    width: fit-content;
    text-transform: capitalize;
  }

  .user-role-badge.administrador {
    background-color: rgba(59, 130, 246, 0.2);
    color: #93c5fd;
  }

  .user-role-badge.cliente {
    background-color: rgba(16, 185, 129, 0.2);
    color: #6ee7b7;
  }

  .logout-btn {
    color: #94a3b8;
  }

  .logout-btn:hover {
    color: #f87171;
    background-color: rgba(239, 68, 68, 0.15);
  }
</style>
