<script>
  import { onMount } from 'svelte';
  import { subscribeAuth, initAuth, logout, getCurrentProfile } from './lib/services/authService.js';
  import { toast } from './lib/services/toastService.js';

  // Componentes de Interfaz
  import Sidebar from './lib/components/Sidebar.svelte';
  import Topbar from './lib/components/Topbar.svelte';
  import Toast from './lib/components/Toast.svelte';

  // Vistas / Rutas
  import Login from './routes/Login.svelte';
  import Dashboard from './routes/Dashboard.svelte';
  import Ventas from './routes/Ventas.svelte';
  import Reportes from './routes/Reportes.svelte';
  import Productos from './routes/Productos.svelte';
  import Tiendas from './routes/Tiendas.svelte';
  import Clientes from './routes/Clientes.svelte';
  import Usuarios from './routes/Usuarios.svelte';

  let currentUser = null;
  let currentProfile = null;
  let authInitialized = false;

  let currentRoute = 'dashboard';
  let isSidebarOpen = false;

  const routeTitles = {
    dashboard: 'Panel de Control',
    ventas: 'Gestión de Ventas y Comprobantes',
    reportes: 'Reportes y Analítica Comercial',
    productos: 'Inventario y Catálogo de Productos',
    tiendas: 'Mantenimiento de Tiendas y Sucursales',
    clientes: 'Directorio de Clientes',
    usuarios: 'Administración de Usuarios y Accesos'
  };

  onMount(async () => {
    const unsubscribe = subscribeAuth(({ user, profile }) => {
      currentUser = user;
      currentProfile = profile;
    });

    await initAuth();
    authInitialized = true;

    return () => {
      unsubscribe();
    };
  });

  function handleNavigate(route) {
    // Validar control de accesos por rol
    const adminOnlyRoutes = ['reportes', 'tiendas', 'usuarios'];
    if (adminOnlyRoutes.includes(route) && currentProfile?.rol !== 'administrador') {
      toast.warning('Acceso denegado: esta sección requiere privilegios de administrador.');
      currentRoute = 'dashboard';
      return;
    }

    currentRoute = route;
    isSidebarOpen = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleLogout() {
    await logout();
    currentRoute = 'dashboard';
    toast.info('Sesión cerrada correctamente.');
  }

  function handleLoginSuccess(event) {
    const { profile } = event.detail;
    currentRoute = 'dashboard';
  }
</script>

<!-- Notificaciones Globales Toast -->
<Toast />

{#if !authInitialized}
  <!-- Pantalla de Carga Inicial -->
  <div class="initial-loader">
    <div class="spinner" style="width: 44px; height: 44px; border-width: 3px;"></div>
    <h2>Iniciando NovaVentas...</h2>
    <p>Conectando con Supabase y validando sesión</p>
  </div>
{:else if !currentUser}
  <!-- Vista de Autenticación -->
  <Login on:loginSuccess={handleLoginSuccess} />
{:else}
  <!-- Estructura del Panel Administrativo -->
  <div class="app-layout">
    <Sidebar 
      {currentRoute} 
      userProfile={currentProfile} 
      isOpen={isSidebarOpen}
      on:navigate={(e) => handleNavigate(e.detail)}
      on:logout={handleLogout}
      on:close={() => (isSidebarOpen = false)}
    />

    <div class="main-wrapper">
      <Topbar 
        title={routeTitles[currentRoute] || 'NovaVentas'}
        userProfile={currentProfile}
        on:toggleSidebar={() => (isSidebarOpen = !isSidebarOpen)}
        on:logout={handleLogout}
      />

      <main class="content-container">
        {#if currentRoute === 'dashboard'}
          <Dashboard on:navigate={(e) => handleNavigate(e.detail)} />
        {:else if currentRoute === 'ventas'}
          <Ventas />
        {:else if currentRoute === 'reportes'}
          <Reportes />
        {:else if currentRoute === 'productos'}
          <Productos />
        {:else if currentRoute === 'tiendas'}
          <Tiendas />
        {:else if currentRoute === 'clientes'}
          <Clientes />
        {:else if currentRoute === 'usuarios'}
          <Usuarios />
        {/if}
      </main>
    </div>
  </div>
{/if}

<style>
  .initial-loader {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background-color: var(--bg-app);
    color: var(--text-main);
  }

  .initial-loader h2 {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .initial-loader p {
    font-size: 0.88rem;
    color: var(--text-muted);
  }
</style>
