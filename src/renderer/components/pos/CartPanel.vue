<template>
  <aside
    class="bg-white border-l border-slate-200/80 flex flex-col h-full shadow-lg select-none transition-all duration-300"
    :class="[
      'fixed inset-0 z-50 md:relative md:z-20 md:w-96',
      isMobileOpen ? 'flex' : 'hidden md:flex'
    ]"
  >
    <!-- Header del Carrito -->
    <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
      <div class="flex items-center gap-2">
        <button
          @click="$emit('closeMobile')"
          class="md:hidden p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg mr-1"
          title="Cerrar / Ir al catálogo"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>

        <div class="p-2 rounded-xl" :class="posStore.activeTableId ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'">
          <UtensilsCrossed v-if="posStore.activeTableId" class="w-5 h-5" />
          <Zap v-else class="w-5 h-5 fill-indigo-600 text-indigo-600" />
        </div>
        <div>
          <h2 class="text-base font-bold text-slate-900 font-heading">
            {{ posStore.activeTableId ? formatTableDisplay(posStore.activeTableNumber) : 'Pedido Rápido ⚡' }}
          </h2>
          <p class="text-xs text-slate-400 font-medium">
            {{ posStore.itemsCount }} {{ posStore.itemsCount === 1 ? 'producto' : 'productos' }} en cuenta
          </p>
        </div>
      </div>

      <button
        v-if="posStore.cartItems.length > 0"
        @click="posStore.clearCart"
        class="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors font-medium"
      >
        Vaciar
      </button>
    </div>

    <!-- Banner informativo de Pedido Activo en Mesa -->
    <div
      v-if="posStore.activeTableId && posStore.currentOrder"
      class="px-4 py-2 bg-amber-50 border-b border-amber-200/70 flex items-center justify-between gap-2 text-xs text-amber-900 font-medium"
    >
      <div class="flex items-center gap-2 truncate">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
        <span class="truncate">Pedido activo en mesa #{{ posStore.currentOrder.order_number || posStore.currentOrder.id.slice(-4) }}</span>
      </div>

      <button
        type="button"
        @click="isCancelOrderModalOpen = true"
        class="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-100/60 px-2 py-0.5 rounded-md transition-colors shrink-0"
        title="Anular comanda activa y liberar mesa"
      >
        Anular Comanda
      </button>
    </div>

    <!-- Lista de Ítems -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div
        v-if="posStore.cartItems.length === 0"
        class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400"
      >
        <ShoppingBag class="w-12 h-12 stroke-[1.5] text-slate-300 mb-2" />
        <p class="text-sm font-semibold text-slate-600">Carrito Vacío</p>
        <p class="text-xs text-slate-400 mt-1">Selecciona productos del catálogo para agregar a la orden.</p>
        <button
          @click="$emit('closeMobile')"
          class="md:hidden mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
        >
          <Plus class="w-4 h-4" />
          <span>Ir al Catálogo</span>
        </button>
      </div>

      <div
        v-for="(item, index) in posStore.cartItems"
        :key="item.id"
        class="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/70 hover:border-slate-300 transition-all flex flex-col justify-between"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1">
            <h4 class="text-sm font-bold text-slate-900 leading-snug">{{ item.product_name }}</h4>
            <p class="text-xs font-semibold text-indigo-600 mt-0.5">
              S/. {{ item.unit_price.toFixed(2) }} c/u
            </p>

            <!-- Modificadores Seleccionados -->
            <div v-if="item.selected_modifiers && item.selected_modifiers.length > 0" class="mt-1.5 space-y-0.5">
              <span
                v-for="mod in item.selected_modifiers"
                :key="mod.modifier_id"
                class="inline-block text-[11px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md mr-1"
              >
                + {{ mod.name }} <template v-if="mod.price_adjustment > 0">(+S/. {{ mod.price_adjustment.toFixed(2) }})</template>
              </span>
            </div>
          </div>

          <button
            @click="posStore.removeItem(index)"
            class="text-slate-300 hover:text-rose-500 p-1 rounded-lg transition-colors"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>

        <!-- Ajuste de Cantidad y Total por ítem -->
        <div class="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
          <div class="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
            <button
              @click="posStore.updateItemQuantity(index, -1)"
              class="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold transition-colors"
            >
              -
            </button>
            <span class="w-6 text-center text-sm font-extrabold text-slate-900 font-heading">
              {{ item.quantity }}
            </span>
            <button
              @click="posStore.updateItemQuantity(index, 1)"
              class="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold transition-colors"
            >
              +
            </button>
          </div>

          <span class="text-sm font-extrabold text-slate-900 font-heading">
            S/. {{ item.final_price.toFixed(2) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Total y Botones de Acción -->
    <div class="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-3 sm:space-y-4 pb-safe">
      <div class="space-y-1 sm:space-y-1.5">
        <div class="flex justify-between text-xs text-slate-500 font-medium">
          <span>Subtotal</span>
          <span>S/. {{ posStore.subtotal.toFixed(2) }}</span>
        </div>
        <div class="flex justify-between text-base sm:text-lg font-black text-slate-900 font-heading pt-1 border-t border-slate-100">
          <span>Total a Pagar</span>
          <span class="text-indigo-600">S/. {{ posStore.totalAmount.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Botón para ir al Catálogo y Agregar Productos (Móvil) -->
      <button
        v-if="posStore.activeTableId"
        type="button"
        @click="$emit('closeMobile')"
        class="md:hidden w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
      >
        <PlusCircle class="w-4 h-4 text-indigo-600" />
        <span>➕ Agregar más productos</span>
      </button>

      <div class="grid grid-cols-2 gap-2 sm:gap-3 pt-1 sm:pt-2">
        <!-- Guardar / Enviar Pedido a Mesa -->
        <button
          v-if="posStore.activeTableId"
          @click="handleSaveOrder"
          :disabled="posStore.cartItems.length === 0"
          class="w-full py-3 px-2 sm:px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-md shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
          :class="!authStore.canDirectCharge ? 'col-span-2 py-3.5 text-sm font-extrabold' : ''"
        >
          <Send class="w-4 h-4" />
          <span>Enviar a Mesa</span>
        </button>

        <!-- Cobrar Modal Button (Visible para Administrador y Cajero en Desktop y Móvil) -->
        <button
          v-if="authStore.canDirectCharge"
          @click="posStore.isPaymentModalOpen = true"
          :disabled="posStore.cartItems.length === 0"
          class="w-full py-3 px-2 sm:px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
          :class="!posStore.activeTableId ? 'col-span-2 py-3.5 text-sm sm:text-base' : ''"
        >
          <CreditCard class="w-4 h-4 sm:w-5 sm:h-5" />
          <span>COBRAR</span>
        </button>

        <!-- Indicador para Mozo en caso de Pedido Rápido sin mesa -->
        <div
          v-if="!authStore.canDirectCharge && !posStore.activeTableId"
          class="col-span-2 text-center text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl"
        >
          El cobro de pedidos rápidos se realiza en Caja
        </div>
      </div>
    </div>

    <!-- Modal Personalizado de Comanda Enviada a Mesa -->
    <OrderSentModal
      :is-open="isOrderSentModalOpen"
      :table-number="lastSavedTableNumber"
      :items-count="lastSavedItemsCount"
      @go-to-tables="handleGoToTables"
      @stay="handleStayInTable"
    />

    <!-- Modal de Anulación de Comanda con Motivo Obligatorio -->
    <OrderReasonModal
      :is-open="isCancelOrderModalOpen"
      mode="cancel_order"
      :order="posStore.currentOrder"
      @close="isCancelOrderModalOpen = false"
      @confirm="handleConfirmCancelOrder"
    />
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatTableDisplay } from '@shared/utils/formatters'
import { api } from '@/api'
import { usePosStore } from '@/stores/posStore'
import { useAuthStore } from '@/stores/authStore'
import { useTableStore } from '@/stores/tableStore'
import { useNotificationStore } from '@/stores/notificationStore'
import OrderSentModal from '@/components/pos/OrderSentModal.vue'
import OrderReasonModal from '@/components/orders/OrderReasonModal.vue'
import { UtensilsCrossed, Zap, ShoppingBag, Trash2, Send, CreditCard, ArrowLeft, Plus, PlusCircle } from 'lucide-vue-next'

defineProps<{
  isMobileOpen?: boolean
}>()

const emit = defineEmits(['closeMobile'])

const router = useRouter()
const posStore = usePosStore()
const authStore = useAuthStore()
const tableStore = useTableStore()
const notificationStore = useNotificationStore()

const isOrderSentModalOpen = ref(false)
const lastSavedTableNumber = ref('')
const lastSavedItemsCount = ref(0)
const isCancelOrderModalOpen = ref(false)

async function handleSaveOrder() {
  try {
    lastSavedTableNumber.value = posStore.activeTableNumber
    lastSavedItemsCount.value = posStore.itemsCount
    await posStore.saveOrderToTable()
    isOrderSentModalOpen.value = true
  } catch (e: any) {
    notificationStore.error('Error al guardar pedido', e.message || 'No se pudo guardar la orden')
  }
}

async function handleConfirmCancelOrder(data: { reason: string }) {
  if (!posStore.currentOrder) return

  try {
    await api.cancelActiveOrder({
      orderId: posStore.currentOrder.id,
      reason: data.reason,
      userId: authStore.currentUser?.id,
      userName: authStore.currentUser?.full_name
    })

    notificationStore.success(
      'Pedido Anulado',
      `La comanda de ${formatTableDisplay(posStore.activeTableNumber)} ha sido cancelada y la mesa liberada.`
    )

    isCancelOrderModalOpen.value = false
    posStore.clearCart()
    await tableStore.loadTables()
    emit('closeMobile')
    router.push('/tables')
  } catch (e: any) {
    notificationStore.error('Error al anular comanda', e.message || 'No se pudo anular la orden activa')
  }
}

function handleGoToTables() {
  isOrderSentModalOpen.value = false
  emit('closeMobile')
  router.push('/tables')
}

function handleStayInTable() {
  isOrderSentModalOpen.value = false
  emit('closeMobile')
}
</script>
