<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-200"
      @click.self="handleCancel"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 flex flex-col select-none"
      >
        <!-- Cabecera del Modal con Icono -->
        <div class="flex items-start gap-3.5 mb-4">
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
            :class="mode === 'cancel_order' ? 'bg-rose-50 border border-rose-200 text-rose-600' : 'bg-amber-50 border border-amber-200 text-amber-600'"
          >
            <Trash2 v-if="mode === 'cancel_order'" class="w-6 h-6" />
            <RotateCcw v-else class="w-6 h-6" />
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-black text-slate-900 font-heading leading-tight">
              {{ title }}
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ subtitle }}
            </p>
          </div>

          <button
            @click="handleCancel"
            class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Banner Informativo de la Orden -->
        <div
          v-if="order"
          class="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
        >
          <div class="flex items-center gap-2">
            <span class="font-extrabold text-slate-800">
              {{ formatTableDisplay(order.table_number) }}
            </span>
            <span class="text-slate-400 font-mono">#{{ order.order_number }}</span>
          </div>

          <div class="font-black text-slate-900 font-heading">
            Total: S/. {{ order.total_amount.toFixed(2) }}
          </div>
        </div>

        <!-- Opción exclusiva de modo 'delete_payment': ¿Reabrir o Cancelar? -->
        <div v-if="mode === 'delete_payment'" class="mb-4 space-y-2">
          <label class="text-xs font-bold text-slate-700 block">
            ¿Qué deseas hacer con la comanda tras eliminar el pago?
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              @click="destinationStatus = 'Abierta'"
              class="p-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5"
              :class="destinationStatus === 'Abierta'
                ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200 text-indigo-900'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'"
            >
              <div class="flex items-center gap-1.5 font-bold text-xs">
                <RotateCcw class="w-3.5 h-3.5 text-indigo-600" />
                <span>Reabrir Pedido</span>
              </div>
              <span class="text-[11px] text-slate-500 leading-tight">
                Vuelve a estar activo para volver a cobrarlo o modificarlo.
              </span>
            </button>

            <button
              type="button"
              @click="destinationStatus = 'Cancelada'"
              class="p-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5"
              :class="destinationStatus === 'Cancelada'
                ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-200 text-rose-900'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'"
            >
              <div class="flex items-center gap-1.5 font-bold text-xs">
                <Trash2 class="w-3.5 h-3.5 text-rose-600" />
                <span>Anular Todo</span>
              </div>
              <span class="text-[11px] text-slate-500 leading-tight">
                Cancela la comanda y la venta definitivamente.
              </span>
            </button>
          </div>
        </div>

        <!-- Motivos Rápidos (Chips Clickeables) -->
        <div class="mb-3 space-y-1.5">
          <label class="text-xs font-bold text-slate-700 block">
            Selecciona un motivo común o escribe uno:
          </label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="chip in quickChips"
              :key="chip"
              type="button"
              @click="selectChip(chip)"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border"
              :class="reason === chip
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'"
            >
              {{ chip }}
            </button>
          </div>
        </div>

        <!-- Campo de Texto Obligatorio para Motivo -->
        <div class="mb-5 space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-extrabold text-slate-800">
              Razón / Justificación detallada <span class="text-rose-500">*</span>
            </label>
            <span class="text-[11px] text-slate-400 font-medium">Obligatorio</span>
          </div>
          <textarea
            v-model="reason"
            rows="3"
            placeholder="Escribe obligatoriamente el motivo de esta acción..."
            class="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 bg-slate-50/50 resize-none font-medium"
          />
          <p v-if="!isReasonValid && reason.length > 0" class="text-[11px] text-rose-500 font-medium">
            Ingresa al menos 3 caracteres justificando el motivo.
          </p>
        </div>

        <!-- Nota de Seguridad / Auditoría -->
        <div class="mb-5 p-2.5 rounded-xl bg-slate-100/70 border border-slate-200/70 text-[11px] text-slate-500 flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Esta acción se registrará con tu usuario y fecha en el historial de auditoría.
          </span>
        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center gap-2.5">
          <button
            type="button"
            @click="handleCancel"
            class="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-all"
          >
            Cancelar
          </button>

          <button
            type="button"
            @click="handleConfirm"
            :disabled="!isReasonValid || isSubmitting"
            class="flex-1 py-2.5 px-4 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            :class="mode === 'cancel_order'
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
              : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'"
          >
            <span v-if="isSubmitting" class="animate-spin mr-1">⌛</span>
            <span>{{ confirmButtonLabel }}</span>
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
import { Trash2, RotateCcw, X, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  mode: 'cancel_order' | 'delete_payment'
  order: Order | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', data: { reason: string; destinationStatus: 'Abierta' | 'Cancelada' }): void
}>()

const reason = ref('')
const destinationStatus = ref<'Abierta' | 'Cancelada'>('Abierta')
const isSubmitting = ref(false)

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      reason.value = ''
      destinationStatus.value = 'Abierta'
      isSubmitting.value = false
    }
  }
)

const title = computed(() => {
  return props.mode === 'cancel_order' ? 'Anular Pedido Activo' : 'Eliminar Pago de la Orden'
})

const subtitle = computed(() => {
  return props.mode === 'cancel_order'
    ? 'Esta acción cancelará la comanda y liberará la mesa asociada.'
    : 'Se eliminarán los pagos registrados de la caja para ajustar el arqueo.'
})

const confirmButtonLabel = computed(() => {
  if (props.mode === 'cancel_order') return 'Confirmar Anulación'
  return destinationStatus.value === 'Abierta' ? 'Revertir Pago y Reabrir' : 'Eliminar Pago y Cancelar'
})

const quickChips = computed(() => {
  if (props.mode === 'cancel_order') {
    return [
      'Cliente se retiró',
      'Pedido duplicado por error',
      'Cliente cambió de opinión',
      'Falta de stock / insumo',
      'Error de digitación en mesa'
    ]
  }
  return [
    'Cobro indebido / error en caja',
    'Devolución de dinero al cliente',
    'Cobro ejecutado antes de tiempo',
    'Error de digitación en el monto'
  ]
})

function selectChip(chip: string) {
  reason.value = chip
}

const isReasonValid = computed(() => {
  return reason.value.trim().length >= 3
})

function handleCancel() {
  emit('close')
}

function handleConfirm() {
  if (!isReasonValid.value) return
  emit('confirm', {
    reason: reason.value.trim(),
    destinationStatus: destinationStatus.value
  })
}
</script>
