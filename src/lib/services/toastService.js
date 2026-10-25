import { writable } from 'svelte/store';

export const toasts = writable([]);

export const toast = {
  show(message, type = 'info', duration = 4000) {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    toasts.update(all => [...all, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  },
  success(message, duration = 3500) {
    this.show(message, 'success', duration);
  },
  error(message, duration = 5000) {
    this.show(message, 'error', duration);
  },
  info(message, duration = 4000) {
    this.show(message, 'info', duration);
  },
  warning(message, duration = 4500) {
    this.show(message, 'warning', duration);
  },
  remove(id) {
    toasts.update(all => all.filter(t => t.id !== id));
  }
};
