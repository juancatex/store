<script>
  import { toasts, toast } from '../services/toastService.js';
  import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-svelte';
</script>

<div class="toast-container" aria-live="polite">
  {#each $toasts as item (item.id)}
    <div class="toast-item {item.type}">
      <div class="toast-icon">
        {#if item.type === 'success'}
          <CheckCircle2 size={18} />
        {:else if item.type === 'error'}
          <AlertCircle size={18} />
        {:else if item.type === 'warning'}
          <AlertTriangle size={18} />
        {:else}
          <Info size={18} />
        {/if}
      </div>
      <div class="toast-message">
        {item.message}
      </div>
      <button 
        type="button" 
        class="toast-close" 
        on:click={() => toast.remove(item.id)}
        aria-label="Cerrar notificación"
      >
        <X size={15} />
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 420px;
    width: calc(100% - 48px);
    pointer-events: none;
  }

  .toast-item {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    background: #ffffff;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    border: 1px solid var(--border-color);
    font-size: 0.88rem;
    animation: slideIn 0.25s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .toast-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .toast-message {
    flex: 1;
    color: var(--text-main);
    line-height: 1.4;
  }

  .toast-close {
    background: transparent;
    border: none;
    color: var(--text-light);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.15s ease;
  }

  .toast-close:hover {
    color: var(--text-main);
    background-color: #f1f5f9;
  }

  .toast-item.success {
    border-left: 4px solid var(--success-accent);
  }
  .toast-item.success .toast-icon {
    color: var(--success-accent);
  }

  .toast-item.error {
    border-left: 4px solid var(--danger-accent);
  }
  .toast-item.error .toast-icon {
    color: var(--danger-accent);
  }

  .toast-item.warning {
    border-left: 4px solid var(--warning-accent);
  }
  .toast-item.warning .toast-icon {
    color: var(--warning-accent);
  }

  .toast-item.info {
    border-left: 4px solid var(--primary-600);
  }
  .toast-item.info .toast-icon {
    color: var(--primary-600);
  }
</style>
