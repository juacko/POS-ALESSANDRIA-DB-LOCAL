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

    <div class="space-y-6">
      <!-- Total a Cobrar Resumen -->
      <div class="bg-indigo-50/80 rounded-2xl p-4 border border-indigo-100 flex items-center justify-between">
        <div>
          <span class="text-xs uppercase font-extrabold tracking-wider text-indigo-600">Total a Cobrar</span>
          <p class="text-3xl font-black text-indigo-900 font-heading">
            S/. {{ posStore.totalAmount.toFixed(2) }}
          </p>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-500 font-medium">Ítems</span>
          <p class="text-sm font-bold text-slate-800">{{ posStore.itemsCount }} productos</p>
        </div>
      </div>

      <!-- Métodos de Pago Disponibles -->
      <div class="space-y-4">
        <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Desglose de Pago (Split Payment)</h4>

        <!-- Efectivo -->
        <div class="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <label class="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <Banknote class="w-4 h-4 text-emerald-600" />
              <span>Efectivo</span>
            </label>
            <div class="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                v-for="preset in [10, 20, 50, 100]"
                :key="preset"
                type="button"
                @click="cashTendered = preset"
                class="px-2 py-1 text-xs font-bold bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 rounded-lg transition-colors active:scale-95"
              >
                S/. {{ preset }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label class="text-[10px] sm:text-[11px] font-semibold text-slate-500 block mb-1">Efectivo Entregado</label>
              <input
                v-model.number="cashTendered"
                type="number"
                step="0.50"
                min="0"
                placeholder="S/. 0.00"
                class="w-full px-2.5 sm:px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold font-heading text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label class="text-[10px] sm:text-[11px] font-semibold text-slate-500 block mb-1">Vuelto a Entregar</label>
              <div class="w-full px-2.5 sm:px-3 py-2 bg-emerald-100/60 border border-emerald-200 rounded-xl text-emerald-900 font-black font-heading text-base sm:text-lg truncate">
                S/. {{ calculatedChange.toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjeta (Débito/Crédito) -->
        <div class="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 sm:gap-4">
          <label class="flex items-center gap-2 font-bold text-slate-800 text-xs sm:text-sm">
            <CreditCard class="w-4 h-4 text-indigo-600 shrink-0" />
            <span class="truncate">Tarjeta</span>
          </label>
          <div class="w-28 sm:w-40 shrink-0">
            <input
              v-model.number="cardAmount"
              type="number"
              step="0.50"
              min="0"
              placeholder="S/. 0.00"
              class="w-full px-2.5 sm:px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold font-heading text-right text-xs sm:text-base focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <!-- Yape / Plin -->
        <div class="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 sm:gap-4">
          <label class="flex items-center gap-2 font-bold text-slate-800 text-xs sm:text-sm">
            <QrCode class="w-4 h-4 text-purple-600 shrink-0" />
            <span class="truncate">Yape / Plin</span>
          </label>
          <div class="w-28 sm:w-40 shrink-0">
            <input
              v-model.number="yapeAmount"
              type="number"
              step="0.50"
              min="0"
              placeholder="S/. 0.00"
              class="w-full px-2.5 sm:px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold font-heading text-right text-xs sm:text-base focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      <!-- Resumen Cuadre de Pago -->
      <div class="border-t border-slate-100 pt-4 flex items-center justify-between">
        <div>
          <span class="text-xs text-slate-400 font-medium">Total Registrado</span>
          <p class="text-lg font-bold font-heading" :class="isPaymentSquare ? 'text-emerald-600' : 'text-rose-600'">
            S/. {{ totalPaidCalculated.toFixed(2) }} / S/. {{ posStore.totalAmount.toFixed(2) }}
          </p>
        </div>

        <div v-if="!isPaymentSquare" class="text-right">
          <span class="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
            Faltan S/. {{ Math.abs(posStore.totalAmount - totalPaidCalculated).toFixed(2) }}
          </span>
        </div>
        <div v-else class="text-right">
          <span class="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
            Monto Completo
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
        class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-black shadow-md shadow-emerald-200 transition-all flex items-center gap-2"
      >
        <CheckCircle2 class="w-4 h-4" />
        <span>COMPLETAR VENTA</span>
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePosStore } from '@/stores/posStore'
import Modal from '@/components/common/Modal.vue'
import { CreditCard, Banknote, QrCode, CheckCircle2 } from 'lucide-vue-next'

const posStore = usePosStore()

const cashTendered = ref<number>(0)
const cardAmount = ref<number>(0)
const yapeAmount = ref<number>(0)
const isProcessing = ref<boolean>(false)

watch(() => posStore.isPaymentModalOpen, (isOpen) => {
  if (isOpen) {
    // Por defecto, prellenar con efectivo total
    cashTendered.value = posStore.totalAmount
    cardAmount.value = 0
    yapeAmount.value = 0
  }
})

// En efectivo, el monto real que cubre la cuenta es mínimo entre entregado y lo restante
const effectiveCashPayment = computed(() => {
  const remainingAfterOther = posStore.totalAmount - (cardAmount.value || 0) - (yapeAmount.value || 0)
  return Math.min(cashTendered.value || 0, Math.max(0, remainingAfterOther))
})

const calculatedChange = computed(() => {
  const remainingAfterOther = posStore.totalAmount - (cardAmount.value || 0) - (yapeAmount.value || 0)
  const diff = (cashTendered.value || 0) - remainingAfterOther
  return diff > 0 ? diff : 0
})

const totalPaidCalculated = computed(() => {
  return effectiveCashPayment.value + (cardAmount.value || 0) + (yapeAmount.value || 0)
})

const isPaymentSquare = computed(() => {
  return Math.abs(totalPaidCalculated.value - posStore.totalAmount) < 0.01
})

async function confirmPayment() {
  if (!isPaymentSquare.value) {
    alert('El total pagado no coincide con el total de la orden.')
    return
  }

  isProcessing.value = true
  try {
    const payments: { method: 'Efectivo' | 'Tarjeta' | 'Yape/Plin'; amount: number }[] = []

    if (effectiveCashPayment.value > 0) {
      payments.push({ method: 'Efectivo', amount: effectiveCashPayment.value })
    }
    if (cardAmount.value > 0) {
      payments.push({ method: 'Tarjeta', amount: cardAmount.value })
    }
    if (yapeAmount.value > 0) {
      payments.push({ method: 'Yape/Plin', amount: yapeAmount.value })
    }

    await posStore.processPayment(payments)
    alert('Venta procesada con éxito. Ticket emitido.')
  } catch (e: any) {
    alert(e.message || 'Error al procesar pago')
  } finally {
    isProcessing.value = false
  }
}
</script>
