<template>
  <Modal
    :is-open="posStore.isPaymentModalOpen"
    title="Cobro de Orden"
    max-width="xl"
    @close="posStore.isPaymentModalOpen = false"
  >
    <template #icon>
      <CreditCard class="w-5 h-5 text-indigo-600" />
    </template>

    <div class="space-y-4 sm:space-y-5">
      <!-- Total a Cobrar Resumen con Ubicación de la Mesa -->
      <div class="bg-gradient-to-r from-indigo-50/90 to-purple-50/80 rounded-2xl p-3.5 sm:p-4 border border-indigo-100/80 flex items-center justify-between">
        <div>
          <div class="flex items-center gap-1.5 text-xs font-bold text-indigo-700 mb-0.5">
            <Zap v-if="posStore.activeTableNumber === 'RAPIDO'" class="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <UtensilsCrossed v-else class="w-3.5 h-3.5 text-indigo-600" />
            <span>{{ formatTableDisplay(posStore.activeTableNumber) }}</span>
            <span v-if="posStore.currentOrder" class="text-slate-400 font-mono text-[11px]">
              (#{{ posStore.currentOrder.order_number }})
            </span>
          </div>
          <p class="text-3xl sm:text-4xl font-black text-slate-900 font-heading tracking-tight">
            S/. {{ posStore.totalAmount.toFixed(2) }}
          </p>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-400 font-medium block">Total Cuenta</span>
          <p class="text-xs sm:text-sm font-bold text-slate-700 bg-white/80 px-2.5 py-1 rounded-xl border border-slate-200/60 inline-block mt-0.5">
            {{ posStore.itemsCount }} {{ posStore.itemsCount === 1 ? 'producto' : 'productos' }}
          </p>
        </div>
      </div>

      <!-- Selector de Método de Pago Clickeable -->
      <div>
        <label class="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block mb-2">
          Selecciona el Método de Pago
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
          <!-- Botón Efectivo -->
          <button
            type="button"
            @click="selectPaymentMode('cash')"
            class="p-2.5 sm:p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 active:scale-95 cursor-pointer"
            :class="paymentMode === 'cash'
              ? 'border-emerald-500 bg-emerald-50/70 shadow-sm shadow-emerald-100 text-emerald-950 ring-2 ring-emerald-200'
              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:bg-slate-50'"
          >
            <div
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors"
              :class="paymentMode === 'cash' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'"
            >
              <Banknote class="w-5 h-5" />
            </div>
            <span class="font-extrabold text-xs sm:text-sm leading-tight font-heading">Efectivo</span>
            <span class="text-[10px] text-slate-400 font-medium">Con vuelto</span>
          </button>

          <!-- Botón Tarjeta -->
          <button
            type="button"
            @click="selectPaymentMode('card')"
            class="p-2.5 sm:p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 active:scale-95 cursor-pointer"
            :class="paymentMode === 'card'
              ? 'border-indigo-500 bg-indigo-50/70 shadow-sm shadow-indigo-100 text-indigo-950 ring-2 ring-indigo-200'
              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:bg-slate-50'"
          >
            <div
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors"
              :class="paymentMode === 'card' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'"
            >
              <CreditCard class="w-5 h-5" />
            </div>
            <span class="font-extrabold text-xs sm:text-sm leading-tight font-heading">Tarjeta</span>
            <span class="text-[10px] text-slate-400 font-medium">Terminal POS</span>
          </button>

          <!-- Botón Yape / Plin -->
          <button
            type="button"
            @click="selectPaymentMode('yape')"
            class="p-2.5 sm:p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 active:scale-95 cursor-pointer"
            :class="paymentMode === 'yape'
              ? 'border-purple-500 bg-purple-50/70 shadow-sm shadow-purple-100 text-purple-950 ring-2 ring-purple-200'
              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:bg-slate-50'"
          >
            <div
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors"
              :class="paymentMode === 'yape' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600'"
            >
              <QrCode class="w-5 h-5" />
            </div>
            <span class="font-extrabold text-xs sm:text-sm leading-tight font-heading">Yape / Plin</span>
            <span class="text-[10px] text-slate-400 font-medium">Billetera Digital</span>
          </button>

          <!-- Botón Dividido / Mixto -->
          <button
            type="button"
            @click="selectPaymentMode('split')"
            class="p-2.5 sm:p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 active:scale-95 cursor-pointer"
            :class="paymentMode === 'split'
              ? 'border-amber-500 bg-amber-50/70 shadow-sm shadow-amber-100 text-amber-950 ring-2 ring-amber-200'
              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:bg-slate-50'"
          >
            <div
              class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors"
              :class="paymentMode === 'split' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600'"
            >
              <Layers class="w-5 h-5" />
            </div>
            <span class="font-extrabold text-xs sm:text-sm leading-tight font-heading">Dividido</span>
            <span class="text-[10px] text-slate-400 font-medium">Pago Mixto</span>
          </button>
        </div>
      </div>

      <!-- Paneles Dinámicos Contextuales según el Modo Seleccionado -->

      <!-- 1. Panel de EFECTIVO -->
      <div v-if="paymentMode === 'cash'" class="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Banknote class="w-4 h-4 text-emerald-600" />
            Billetes / Monto Rápido
          </span>

          <!-- Botón de Monto Exacto -->
          <button
            type="button"
            @click="setExactCash"
            class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 active:scale-95"
          >
            <Zap class="w-3.5 h-3.5 fill-white" />
            <span>Exacto (S/. {{ posStore.totalAmount.toFixed(2) }})</span>
          </button>
        </div>

        <!-- Billetes Sugeridos -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            v-for="preset in suggestedBills"
            :key="preset"
            type="button"
            @click="cashTendered = preset"
            class="flex-1 min-w-[65px] py-1.5 px-2 text-xs font-black rounded-xl border transition-all active:scale-95 text-center font-heading"
            :class="cashTendered === preset
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700'"
          >
            S/. {{ preset }}
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label class="text-[11px] font-bold text-slate-500 block mb-1">Efectivo Entregado</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">S/.</span>
              <input
                v-model.number="cashTendered"
                type="number"
                step="0.50"
                min="0"
                placeholder="0.00"
                class="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-black font-heading text-base sm:text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label class="text-[11px] font-bold text-slate-500 block mb-1">Vuelto a Entregar</label>
            <div
              class="w-full px-3 py-2 rounded-xl border flex flex-col justify-center transition-colors min-h-[44px]"
              :class="calculatedChange > 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : (cashTendered >= posStore.totalAmount ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-rose-50 border-rose-200 text-rose-800')"
            >
              <div class="flex items-baseline justify-between">
                <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider" :class="calculatedChange > 0 ? 'text-emerald-700' : 'text-slate-400'">
                  {{ calculatedChange > 0 ? 'Vuelto:' : (cashTendered >= posStore.totalAmount ? 'Sin vuelto' : 'Faltante') }}
                </span>
                <span class="text-lg sm:text-xl font-black font-heading">
                  S/. {{ calculatedChange > 0 ? calculatedChange.toFixed(2) : (cashTendered >= posStore.totalAmount ? '0.00' : Math.abs(posStore.totalAmount - cashTendered).toFixed(2)) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Panel de TARJETA -->
      <div v-else-if="paymentMode === 'card'" class="bg-indigo-50/70 p-4 sm:p-5 rounded-2xl border border-indigo-200/80 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
            <CreditCard class="w-6 h-6" />
          </div>
          <div class="min-w-0">
            <h4 class="text-xs sm:text-sm font-black text-indigo-950 font-heading">Cobro con Tarjeta en Terminal POS</h4>
            <p class="text-[11px] sm:text-xs text-indigo-700 mt-0.5 truncate">Se procesará el 100% de la cuenta con POS físico.</p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="text-[10px] uppercase font-bold text-indigo-500 block">Total a Cobrar</span>
          <span class="text-xl sm:text-2xl font-black text-indigo-900 font-heading">
            S/. {{ posStore.totalAmount.toFixed(2) }}
          </span>
        </div>
      </div>

      <!-- 3. Panel de YAPE / PLIN -->
      <div v-else-if="paymentMode === 'yape'" class="bg-purple-50/70 p-4 sm:p-5 rounded-2xl border border-purple-200/80 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-200">
            <QrCode class="w-6 h-6" />
          </div>
          <div class="min-w-0">
            <h4 class="text-xs sm:text-sm font-black text-purple-950 font-heading">Cobro vía Yape o Plin</h4>
            <p class="text-[11px] sm:text-xs text-purple-700 mt-0.5 truncate">Verifica la notificación o comprobante en tu teléfono.</p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="text-[10px] uppercase font-bold text-purple-500 block">Total a Cobrar</span>
          <span class="text-xl sm:text-2xl font-black text-purple-900 font-heading">
            S/. {{ posStore.totalAmount.toFixed(2) }}
          </span>
        </div>
      </div>

      <!-- 4. Panel de PAGO DIVIDIDO / MIXTO -->
      <div v-else-if="paymentMode === 'split'" class="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers class="w-4 h-4 text-amber-600" />
            Distribuir Montos por Método
          </span>
          <span
            class="text-[11px] font-black px-2.5 py-0.5 rounded-full"
            :class="isPaymentSquare ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
          >
            {{ isPaymentSquare ? 'Cuadre Exacto ✓' : `Faltan S/. ${splitRemaining.toFixed(2)}` }}
          </span>
        </div>

        <div class="space-y-2">
          <!-- Fila Efectivo en Split -->
          <div class="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <Banknote class="w-4 h-4 text-emerald-600 shrink-0" />
              <span class="text-xs font-bold text-slate-800">Efectivo</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="splitRemaining > 0 && splitCashAmount === 0"
                type="button"
                @click="assignRemaining('cash')"
                class="px-2 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                + Restante
              </button>
              <div class="relative w-28 sm:w-32">
                <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">S/.</span>
                <input
                  v-model.number="splitCashAmount"
                  type="number"
                  step="0.50"
                  min="0"
                  placeholder="0.00"
                  class="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold font-heading text-sm text-right focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Fila Tarjeta en Split -->
          <div class="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <CreditCard class="w-4 h-4 text-indigo-600 shrink-0" />
              <span class="text-xs font-bold text-slate-800">Tarjeta</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="splitRemaining > 0 && cardAmount === 0"
                type="button"
                @click="assignRemaining('card')"
                class="px-2 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                + Restante
              </button>
              <div class="relative w-28 sm:w-32">
                <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">S/.</span>
                <input
                  v-model.number="cardAmount"
                  type="number"
                  step="0.50"
                  min="0"
                  placeholder="0.00"
                  class="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold font-heading text-sm text-right focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Fila Yape en Split -->
          <div class="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <QrCode class="w-4 h-4 text-purple-600 shrink-0" />
              <span class="text-xs font-bold text-slate-800">Yape / Plin</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="splitRemaining > 0 && yapeAmount === 0"
                type="button"
                @click="assignRemaining('yape')"
                class="px-2 py-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                + Restante
              </button>
              <div class="relative w-28 sm:w-32">
                <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">S/.</span>
                <input
                  v-model.number="yapeAmount"
                  type="number"
                  step="0.50"
                  min="0"
                  placeholder="0.00"
                  class="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold font-heading text-sm text-right focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen Cuadre de Pago -->
      <div class="border-t border-slate-100 pt-3 flex items-center justify-between">
        <div>
          <span class="text-xs text-slate-400 font-medium">Total Registrado</span>
          <p class="text-base sm:text-lg font-black font-heading" :class="isPaymentSquare ? 'text-emerald-600' : 'text-rose-600'">
            S/. {{ totalPaidCalculated.toFixed(2) }} <span class="text-slate-400 text-xs font-normal">/ S/. {{ posStore.totalAmount.toFixed(2) }}</span>
          </p>
        </div>

        <div v-if="!isPaymentSquare" class="text-right">
          <span class="text-xs text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
            {{ totalPaidCalculated < posStore.totalAmount ? `Faltan S/. ${(posStore.totalAmount - totalPaidCalculated).toFixed(2)}` : `Excede S/. ${(totalPaidCalculated - posStore.totalAmount).toFixed(2)}` }}
          </span>
        </div>
        <div v-else class="text-right">
          <span class="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 class="w-4 h-4 text-emerald-600" />
            <span>Listo para cobrar</span>
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        @click="posStore.isPaymentModalOpen = false"
        class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
      >
        Cancelar
      </button>
      <button
        @click="confirmPayment"
        :disabled="!isPaymentSquare || isProcessing"
        class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-black shadow-md shadow-emerald-200 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
      >
        <CheckCircle2 class="w-4 h-4" />
        <span>COMPLETAR VENTA</span>
      </button>
    </template>
  </Modal>

  <!-- Modal Personalizado de Cobro Exitoso -->
  <PaymentSuccessModal
    :is-open="isSuccessModalOpen"
    :order-number="completedOrderNumber"
    :table-number="completedTableNumber"
    :total-amount="completedTotalAmount"
    :payments="completedPayments"
    :change-amount="completedChangeAmount"
    @new-sale="handleNewSale"
    @close="isSuccessModalOpen = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePosStore } from '@/stores/posStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { formatTableDisplay } from '@shared/utils/formatters'
import Modal from '@/components/common/Modal.vue'
import PaymentSuccessModal from '@/components/pos/PaymentSuccessModal.vue'
import {
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Zap,
  UtensilsCrossed,
  Layers
} from 'lucide-vue-next'

const router = useRouter()
const posStore = usePosStore()
const notificationStore = useNotificationStore()

// Modo de pago seleccionado: 'cash' | 'card' | 'yape' | 'split'
type PaymentMode = 'cash' | 'card' | 'yape' | 'split'
const paymentMode = ref<PaymentMode>('cash')

// Montos
const cashTendered = ref<number>(0)
const cardAmount = ref<number>(0)
const yapeAmount = ref<number>(0)
const splitCashAmount = ref<number>(0)
const isProcessing = ref<boolean>(false)

// Estados para el Modal de Cobro Exitoso
const isSuccessModalOpen = ref(false)
const completedOrderNumber = ref<number | string | undefined>()
const completedTableNumber = ref<string>('')
const completedTotalAmount = ref<number>(0)
const completedPayments = ref<{ method: string; amount: number }[]>([])
const completedChangeAmount = ref<number>(0)

// Al abrir el modal, inicializar en modo Efectivo con monto exacto listo
watch(() => posStore.isPaymentModalOpen, (isOpen) => {
  if (isOpen) {
    selectPaymentMode('cash')
  }
})

// Función para cambiar de método de pago clickeable
function selectPaymentMode(mode: PaymentMode) {
  paymentMode.value = mode
  const total = posStore.totalAmount

  if (mode === 'cash') {
    cashTendered.value = total
    cardAmount.value = 0
    yapeAmount.value = 0
    splitCashAmount.value = 0
  } else if (mode === 'card') {
    cardAmount.value = total
    cashTendered.value = 0
    yapeAmount.value = 0
    splitCashAmount.value = 0
  } else if (mode === 'yape') {
    yapeAmount.value = total
    cashTendered.value = 0
    cardAmount.value = 0
    splitCashAmount.value = 0
  } else if (mode === 'split') {
    splitCashAmount.value = 0
    cardAmount.value = 0
    yapeAmount.value = 0
    cashTendered.value = 0
  }
}

// Billetes sugeridos inteligentes según el total
const suggestedBills = computed(() => {
  const total = posStore.totalAmount
  const standard = [10, 20, 50, 100, 200]
  const higher = standard.filter(b => b >= total)
  if (higher.length >= 3) {
    return higher.slice(0, 4)
  }
  return standard.slice(-4)
})

function setExactCash() {
  cashTendered.value = posStore.totalAmount
}

// Vuelto en modo Efectivo
const calculatedChange = computed(() => {
  if (paymentMode.value !== 'cash') return 0
  const diff = (cashTendered.value || 0) - posStore.totalAmount
  return diff > 0 ? diff : 0
})

// Total pagado según el modo activo
const totalPaidCalculated = computed(() => {
  if (paymentMode.value === 'card') {
    return cardAmount.value || 0
  }
  if (paymentMode.value === 'yape') {
    return yapeAmount.value || 0
  }
  if (paymentMode.value === 'cash') {
    return Math.min(cashTendered.value || 0, posStore.totalAmount)
  }
  // En modo split
  return (splitCashAmount.value || 0) + (cardAmount.value || 0) + (yapeAmount.value || 0)
})

// Restante por asignar en modo Split
const splitRemaining = computed(() => {
  const current = (splitCashAmount.value || 0) + (cardAmount.value || 0) + (yapeAmount.value || 0)
  const rem = posStore.totalAmount - current
  return rem > 0 ? Number(rem.toFixed(2)) : 0
})

// Asignar el restante a un método específico en modo split
function assignRemaining(method: 'cash' | 'card' | 'yape') {
  const rem = splitRemaining.value
  if (rem <= 0) return

  if (method === 'cash') {
    splitCashAmount.value = Number(((splitCashAmount.value || 0) + rem).toFixed(2))
  } else if (method === 'card') {
    cardAmount.value = Number(((cardAmount.value || 0) + rem).toFixed(2))
  } else if (method === 'yape') {
    yapeAmount.value = Number(((yapeAmount.value || 0) + rem).toFixed(2))
  }
}

// Validación de que la cuenta está completa
const isPaymentSquare = computed(() => {
  if (paymentMode.value === 'cash') {
    return (cashTendered.value || 0) >= posStore.totalAmount - 0.01
  }
  return Math.abs(totalPaidCalculated.value - posStore.totalAmount) < 0.01
})

async function confirmPayment() {
  if (!isPaymentSquare.value) {
    notificationStore.warning('Monto Incompleto', 'El total pagado no coincide con el total de la orden.')
    return
  }

  isProcessing.value = true
  try {
    const payments: { method: 'Efectivo' | 'Tarjeta' | 'Yape/Plin'; amount: number }[] = []

    if (paymentMode.value === 'card') {
      payments.push({ method: 'Tarjeta', amount: posStore.totalAmount })
    } else if (paymentMode.value === 'yape') {
      payments.push({ method: 'Yape/Plin', amount: posStore.totalAmount })
    } else if (paymentMode.value === 'cash') {
      payments.push({ method: 'Efectivo', amount: posStore.totalAmount })
    } else if (paymentMode.value === 'split') {
      if (splitCashAmount.value > 0) {
        payments.push({ method: 'Efectivo', amount: splitCashAmount.value })
      }
      if (cardAmount.value > 0) {
        payments.push({ method: 'Tarjeta', amount: cardAmount.value })
      }
      if (yapeAmount.value > 0) {
        payments.push({ method: 'Yape/Plin', amount: yapeAmount.value })
      }
    }

    // Capturar información para el modal de éxito antes de que se limpie la orden
    completedOrderNumber.value = posStore.currentOrder?.order_number
    completedTableNumber.value = posStore.activeTableNumber
    completedTotalAmount.value = posStore.totalAmount
    completedPayments.value = [...payments]
    completedChangeAmount.value = calculatedChange.value

    await posStore.processPayment(payments)

    // Mostrar modal personalizado de cobro exitoso
    isSuccessModalOpen.value = true
  } catch (e: any) {
    notificationStore.error('Error al procesar pago', e.message || 'No se pudo completar el cobro')
  } finally {
    isProcessing.value = false
  }
}

function handleNewSale() {
  isSuccessModalOpen.value = false
  router.push('/tables')
}
</script>
