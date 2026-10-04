<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-200"
      @click.self="handleClose"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] select-none"
      >
        <!-- Cabecera -->
        <div class="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
              <RefreshCw class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-extrabold text-slate-900 font-heading">
                Cambiar Método de Pago
              </h3>
              <p class="text-xs text-slate-500">
                Rectifica cómo fue cobrado el pedido para cuadrar caja
              </p>
            </div>
          </div>

          <button
            @click="handleClose"
            class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Contenido desplazable -->
        <div class="p-5 overflow-y-auto space-y-4 flex-1">
          <!-- Resumen de la Orden y Pago Actual -->
          <div v-if="order" class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800">{{ formatTableDisplay(order.table_number) }}</span>
                <span class="text-slate-400 font-mono">#{{ order.order_number }}</span>
              </div>
              <div class="text-sm font-black text-slate-900 font-heading">
                Total: S/. {{ order.total_amount.toFixed(2) }}
              </div>
            </div>

            <!-- Desglose actual -->
            <div class="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1 flex-wrap">
              <span class="text-[10px] font-bold text-slate-400 uppercase">Pago registrado actualmente:</span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span
                  v-for="p in order.payments"
                  :key="p.id"
                  class="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-white border border-slate-200 text-slate-700"
                >
                  {{ p.payment_method }}: S/. {{ p.amount.toFixed(2) }}
                </span>
                <span v-if="!order.payments || order.payments.length === 0" class="text-slate-400 italic">
                  Caja general
                </span>
              </div>
            </div>
          </div>

          <!-- Selector de Nuevo Método de Pago (Tarjetas Clickeables) -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-slate-700 block">
              Selecciona el NUEVO método de pago:
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <!-- Efectivo -->
              <button
                type="button"
                @click="selectPaymentMode('cash')"
                class="p-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-1"
                :class="selectedMode === 'cash'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200 text-emerald-950 font-bold'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'"
              >
                <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Banknote class="w-4 h-4" />
                </div>
                <span class="text-xs font-extrabold">Efectivo</span>
              </button>

              <!-- Tarjeta -->
              <button
                type="button"
                @click="selectPaymentMode('card')"
                class="p-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-1"
                :class="selectedMode === 'card'
                  ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200 text-indigo-950 font-bold'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'"
              >
                <div class="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <CreditCard class="w-4 h-4" />
                </div>
                <span class="text-xs font-extrabold">Tarjeta</span>
              </button>

              <!-- Yape / Plin -->
              <button
                type="button"
                @click="selectPaymentMode('wallet')"
                class="p-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-1"
                :class="selectedMode === 'wallet'
                  ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-200 text-purple-950 font-bold'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'"
              >
                <div class="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <QrCode class="w-4 h-4" />
                </div>
                <span class="text-xs font-extrabold">Yape/Plin</span>
              </button>

              <!-- Dividido -->
              <button
                type="button"
                @click="selectPaymentMode('split')"
                class="p-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-1"
                :class="selectedMode === 'split'
                  ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200 text-amber-950 font-bold'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'"
              >
                <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Layers class="w-4 h-4" />
                </div>
                <span class="text-xs font-extrabold">Dividido</span>
              </button>
            </div>
          </div>

          <!-- Si es Dividido: Formulario de montos con botones de saldo restante -->
          <div v-if="selectedMode === 'split'" class="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
            <span class="text-xs font-extrabold text-amber-900 block">
              Distribución de montos combinados:
            </span>

            <div class="space-y-2">
              <!-- Fila Efectivo -->
              <div class="flex items-center gap-2">
                <span class="w-20 text-xs font-bold text-slate-700">💵 Efectivo:</span>
                <div class="relative flex-1">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">S/.</span>
                  <input
                    v-model.number="splitCash"
                    type="number"
                    step="0.10"
                    min="0"
                    class="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="button"
                  @click="assignRemainingTo('cash')"
                  class="px-2 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-[11px] font-bold shrink-0 transition-colors"
                >
                  + Resto
                </button>
              </div>

              <!-- Fila Tarjeta -->
              <div class="flex items-center gap-2">
                <span class="w-20 text-xs font-bold text-slate-700">💳 Tarjeta:</span>
                <div class="relative flex-1">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">S/.</span>
                  <input
                    v-model.number="splitCard"
                    type="number"
                    step="0.10"
                    min="0"
                    class="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="button"
                  @click="assignRemainingTo('card')"
                  class="px-2 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-[11px] font-bold shrink-0 transition-colors"
                >
                  + Resto
                </button>
              </div>

              <!-- Fila Yape -->
              <div class="flex items-center gap-2">
                <span class="w-20 text-xs font-bold text-slate-700">📱 Yape/Plin:</span>
                <div class="relative flex-1">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">S/.</span>
                  <input
                    v-model.number="splitWallet"
                    type="number"
                    step="0.10"
                    min="0"
                    class="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="button"
                  @click="assignRemainingTo('wallet')"
                  class="px-2 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-[11px] font-bold shrink-0 transition-colors"
                >
                  + Resto
                </button>
              </div>
            </div>

            <!-- Balance del split -->
            <div class="flex items-center justify-between pt-1 border-t border-amber-200/80 text-xs">
              <span class="font-bold text-slate-600">Suma actual: S/. {{ splitSum.toFixed(2) }}</span>
              <span
                class="font-black"
                :class="isSplitBalanced ? 'text-emerald-700' : 'text-rose-600'"
              >
                {{ isSplitBalanced ? '✓ Total cubierto exacto' : `Faltan S/. ${Math.max(0, (order?.total_amount || 0) - splitSum).toFixed(2)}` }}
              </span>
            </div>
          </div>

          <!-- Motivos Rápidos -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-slate-700 block">
              Motivo del cambio:
            </label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="chip in changeChips"
                :key="chip"
                type="button"
                @click="reason = chip"
                class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border"
                :class="reason === chip
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'"
              >
                {{ chip }}
              </button>
            </div>
          </div>

          <!-- Justificación Obligatoria -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-extrabold text-slate-800">
                Justificación de la modificación <span class="text-rose-500">*</span>
              </label>
              <span class="text-[11px] text-slate-400 font-medium">Obligatorio</span>
            </div>
            <textarea
              v-model="reason"
              rows="2"
              placeholder="Explica la razón del cambio de método de pago..."
              class="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 bg-slate-50/50 resize-none font-medium"
            />
            <p v-if="!isReasonValid && reason.length > 0" class="text-[11px] text-rose-500 font-medium">
              Ingresa al menos 3 caracteres explicando el motivo.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            @click="handleClose"
            class="py-2 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-all"
          >
            Cancelar
          </button>

          <button
            type="button"
            @click="handleConfirm"
            :disabled="!isValid || isSubmitting"
            class="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span v-if="isSubmitting" class="animate-spin mr-1">⌛</span>
            <span>Guardar Nuevo Método</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Order } from '@shared/types/order'
