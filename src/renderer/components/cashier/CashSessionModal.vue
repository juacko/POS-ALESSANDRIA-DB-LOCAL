<template>
  <Modal
    :is-open="cashierStore.isCashModalOpen"
    :title="cashierStore.activeSession ? 'Cierre y Arqueo de Caja' : 'Apertura de Caja'"
    max-width="md"
    @close="cashierStore.isCashModalOpen = false"
  >
    <template #icon>
      <Wallet class="w-5 h-5 text-emerald-600" />
    </template>

    <!-- Formulario de Apertura -->
    <div v-if="!cashierStore.activeSession" class="space-y-4">
      <p class="text-xs text-slate-500">
        Para iniciar las ventas del día es obligatorio declarar el fondo inicial en efectivo en caja.
      </p>

      <div>
        <label class="text-xs font-bold text-slate-700 block mb-1">Monto Inicial en Efectivo (S/.)</label>
        <input
          v-model.number="initialCashInput"
          type="number"
          step="5"
          min="0"
          placeholder="S/. 100.00"
          class="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-extrabold font-heading text-lg focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>
    </div>

    <!-- Formulario / Arqueo de Cierre -->
    <div v-else class="space-y-5">
      <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
        <div class="flex justify-between">
          <span class="text-slate-500">Monto Inicial</span>
          <span class="font-bold text-slate-800">S/. {{ (cashierStore.activeSession.initial_cash || 0).toFixed(2) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Efectivo Esperado (Sistema)</span>
          <span class="font-extrabold text-indigo-600 text-sm font-heading">
            S/. {{ (cashierStore.activeSession.expected_cash || 0).toFixed(2) }}
          </span>
        </div>
      </div>

      <div>
        <label class="text-xs font-bold text-slate-700 block mb-1">Efectivo Real Contado en Caja (S/.)</label>
        <input
          v-model.number="actualCashInput"
          type="number"
          step="0.50"
          min="0"
          placeholder="S/. 0.00"
          class="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-extrabold font-heading text-lg focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>

      <div>
        <label class="text-xs font-bold text-slate-700 block mb-1">Notas o Observaciones de Cierre</label>
        <textarea
          v-model="notesInput"
          rows="2"
          placeholder="Opcional..."
          class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
        ></textarea>
      </div>
    </div>

    <template #footer>
      <button
        @click="cashierStore.isCashModalOpen = false"
        class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
      >
        Cancelar
      </button>

      <button
        v-if="!cashierStore.activeSession"
        @click="handleOpenSession"
        class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-200 transition-all"
      >
        Abrir Caja
      </button>

      <button
        v-else
        @click="handleCloseSession"
        class="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-200 transition-all"
      >
        Cerrar y Reorganizar Caja
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCashierStore } from '@/stores/cashierStore'
import { useNotificationStore } from '@/stores/notificationStore'
import Modal from '@/components/common/Modal.vue'
import { Wallet } from 'lucide-vue-next'

const cashierStore = useCashierStore()
const notificationStore = useNotificationStore()

const initialCashInput = ref<number>(100)
const actualCashInput = ref<number>(0)
const notesInput = ref<string>('')

async function handleOpenSession() {
  try {
    await cashierStore.openSession(initialCashInput.value)
    cashierStore.isCashModalOpen = false
    notificationStore.success('Caja abierta', 'Sesión de caja abierta correctamente.')
  } catch (e: any) {
    notificationStore.error('Error al abrir caja', e.message || 'No se pudo abrir la sesión de caja')
  }
}

async function handleCloseSession() {
  try {
    await cashierStore.closeSession(actualCashInput.value, notesInput.value)
    cashierStore.isCashModalOpen = false
    notificationStore.success('Caja cerrada', 'Caja cerrada y arqueada correctamente.')
  } catch (e: any) {
    notificationStore.error('Error al cerrar caja', e.message || 'No se pudo cerrar la caja')
  }
}
</script>
