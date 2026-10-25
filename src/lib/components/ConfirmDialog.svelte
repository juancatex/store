<script>
  import { createEventDispatcher } from 'svelte';
  import { AlertTriangle } from 'lucide-svelte';
  import Modal from './Modal.svelte';

  export let isOpen = false;
  export let title = 'Confirmar acción';
  export let message = '¿Está seguro de que desea realizar esta operación?';
  export let confirmText = 'Confirmar';
  export let cancelText = 'Cancelar';
  export let confirmType = 'danger'; // 'danger', 'primary'
  export let isLoading = false;

  const dispatch = createEventDispatcher();

  function handleConfirm() {
    dispatch('confirm');
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<Modal {isOpen} title="" size="sm" on:close={handleCancel}>
  <div class="confirm-body">
    <div class="confirm-icon {confirmType}">
      <AlertTriangle size={28} />
    </div>
    <div class="confirm-text">
      <h4>{title}</h4>
      <p>{message}</p>
    </div>
  </div>

  <div slot="footer" class="confirm-actions">
    <button 
      type="button" 
      class="btn btn-secondary" 
      on:click={handleCancel}
      disabled={isLoading}
    >
      {cancelText}
    </button>
    <button 
      type="button" 
      class="btn {confirmType === 'danger' ? 'btn-danger' : 'btn-primary'}" 
      on:click={handleConfirm}
      disabled={isLoading}
    >
      {#if isLoading}
        <span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span>
      {/if}
      {confirmText}
    </button>
  </div>
</Modal>

<style>
  .confirm-body {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .confirm-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .confirm-icon.danger {
    background-color: var(--danger-bg);
    color: var(--danger-accent);
  }

  .confirm-icon.primary {
    background-color: var(--primary-50);
    color: var(--primary-600);
  }

  .confirm-text h4 {
    margin-bottom: 6px;
    font-size: 1.05rem;
  }

  .confirm-text p {
    font-size: 0.88rem;
    color: var(--text-muted);
    line-height: 1.45;
  }

  .confirm-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    width: 100%;
  }
</style>
