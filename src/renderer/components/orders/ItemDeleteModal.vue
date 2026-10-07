<template>
  <Teleport to="body">
    <div
      v-if="isOpen && item"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-200"
      @click.self="handleClose"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 flex flex-col select-none"
      >
        <!-- Header -->
        <div class="flex items-start gap-3.5 mb-4">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 shadow-sm text-rose-600">
            <Trash2 class="w-6 h-6" />
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="text-base font-black text-slate-900 font-heading leading-tight">
              Eliminar Producto del Pedido
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Se eliminará este ítem de la comanda activa registrada.
            </p>
          </div>

          <button
            @click="handleClose"
            class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Info del Ítem a Eliminar -->
        <div class="mb-4 p-3.5 bg-rose-50/60 border border-rose-200/80 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <span class="font-extrabold text-slate-900 block text-sm">{{ item.product_name }}</span>
            <span class="text-slate-500">{{ item.quantity }} unid. &bull; S/. {{ item.unit_price.toFixed(2) }} c/u</span>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-rose-500 font-bold block uppercase">A descontar</span>
            <span class="font-black text-rose-700 text-base">- S/. {{ item.final_price.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Chips Rápidos de Motivo -->
        <div class="mb-3">
          <span class="text-[11px] font-bold text-slate-500 block mb-1.5">Motivo de Eliminación (Obligatorio):</span>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <button
              v-for="chip in quickReasons"
              :key="chip"
              type="button"
              @click="reason = chip"
              class="px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all border text-left"
              :class="reason === chip
                ? 'bg-rose-50 border-rose-400 text-rose-700 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'"
            >
              {{ chip }}
            </button>
          </div>
          <textarea
            v-model="reason"
            rows="2"
            placeholder="Escribe la justificación detallada..."
            class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 outline-none resize-none"
          ></textarea>
        </div>

        <!-- Advertencia si es el único ítem -->
        <div v-if="isLastItem" class="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
          <AlertTriangle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Este es el único producto en la orden. Al eliminarlo, la comanda quedará vacía y la mesa se liberará automáticamente.</span>
        </div>

        <!-- Footer -->
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            @click="handleClose"
            class="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="handleConfirm"
            :disabled="!reason.trim() || isSubmitting"
            class="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-1.5"
          >
            <span v-if="isSubmitting" class="animate-spin">⏳</span>
            <span>{{ isSubmitting ? 'Eliminando...' : 'Confirmar Eliminación' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Trash2, X, AlertTriangle } from 'lucide-vue-next'
import { OrderItem } from '@shared/types/order'

const props = defineProps<{
  isOpen: boolean
  item: OrderItem | null
  isLastItem?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', data: { reason: string }): void
}>()

const reason = ref('')
const isSubmitting = ref(false)

const quickReasons = [
  'Cliente canceló el producto',
  'Error de digitación del mozo',
  'Falta de insumo / Sin stock en cocina',
  'Cambio por otro producto',
  'Demora excesiva en preparación'
]

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    reason.value = ''
    isSubmitting.value = false
  }
})

function handleClose() {
  emit('close')
}

function handleConfirm() {
  if (!reason.value.trim() || isSubmitting.value) return
  isSubmitting.value = true
  emit('confirm', {
    reason: reason.value.trim()
  })
}
</script>
