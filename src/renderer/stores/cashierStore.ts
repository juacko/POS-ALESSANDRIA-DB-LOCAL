import { defineStore } from 'pinia'
import { ref } from 'vue'
import { CashierSession, CashMovement } from '@shared/types/cashier'
import { useAuthStore } from './authStore'
import { api } from '@/api'

export const useCashierStore = defineStore('cashier', () => {
  const activeSession = ref<CashierSession | null>(null)
  const movementsList = ref<CashMovement[]>([])
  const sessionTotals = ref<any>(null)
  const isCashModalOpen = ref<boolean>(false)
  const isMovementModalOpen = ref<boolean>(false)

  async function checkActiveSession() {
    try {
      const session = await api.getActiveCashierSession()
      activeSession.value = session
      if (session) {
        await loadMovements(session.id)
        await loadSessionTotals(session.id, session.initial_cash)
      }
    } catch (e) {
      console.error('Error al consultar sesión de caja', e)
    }
  }

  async function openSession(initialCash: number) {
    const authStore = useAuthStore()
    if (!authStore.currentUser) throw new Error('Debe iniciar sesión para abrir caja.')

    const session = await api.openCashierSession({
      userId: authStore.currentUser.id,
      initialCash
    })
    activeSession.value = session
    await checkActiveSession()
  }

  async function closeSession(actualCash: number, notes?: string) {
    if (!activeSession.value) return
    await api.closeCashierSession({
      sessionId: activeSession.value.id,
      actualCash,
      notes
    })
    activeSession.value = null
    sessionTotals.value = null
    movementsList.value = []
  }

  async function addMovement(type: 'Ingreso' | 'Egreso', amount: number, description: string) {
    if (!activeSession.value) throw new Error('No hay caja abierta')
    await api.addCashMovement({
      sessionId: activeSession.value.id,
      type,
      amount,
      description
    })
    await checkActiveSession()
  }

  async function loadMovements(sessionId: string) {
    movementsList.value = await api.getCashMovements(sessionId)
  }

  async function loadSessionTotals(sessionId: string, initialCash: number) {
    sessionTotals.value = await api.getCashierSessionTotals({ sessionId, initialCash })
  }

  return {
    activeSession,
    movementsList,
    sessionTotals,
    isCashModalOpen,
    isMovementModalOpen,
    checkActiveSession,
    openSession,
    closeSession,
    addMovement
  }
})