import { formatTableDisplay } from '@shared/utils/formatters'
import { RefreshCw, X, Banknote, CreditCard, QrCode, Layers } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  order: Order | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', data: {
    payments: { method: 'Efectivo' | 'Tarjeta' | 'Yape/Plin'; amount: number }[]
    reason: string
  }): void
}>()

const selectedMode = ref<'cash' | 'card' | 'wallet' | 'split'>('cash')
const splitCash = ref(0)
const splitCard = ref(0)
const splitWallet = ref(0)
const reason = ref('')
const isSubmitting = ref(false)

const changeChips = [
  'Cajero seleccionó Efectivo por error',
  'Cliente pagó con Tarjeta / POS',
  'Cliente pagó con Yape / Plin',
  'Error de digitación en método de pago',
  'Ajuste de cobro mixto'
]

watch(
  () => props.isOpen,
  (val) => {
    if (val && props.order) {
      reason.value = ''
      isSubmitting.value = false
      const current = props.order.payments || []
      if (current.length > 1) {
        selectedMode.value = 'split'
        splitCash.value = current.find((p) => p.payment_method === 'Efectivo')?.amount || 0
        splitCard.value = current.find((p) => p.payment_method === 'Tarjeta')?.amount || 0
        splitWallet.value = current.find((p) => p.payment_method === 'Yape/Plin')?.amount || 0
      } else if (current.length === 1) {
        const method = current[0].payment_method
        if (method === 'Tarjeta') selectedMode.value = 'card'
        else if (method === 'Yape/Plin') selectedMode.value = 'wallet'
        else selectedMode.value = 'cash'
        splitCash.value = props.order.total_amount
        splitCard.value = 0
        splitWallet.value = 0
      } else {
        selectedMode.value = 'cash'
        splitCash.value = props.order.total_amount
        splitCard.value = 0
        splitWallet.value = 0
      }
    }
  }
)

