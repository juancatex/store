<script>
  import { createEventDispatcher } from 'svelte';
  import { Menu, Database, ShieldCheck, User, LogOut } from 'lucide-svelte';
  import { isSupabaseConfigured } from '../supabase.js';

  export let title = 'Dashboard';
  export let userProfile = null;

  const dispatch = createEventDispatcher();

  function toggleSidebar() {
    dispatch('toggleSidebar');
  }

  function handleLogout() {
    dispatch('logout');
  }
</script>

<header class="topbar">
  <div class="topbar-left">
    <button 
      type="button" 
      class="btn-icon mobile-menu-btn" 
      on:click={toggleSidebar}
      aria-label="Alternar menú lateral"
    >
      <Menu size={22} />
    </button>
    <div class="topbar-title-block">
      <h2 class="topbar-title">{title}</h2>
      <span class="topbar-subtitle">Sistema Integral de Ventas y Reservas</span>
    </div>
  </div>

  <div class="topbar-right">
    <!-- Estado de conexión a Supabase -->
    <div class="connection-status {isSupabaseConfigured ? 'connected' : 'demo'}" title={isSupabaseConfigured ? 'Conectado a Supabase PostgreSQL' : 'Modo Demostración local (Configure .env)'}>
      <Database size={14} />
      <span>{isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Demo Activo'}</span>
    </div>

    <!-- Perfil de usuario -->
    <div class="user-pill">
      <div class="user-avatar-sm">
        {userProfile?.nombre_completo ? userProfile.nombre_completo.charAt(0).toUpperCase() : 'U'}
      </div>
      <div class="user-info-text">
        <span class="user-display-name">{userProfile?.nombre_completo || 'Usuario'}</span>
        <span class="user-role-label">{userProfile?.rol || 'Rol'}</span>
      </div>
    </div>

    <!-- Botón de salida rápida -->
    <button 
      type="button" 
      class="btn-icon logout-quick-btn" 
      on:click={handleLogout}
      title="Cerrar sesión"
      aria-label="Cerrar sesión"
    >
      <LogOut size={19} />
    </button>
  </div>
</header>

<style>
  .topbar {
    height: 68px;
    background-color: var(--bg-surface);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    position: sticky;
    top: 0;
    z-index: 50;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  }

  @media (max-width: 768px) {
    .topbar {
      padding: 0 16px;
      height: 60px;
    }
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .mobile-menu-btn {
    display: none;
  }

  @media (max-width: 900px) {
    .mobile-menu-btn {
      display: flex;
    }
  }

  .topbar-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-main);
    line-height: 1.2;
  }

  .topbar-subtitle {
    font-size: 0.76rem;
    color: var(--text-light);
  }

  @media (max-width: 600px) {
    .topbar-subtitle {
      display: none;
    }
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .connection-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .connection-status.connected {
    background-color: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }

  .connection-status.demo {
    background-color: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  @media (max-width: 640px) {
    .connection-status span {
      display: none;
    }
    .connection-status {
      padding: 6px;
    }
  }

  .user-pill {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 10px 4px 6px;
    border-radius: 9999px;
    background-color: #f8fafc;
    border: 1px solid var(--border-color);
  }

  .user-avatar-sm {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: var(--primary-600);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .user-info-text {
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  .user-display-name {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-main);
    max-width: 130px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-role-label {
    font-size: 0.68rem;
    color: var(--text-muted);
    text-transform: capitalize;
  }

  @media (max-width: 520px) {
    .user-info-text {
      display: none;
    }
    .user-pill {
      padding: 3px;
    }
  }

  .logout-quick-btn {
    color: var(--text-muted);
  }

  .logout-quick-btn:hover {
    color: var(--danger-accent);
    background-color: var(--danger-bg);
  }
</style>
