<script>
  import { createEventDispatcher } from 'svelte';
  import { login } from '../lib/services/authService.js';
  import { toast } from '../lib/services/toastService.js';
  import { 
    Sparkles, 
    Eye, 
    EyeOff, 
    Lock, 
    User, 
    LogIn, 
    Database, 
    ShoppingBag, 
    TrendingUp, 
    ShieldCheck,
    Store,
    CheckCircle2
  } from 'lucide-svelte';
  import { isSupabaseConfigured } from '../lib/supabase.js';

  const dispatch = createEventDispatcher();

  let identificador = '';
  let contrasena = '';
  let showPassword = false;
  let isLoading = false;
  let errorMessage = '';

  async function handleSubmit() {
    errorMessage = '';
    if (!identificador.trim()) {
      errorMessage = 'Por favor ingrese su usuario o correo electrónico.';
      return;
    }
    if (!contrasena) {
      errorMessage = 'Por favor ingrese su contraseña.';
      return;
    }

    try {
      isLoading = true;
      const { user, profile } = await login(identificador, contrasena);
      toast.success(`¡Bienvenido, ${profile.nombre_completo}!`);
      dispatch('loginSuccess', { user, profile });
    } catch (err) {
      errorMessage = err.message || 'Error al iniciar sesión.';
      toast.error(errorMessage);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="login-container">
  <div class="login-layout">
    <!-- Panel Visual Izquierdo (Hero Comercial de la Tienda) -->
    <div class="hero-panel">
      <!-- Orbes de luz decorativos -->
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>

      <div class="hero-content">
        <div class="brand-badge">
          <div class="brand-badge-icon">
            <ShoppingBag size={24} />
          </div>
          <div class="brand-badge-text">
            <h2>NovaVentas</h2>
            <span>SISTEMA COMERCIAL</span>
          </div>
        </div>

        <div class="hero-text">
          <h1>Potencia tu comercio y controla cada venta en tiempo real.</h1>
          <p>
            Plataforma integral diseñada para la administración inteligente de tiendas, 
            catálogos de productos con ofertas, clientes y reportes de facturación.
          </p>
        </div>

        <!-- Lista de características comerciales con iconos coloridos -->
        <div class="feature-pills">
          <div class="feature-item">
            <div class="feature-icon store-icon">
              <Store size={18} />
            </div>
            <div>
              <strong>Gestión Multi-Tienda</strong>
              <span>Sucursales y responsables centralizados</span>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon sale-icon">
              <TrendingUp size={18} />
            </div>
            <div>
              <strong>Ventas y Facturación Segura</strong>
              <span>Cálculo automático de descuentos y comprobantes</span>
            </div>
          </div>

          <div class="feature-item">
            <div class="feature-icon secure-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <strong>Supabase PostgreSQL & Auth</strong>
              <span>Seguridad RLS y sesiones protegidas</span>
            </div>
          </div>
        </div>

        <!-- Tarjeta Flotante Glassmorphism de Muestra Comercial -->
        <div class="glass-widget">
          <div class="widget-header">
            <div class="live-dot"></div>
            <span>Rendimiento de Ventas Hoy</span>
          </div>
          <div class="widget-body">
            <div class="widget-metric">
              <span class="widget-val">$2,450.80</span>
              <span class="widget-growth">+18.5% ↑</span>
            </div>
            <div class="widget-badge">
              <CheckCircle2 size={13} />
              <span>Base de datos sincronizada</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel Derecho (Formulario de Inicio de Sesión) -->
    <div class="form-panel">
      <div class="form-box">
        <div class="form-header">
          <div class="mobile-brand-pill">
            <ShoppingBag size={18} />
            <span>NovaVentas</span>
          </div>
          <h2>Iniciar Sesión</h2>
          <p>Ingresa tus credenciales para acceder al panel comercial</p>
        </div>

        {#if !isSupabaseConfigured}
          <div class="demo-banner">
            <Database size={16} />
            <div>
              <strong>Modo Demostración Activo</strong>
              <span>Configura las credenciales en <code>.env</code> para conectar Supabase.</span>
            </div>
          </div>
        {/if}

        {#if errorMessage}
          <div class="alert-box" role="alert">
            <span>{errorMessage}</span>
          </div>
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="login-fields">
          <div class="field-group">
            <label for="identificador" class="field-label">
              Usuario o Correo Electrónico <span class="req">*</span>
            </label>
            <div class="input-container">
              <span class="leading-icon">
                <User size={18} />
              </span>
              <input
                id="identificador"
                type="text"
                class="field-input"
                class:input-error={errorMessage && !identificador}
                placeholder="ej: admin@tienda.com o usuario"
                bind:value={identificador}
                disabled={isLoading}
                autocomplete="username"
              />
            </div>
          </div>

          <div class="field-group">
            <label for="contrasena" class="field-label">
              Contraseña <span class="req">*</span>
            </label>
            <div class="input-container">
              <span class="leading-icon">
                <Lock size={18} />
              </span>
              <input
                id="contrasena"
                type={showPassword ? 'text' : 'password'}
                class="field-input"
                class:input-error={errorMessage && !contrasena}
                placeholder="••••••••"
                bind:value={contrasena}
                disabled={isLoading}
                autocomplete="current-password"
              />
              <button
                type="button"
                class="eye-btn"
                on:click={() => (showPassword = !showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {#if showPassword}
                  <EyeOff size={18} />
                {:else}
                  <Eye size={18} />
                {/if}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="submit-btn" 
            disabled={isLoading}
          >
            {#if isLoading}
              <span class="loader-circle"></span>
              <span>Verificando acceso...</span>
            {:else}
              <LogIn size={19} />
              <span>Ingresar al Sistema</span>
            {/if}
          </button>
        </form>

        <div class="form-footer-info">
          <ShieldCheck size={15} color="#10b981" />
          <span>Acceso cifrado y protegido por Supabase Auth PostgreSQL</span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #0f172a;
    padding: 20px;
  }

  .login-layout {
    width: 100%;
    max-width: 1140px;
    min-height: 640px;
    background: #ffffff;
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.35);
    overflow: hidden;
    display: grid;
    grid-template-columns: 1.15fr 1fr;
  }

  @media (max-width: 960px) {
    .login-layout {
      grid-template-columns: 1fr;
      max-width: 480px;
    }
  }

  /* ==========================================================================
     Panel Hero Izquierdo
     ========================================================================== */
  .hero-panel {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4338ca 70%, #6366f1 100%);
    position: relative;
    padding: 48px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    color: #ffffff;
  }

  @media (max-width: 960px) {
    .hero-panel {
      padding: 32px 24px;
    }
  }

  /* Orbes resplandecientes decorativos */
  .glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    pointer-events: none;
  }
  .orb-1 {
    width: 320px;
    height: 320px;
    background: radial-gradient(circle, rgba(147, 51, 234, 0.45) 0%, transparent 70%);
    top: -60px;
    right: -60px;
  }
  .orb-2 {
    width: 340px;
    height: 340px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%);
    bottom: -80px;
    left: -60px;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: space-between;
    gap: 32px;
  }

  .brand-badge {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .brand-badge-icon {
    width: 46px;
    height: 46px;
    background: linear-gradient(135deg, #f59e0b 0%, #ec4899 100%);
    color: #ffffff;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 18px rgba(236, 72, 153, 0.35);
  }

  .brand-badge-text h2 {
    font-size: 1.35rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  .brand-badge-text span {
    font-size: 0.72rem;
    color: #cbd5e1;
    font-weight: 600;
    letter-spacing: 0.1em;
  }

  .hero-text h1 {
    font-size: 1.85rem;
    font-weight: 800;
    line-height: 1.25;
    color: #ffffff;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }

  @media (max-width: 640px) {
    .hero-text h1 {
      font-size: 1.45rem;
    }
  }

  .hero-text p {
    font-size: 0.94rem;
    color: #e0e7ff;
    line-height: 1.55;
  }

  .feature-pills {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  @media (max-width: 960px) {
    .feature-pills {
      display: none;
    }
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.14);
    padding: 10px 16px;
    border-radius: 14px;
    transition: transform 0.2s ease, background 0.2s ease;
  }

  .feature-item:hover {
    transform: translateX(4px);
    background: rgba(255, 255, 255, 0.13);
  }

  .feature-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .store-icon {
    background: rgba(245, 158, 11, 0.25);
    color: #fbbf24;
  }

  .sale-icon {
    background: rgba(16, 185, 129, 0.25);
    color: #34d399;
  }

  .secure-icon {
    background: rgba(59, 130, 246, 0.25);
    color: #60a5fa;
  }

  .feature-item strong {
    display: block;
    font-size: 0.88rem;
    color: #ffffff;
    font-weight: 600;
  }

  .feature-item span {
    font-size: 0.76rem;
    color: #c7d2fe;
  }

  /* Widget Glassmorphism */
  .glass-widget {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    padding: 16px 20px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 960px) {
    .glass-widget {
      display: none;
    }
  }

  .widget-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.78rem;
    color: #e0e7ff;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .live-dot {
    width: 8px;
    height: 8px;
    background-color: #10b981;
    border-radius: 50%;
    box-shadow: 0 0 10px #10b981;
    animation: pulse 1.8s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(0.9); opacity: 0.7; }
    50% { transform: scale(1.3); opacity: 1; }
    100% { transform: scale(0.9); opacity: 0.7; }
  }

  .widget-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .widget-metric {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .widget-val {
    font-size: 1.45rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.01em;
  }

  .widget-growth {
    font-size: 0.85rem;
    color: #34d399;
    font-weight: 700;
    background: rgba(16, 185, 129, 0.25);
    padding: 2px 6px;
    border-radius: 6px;
  }

  .widget-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.74rem;
    color: #e0e7ff;
    background: rgba(255, 255, 255, 0.1);
    padding: 4px 10px;
    border-radius: 9999px;
  }

  /* ==========================================================================
     Panel Formulario Derecho
     ========================================================================== */
  .form-panel {
    background: #ffffff;
    padding: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 640px) {
    .form-panel {
      padding: 32px 20px;
    }
  }

  .form-box {
    width: 100%;
    max-width: 380px;
  }

  .form-header {
    margin-bottom: 28px;
  }

  .mobile-brand-pill {
    display: none;
    align-items: center;
    gap: 8px;
    font-size: 0.82rem;
    font-weight: 700;
    color: #4f46e5;
    background-color: #eef2ff;
    padding: 6px 12px;
    border-radius: 9999px;
    width: fit-content;
    margin-bottom: 12px;
  }

  @media (max-width: 960px) {
    .mobile-brand-pill {
      display: inline-flex;
    }
  }

  .form-header h2 {
    font-size: 1.7rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
    margin-bottom: 6px;
  }

  .form-header p {
    font-size: 0.88rem;
    color: #64748b;
  }

  .demo-banner {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 0.82rem;
    margin-bottom: 20px;
    line-height: 1.4;
  }

  .demo-banner strong {
    display: block;
    font-weight: 600;
  }

  .demo-banner span {
    font-size: 0.76rem;
    color: #3b82f6;
  }

  .alert-box {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 0.84rem;
    margin-bottom: 20px;
    line-height: 1.4;
  }

  .login-fields {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field-label {
    font-size: 0.84rem;
    font-weight: 600;
    color: #334155;
  }

  .field-label .req {
    color: #ef4444;
  }

  .input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .leading-icon {
    position: absolute;
    left: 14px;
    color: #94a3b8;
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  .field-input {
    width: 100%;
    height: 46px;
    padding-left: 42px;
    padding-right: 44px;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
    background-color: #f8fafc;
    font-size: 0.92rem;
    color: #0f172a;
    transition: all 0.2s ease;
  }

  .field-input:focus {
    outline: none;
    background-color: #ffffff;
    border-color: #4f46e5;
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.14);
  }

  .field-input.input-error {
    border-color: #ef4444;
    background-color: #fffbfb;
  }

  .eye-btn {
    position: absolute;
    right: 10px;
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 6px;
    display: flex;
    align-items: center;
    border-radius: 8px;
    transition: color 0.15s ease;
  }

  .eye-btn:hover {
    color: #334155;
  }

  /* Botón con degradado comercial moderno */
  .submit-btn {
    width: 100%;
    height: 48px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #4f46e5 0%, #2563eb 50%, #06b6d4 100%);
    background-size: 200% auto;
    color: #ffffff;
    font-size: 0.96rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4);
    transition: all 0.25s ease;
    margin-top: 6px;
  }

  .submit-btn:hover {
    background-position: right center;
    transform: translateY(-2px);
    box-shadow: 0 14px 24px -5px rgba(37, 99, 235, 0.5);
  }

  .submit-btn:active {
    transform: translateY(0);
  }

  .submit-btn:disabled {
    opacity: 0.65;
    pointer-events: none;
    transform: none;
  }

  .loader-circle {
    width: 18px;
    height: 18px;
    border: 2.5px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .form-footer-info {
    margin-top: 24px;
    padding-top: 18px;
    border-top: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 0.76rem;
    color: #64748b;
    text-align: center;
  }
</style>