function selectPaymentMode(mode: 'cash' | 'card' | 'wallet' | 'split') {
  selectedMode.value = mode
  const total = props.order?.total_amount || 0

  if (mode === 'cash') {
    splitCash.value = total
    splitCard.value = 0
    splitWallet.value = 0
  } else if (mode === 'card') {
    splitCash.value = 0
    splitCard.value = total
    splitWallet.value = 0
  } else if (mode === 'wallet') {
    splitCash.value = 0
    splitCard.value = 0
    splitWallet.value = total
  }
}

function assignRemainingTo(target: 'cash' | 'card' | 'wallet') {
  const total = props.order?.total_amount || 0
  if (target === 'cash') {
    const remainder = Math.max(0, total - splitCard.value - splitWallet.value)
    splitCash.value = Math.round(remainder * 100) / 100
  } else if (target === 'card') {
    const remainder = Math.max(0, total - splitCash.value - splitWallet.value)
    splitCard.value = Math.round(remainder * 100) / 100
  } else if (target === 'wallet') {
    const remainder = Math.max(0, total - splitCash.value - splitCard.value)
    splitWallet.value = Math.round(remainder * 100) / 100
  }
}

const splitSum = computed(() => {
  return (splitCash.value || 0) + (splitCard.value || 0) + (splitWallet.value || 0)
})

const isSplitBalanced = computed(() => {
  const total = props.order?.total_amount || 0
  return Math.abs(splitSum.value - total) < 0.05
})

const isReasonValid = computed(() => {
  return reason.value.trim().length >= 3
})

const isValid = computed(() => {
  if (!isReasonValid.value) return false
  if (selectedMode.value === 'split') {
    return isSplitBalanced.value && splitSum.value > 0
  }
  return true
})

function handleClose() {
  emit('close')
}

function handleConfirm() {
  if (!isValid.value || !props.order) return

  const total = props.order.total_amount
  const payments: { method: 'Efectivo' | 'Tarjeta' | 'Yape/Plin'; amount: number }[] = []

  if (selectedMode.value === 'cash') {
    payments.push({ method: 'Efectivo', amount: total })
  } else if (selectedMode.value === 'card') {
    payments.push({ method: 'Tarjeta', amount: total })
  } else if (selectedMode.value === 'wallet') {
    payments.push({ method: 'Yape/Plin', amount: total })
  } else {
    if (splitCash.value > 0) payments.push({ method: 'Efectivo', amount: splitCash.value })
    if (splitCard.value > 0) payments.push({ method: 'Tarjeta', amount: splitCard.value })
    if (splitWallet.value > 0) payments.push({ method: 'Yape/Plin', amount: splitWallet.value })
  }

  emit('confirm', {
    payments,
    reason: reason.value.trim()
  })
}
</script>
