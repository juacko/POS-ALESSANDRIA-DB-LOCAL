<template>
  <Modal
    :is-open="cashierStore.isMovementModalOpen"
    title="Movimiento de Caja"
    max-width="md"
    @close="cashierStore.isMovementModalOpen = false"
  >
    <template #icon>
      <ArrowUpDown class="w-5 h-5 text-indigo-600" />
    </template>

    <div class="space-y-4">
      <div>
        <label class="text-xs font-bold text-slate-700 block mb-1">Tipo de Movimiento</label>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            @click="typeInput = 'Ingreso'"
            class="py-2.5 px-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2"
            :class="typeInput === 'Ingreso'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
          >
            <TrendingUp class="w-4 h-4 text-emerald-600" />
            <span>Ingreso (+)</span>
          </button>

          <button
            type="button"
            @click="typeInput = 'Egreso'"
            class="py-2.5 px-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-2"
            :class="typeInput === 'Egreso'
              ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
          >
            <TrendingDown class="w-4 h-4 text-rose-600" />
            <span>Egreso (-)</span>
          </button>
        </div>
      </div>

      <div>
        <label class="text-xs font-bold text-slate-700 block mb-1">Monto (S/.)</label>
        <input
          v-model.number="amountInput"
          type="number"
          step="1"
          min="0.10"
          placeholder="S/. 0.00"
          class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-extrabold font-heading text-base focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div>
        <label class="text-xs font-bold text-slate-700 block mb-1">Motivo / Descripción</label>
        <input
          v-model="descriptionInput"
          type="text"
          placeholder="Ej. Compra de hielo emergente, sencillo..."
          class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    </div>

    <template #footer>
      <button
        @click="cashierStore.isMovementModalOpen = false"
        class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
      >
        Cancelar
      </button>

      <button
        @click="handleSaveMovement"
        :disabled="amountInput <= 0 || !descriptionInput.trim()"
        class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all"
      >
        Registrar Movimiento
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCashierStore } from '@/stores/cashierStore'
import Modal from '@/components/common/Modal.vue'
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-vue-next'

const cashierStore = useCashierStore()

const typeInput = ref<'Ingreso' | 'Egreso'>('Ingreso')
const amountInput = ref<number>(0)
const descriptionInput = ref<string>('')

async function handleSaveMovement() {
  try {
    await cashierStore.addMovement(typeInput.value, amountInput.value, descriptionInput.value)
    cashierStore.isMovementModalOpen = false
    amountInput.value = 0
    descriptionInput.value = ''
    alert('Movimiento de caja registrado.')
  } catch (e: any) {
    alert(e.message || 'Error al guardar movimiento')
  }
}
</script>
