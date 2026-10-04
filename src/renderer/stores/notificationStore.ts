import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export const useNotificationStore = defineStore('notification', () => {
  const toasts = ref<ToastItem[]>([])

  function showToast(type: ToastType, title: string, message?: string, duration = 3500) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    const toast: ToastItem = { id, type, title, message, duration }
    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  function success(title: string, message?: string, duration?: number) {
    return showToast('success', title, message, duration)
  }

  function error(title: string, message?: string, duration?: number) {
    return showToast('error', title, message, duration || 4500)
  }

  function warning(title: string, message?: string, duration?: number) {
    return showToast('warning', title, message, duration)
  }

  function info(title: string, message?: string, duration?: number) {
    return showToast('info', title, message, duration)
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts,
    showToast,
    success,
    error,
    warning,
    info,
    removeToast
  }
})
