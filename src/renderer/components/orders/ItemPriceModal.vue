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
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0 shadow-sm text-indigo-600">
            <Tag class="w-6 h-6" />
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="text-base font-black text-slate-900 font-heading leading-tight">
              Modificar Precio
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Ajusta el precio unitario del producto en la orden activa.
            </p>
          </div>

          <button
            @click="handleClose"
            class="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Info del Ítem -->
        <div class="mb-4 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <span class="font-extrabold text-slate-800 block text-sm">{{ item.product_name }}</span>
            <span class="text-slate-500">{{ item.quantity }} unid. &bull; Precio base: S/. {{ (originalPrice || item.unit_price).toFixed(2) }}</span>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-slate-400 font-bold block uppercase">Actual</span>
            <span class="font-black text-indigo-600 text-sm">S/. {{ item.unit_price.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Input de Nuevo Precio -->
        <div class="mb-3">
          <label class="text-xs font-bold text-slate-700 block mb-1.5">Nuevo Precio Unitario (S/.)</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">S/.</span>
            <input
              v-model.number="newUnitPrice"
              type="number"
              step="0.10"
              min="0"
              placeholder="0.00"
              class="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-extrabold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <!-- Chips Rápidos de Precio / Descuento -->
        <div class="mb-4">
          <span class="text-[11px] font-bold text-slate-500 block mb-1.5">Atajos de Precio / Descuento:</span>
          <div class="flex flex-wrap gap-1.5">
            <button
              type="button"
              @click="applyFreeCourtesy"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border"
              :class="newUnitPrice === 0 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border-slate-200'"
            >
              🎁 Cortesía (S/. 0.00)
            </button>
            <button
              type="button"
              @click="applyDiscountPercent(10)"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border-slate-200"
            >
              -10%
            </button>
            <button
              type="button"
              @click="applyDiscountPercent(20)"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border-slate-200"
            >
              -20%
            </button>
            <button
              type="button"
              @click="applyDiscountPercent(50)"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border-slate-200"
            >
              -50%
            </button>
            <button
              type="button"
              @click="resetOriginalPrice"
              class="px-2.5 py-1 rounded-xl text-xs font-bold transition-all border bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
            >
              Restablecer
            </button>
          </div>
        </div>

        <!-- Chips Rápidos de Motivo -->
        <div class="mb-3">
          <span class="text-[11px] font-bold text-slate-500 block mb-1.5">Motivo del Ajuste (Obligatorio):</span>
          <div class="flex flex-wrap gap-1.5 mb-2">
            <button
              v-for="chip in quickReasons"
              :key="chip"
              type="button"
              @click="reason = chip"
              class="px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all border text-left"
              :class="reason === chip
                ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'"
            >
              {{ chip }}
            </button>
          </div>
          <textarea
            v-model="reason"
            rows="2"
            placeholder="Escribe la justificación detallada..."
            class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          ></textarea>
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
            :disabled="newUnitPrice < 0 || !reason.trim() || isSubmitting"
            class="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1.5"
          >
            <span v-if="isSubmitting" class="animate-spin">⏳</span>
            <span>{{ isSubmitting ? 'Guardando...' : 'Aplicar Precio' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Tag, X } from 'lucide-vue-next'
import { OrderItem } from '@shared/types/order'

const props = defineProps<{
  isOpen: boolean
  item: OrderItem | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', data: { newUnitPrice: number; reason: string }): void
}>()

const newUnitPrice = ref<number>(0)
const originalPrice = ref<number>(0)
const reason = ref('')
const isSubmitting = ref(false)

const quickReasons = [
  'Cortesía de la casa',
  'Descuento autorizado por gerencia',
  'Compensación por demora',
  'Convenio especial / Colaborador',
  'Ajuste por promoción o evento'
]

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.item) {
    originalPrice.value = props.item.unit_price
    newUnitPrice.value = props.item.unit_price
    reason.value = ''
    isSubmitting.value = false
  }
})

function applyFreeCourtesy() {
  newUnitPrice.value = 0
  reason.value = 'Cortesía de la casa'
}

function applyDiscountPercent(percent: number) {
  const base = originalPrice.value || 0
  const discounted = base * (1 - percent / 100)
  newUnitPrice.value = Math.max(0, parseFloat(discounted.toFixed(2)))
  reason.value = `Descuento ${percent}% autorizado`
}

function resetOriginalPrice() {
  newUnitPrice.value = originalPrice.value
}

function handleClose() {
  emit('close')
}

function handleConfirm() {
  if (newUnitPrice.value < 0 || !reason.value.trim() || isSubmitting.value) return
  isSubmitting.value = true
  emit('confirm', {
    newUnitPrice: newUnitPrice.value,
    reason: reason.value.trim()
  })
}
</script>
