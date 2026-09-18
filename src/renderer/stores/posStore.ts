import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Product, ModifierOption } from '@shared/types/product'
import { Order, OrderItem, SelectedModifier } from '@shared/types/order'
import { useAuthStore } from './authStore'
import { useCashierStore } from './cashierStore'
import { useTableStore } from './tableStore'
import { api } from '@/api'

export const usePosStore = defineStore('pos', () => {
  const currentOrder = ref<Order | null>(null)
  const cartItems = ref<OrderItem[]>([])
  const activeTableId = ref<string | null>(null)
  const activeTableNumber = ref<string>('RAPIDO')
  const isPaymentModalOpen = ref<boolean>(false)
  const selectedProductForModifiers = ref<Product | null>(null)
  const isModifierModalOpen = ref<boolean>(false)

  // Subtotal, impuestos (opcional), Total
  const subtotal = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.final_price, 0)
  })

  const totalAmount = computed(() => subtotal.value)

  const itemsCount = computed(() => {
    return cartItems.value.reduce((count, item) => count + item.quantity, 0)
  })

  async function loadOrderForTable(tableId: string, tableNumber: string) {
    activeTableId.value = tableId
    activeTableNumber.value = tableNumber

    if (tableId) {
      const existing = await api.getActiveOrderByTable(tableId)
      if (existing) {
        currentOrder.value = existing
        cartItems.value = existing.items || []
        return
      }
    }

    // Nueva orden vacía
    currentOrder.value = null
    cartItems.value = []
  }

  function startQuickOrder() {
    activeTableId.value = null
    activeTableNumber.value = 'RAPIDO'
    currentOrder.value = null
    cartItems.value = []
  }

  function addProductToCart(product: Product, selectedMods: SelectedModifier[] = []) {
    // Si el producto tiene grupos de modificadores y no se enviaron modificadores aún, abrir el modal de modificadores
    if (product.modifier_groups && product.modifier_groups.length > 0 && selectedMods.length === 0) {
      selectedProductForModifiers.value = product
      isModifierModalOpen.value = true
      return
    }

    // Calcular precio unitario sumando ajustes de modificadores
    const modTotal = selectedMods.reduce((sum, m) => sum + m.price_adjustment, 0)
    const unitPrice = product.base_price + modTotal

    // Generar firma de modificadores para diferenciar en carrito
    const modSig = selectedMods.map(m => m.modifier_id).sort().join(',')
    const existingIndex = cartItems.value.findIndex(item => {
      if (item.product_id !== product.id) return false
      const itemMods = item.selected_modifiers?.map(m => m.modifier_id).sort().join(',') || ''
      return itemMods === modSig
    })

    if (existingIndex >= 0) {
      const item = cartItems.value[existingIndex]
      item.quantity += 1
      item.final_price = item.unit_price * item.quantity
    } else {
      const newItem: OrderItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: unitPrice,
        final_price: unitPrice,
        modifiers_detail: JSON.stringify(selectedMods),
        selected_modifiers: selectedMods
      }
      cartItems.value.push(newItem)
    }
  }

  function updateItemQuantity(index: number, delta: number) {
    const item = cartItems.value[index]
    if (!item) return

    item.quantity += delta
    if (item.quantity <= 0) {
      cartItems.value.splice(index, 1)
    } else {
      item.final_price = item.unit_price * item.quantity
    }
  }

  function removeItem(index: number) {
    cartItems.value.splice(index, 1)
  }

  function clearCart() {
    cartItems.value = []
    currentOrder.value = null
  }

  async function saveOrderToTable() {
    if (cartItems.value.length === 0) return

    const authStore = useAuthStore()
    const cashierStore = useCashierStore()

    if (!authStore.currentUser) throw new Error('Usuario no autenticado.')
    if (!cashierStore.activeSession) throw new Error('Debe abrir caja antes de registrar pedidos.')

    const plainItems = JSON.parse(JSON.stringify(cartItems.value))

    if (currentOrder.value) {
      // Guardar cambios en orden existente
      const updated = await api.saveOrderItems({
        orderId: currentOrder.value.id,
        items: plainItems
      })
      currentOrder.value = updated
    } else {
      // Crear nueva orden
      const created = await api.createOrder({
        tableId: activeTableId.value,
        tableNumber: activeTableNumber.value,
        userId: authStore.currentUser.id,
        sessionId: cashierStore.activeSession.id,
        items: plainItems
      })
      currentOrder.value = created
    }

    // Refrescar mesas
    const tableStore = useTableStore()
    await tableStore.loadTables()
  }

  async function processPayment(payments: { method: 'Efectivo' | 'Tarjeta' | 'Yape/Plin'; amount: number }[]) {
    if (cartItems.value.length === 0) throw new Error('El carrito está vacío.')

    const cashierStore = useCashierStore()
    if (!cashierStore.activeSession) throw new Error('Debe abrir caja antes de cobrar.')

    // Primero asegurar que la orden existe en DB
    if (!currentOrder.value) {
      await saveOrderToTable()
    }

    if (!currentOrder.value) return

    // Registrar los pagos y cerrar orden
    await api.registerPaymentsAndClose({
      orderId: currentOrder.value.id,
      sessionId: cashierStore.activeSession.id,
      payments: JSON.parse(JSON.stringify(payments))
    })

    // Limpiar estado
    clearCart()
    isPaymentModalOpen.value = false

    // Refrescar mesas y caja
    const tableStore = useTableStore()
    await tableStore.loadTables()
    await cashierStore.checkActiveSession()
  }

  return {
    currentOrder,
    cartItems,
    activeTableId,
    activeTableNumber,
    isPaymentModalOpen,
    selectedProductForModifiers,
    isModifierModalOpen,
    subtotal,
    totalAmount,
    itemsCount,
    loadOrderForTable,
    startQuickOrder,
    addProductToCart,
    updateItemQuantity,
    removeItem,
    clearCart,
    saveOrderToTable,
    processPayment
  }
})
