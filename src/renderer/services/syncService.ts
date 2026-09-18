import { useTableStore } from '@/stores/tableStore'
import { useCashierStore } from '@/stores/cashierStore'

let isInitialized = false
let pollInterval: any = null
let eventSource: EventSource | null = null

export function initRealtimeSync() {
  if (isInitialized) return
  isInitialized = true

  const tableStore = useTableStore()
  const cashierStore = useCashierStore()

  const handleSyncEvent = (type: string) => {
    if (type === 'tables') {
      tableStore.loadTables(true)
    } else if (type === 'cashier') {
      cashierStore.checkActiveSession()
    }
  }

  // 1. Electron Desktop: Listener IPC nativo de latencia casi cero (<5ms)
  if (typeof window !== 'undefined' && window.api?.onSync) {
    window.api.onSync((type) => {
      handleSyncEvent(type)
    })
  }

  // 2. Móvil / Navegadores: Conexión Server-Sent Events (SSE) nativa
  if (typeof window !== 'undefined' && (!window.api || !window.api.onSync)) {
    try {
      eventSource = new EventSource('/api/events')
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data && data.type) {
            handleSyncEvent(data.type)
          }
        } catch {
          // Heartbeat o mensaje de control
        }
      }
      eventSource.onerror = () => {
        // El navegador reintentará automáticamente
      }
    } catch (e) {
      console.warn('[SyncService] SSE error:', e)
    }
  }

  // 3. Polling de respaldo (cada 3.5 segundos) como salvaguarda ante desconexiones de Wi-Fi
  if (!pollInterval) {
    pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        tableStore.loadTables(true)
      }
    }, 3500)
  }
}
