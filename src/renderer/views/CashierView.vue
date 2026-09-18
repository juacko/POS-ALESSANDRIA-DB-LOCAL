<template>
  <div class="h-full flex flex-col bg-slate-50 overflow-hidden select-none">
    <!-- Header Caja -->
    <div class="bg-white border-b border-slate-200/80 px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
      <div>
        <h2 class="text-lg sm:text-xl font-bold text-slate-900 font-heading">Control y Arqueo de Caja</h2>
        <p class="text-[11px] sm:text-xs text-slate-400">Declaración de efectivo, movimientos e ingresos por canal</p>
      </div>

      <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
        <button
          v-if="cashierStore.activeSession"
          @click="cashierStore.isMovementModalOpen = true"
          class="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
        >
          <PlusCircle class="w-4 h-4" />
          <span>Ingreso / Egreso</span>
        </button>

        <button
          @click="cashierStore.isCashModalOpen = true"
          class="flex-1 sm:flex-none px-4 sm:px-5 py-2 text-xs font-bold rounded-xl shadow-sm transition-all"
          :class="cashierStore.activeSession
            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'"
        >
          {{ cashierStore.activeSession ? 'Cerrar Caja' : 'Abrir Caja' }}
        </button>
      </div>
    </div>

    <!-- Body Content -->
    <div class="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 pb-20 md:pb-16">
      <div v-if="!cashierStore.activeSession" class="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 text-center max-w-lg mx-auto space-y-4 my-6 sm:my-10">
        <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Wallet class="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.5]" />
        </div>
        <h3 class="text-base sm:text-lg font-bold text-slate-800 font-heading">No Hay Caja Abierta</h3>
        <p class="text-xs text-slate-500">
          Es necesario abrir caja registradora declarando el fondo inicial en efectivo antes de procesar cobros.
        </p>
        <button
          @click="cashierStore.isCashModalOpen = true"
          class="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-200 transition-all font-heading"
        >
          ABRIR SESIÓN DE CAJA
        </button>
      </div>

      <div v-else class="space-y-4 sm:space-y-6">
        <!-- Tarjetas KPI Resumen -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <!-- Fondo Inicial -->
          <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm">
            <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Fondo Inicial</span>
            <p class="text-lg sm:text-2xl font-extrabold text-slate-900 font-heading mt-1">
              S/. {{ (cashierStore.activeSession.initial_cash || 0).toFixed(2) }}
            </p>
          </div>

          <!-- Efectivo en Caja -->
          <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
            <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Ventas en Efectivo</span>
            <p class="text-2xl font-extrabold text-emerald-700 font-heading mt-1">
              S/. {{ (cashierStore.sessionTotals?.cashPayments || 0).toFixed(2) }}
            </p>
          </div>

          <!-- Tarjetas -->
          <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
            <span class="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Ventas Tarjeta</span>
            <p class="text-2xl font-extrabold text-indigo-700 font-heading mt-1">
              S/. {{ (cashierStore.sessionTotals?.cardPayments || 0).toFixed(2) }}
            </p>
          </div>

          <!-- Yape / Plin -->
          <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
            <span class="text-[11px] font-bold uppercase tracking-wider text-purple-600">Ventas Yape / Plin</span>
            <p class="text-2xl font-extrabold text-purple-700 font-heading mt-1">
              S/. {{ (cashierStore.sessionTotals?.yapePayments || 0).toFixed(2) }}
            </p>
          </div>
        </div>

        <!-- Efectivo Esperado Destacado -->
        <div class="bg-indigo-600 text-white rounded-3xl p-6 shadow-xl shadow-indigo-200 flex items-center justify-between">
          <div>
            <span class="text-xs uppercase font-extrabold tracking-wider text-indigo-200">Efectivo Esperado en Caja (Calculado)</span>
            <h3 class="text-4xl font-black font-heading mt-1">
              S/. {{ (cashierStore.sessionTotals?.expected_cash || 0).toFixed(2) }}
            </h3>
            <p class="text-xs text-indigo-100 mt-1">Fondo inicial + Efectivo ventas + Ingresos manuales - Egresos manuales</p>
          </div>

          <div class="text-right">
            <span class="text-xs text-indigo-200 font-semibold block">Total Ventas Global</span>
            <span class="text-2xl font-extrabold font-heading">
              S/. {{ (cashierStore.sessionTotals?.totalSales || 0).toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- Tabla de Movimientos de Caja -->
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h4 class="text-sm font-bold text-slate-800 font-heading">Movimientos de Efectivo Manuales</h4>
            <span class="text-xs text-slate-400">{{ cashierStore.movementsList.length }} movimientos</span>
          </div>

          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-extrabold text-slate-400">
                <th class="py-2.5 px-4">Tipo</th>
                <th class="py-2.5 px-4">Monto</th>
                <th class="py-2.5 px-4">Descripción / Motivo</th>
                <th class="py-2.5 px-4">Hora</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-xs">
              <tr v-if="cashierStore.movementsList.length === 0">
                <td colspan="4" class="py-4 text-center text-slate-400">
                  Sin movimientos manuales de caja registrados en esta sesión.
                </td>
              </tr>
              <tr v-for="m in cashierStore.movementsList" :key="m.id" class="hover:bg-slate-50/80">
                <td class="py-2.5 px-4">
                  <span
                    class="px-2 py-0.5 rounded-md text-[10px] font-bold"
                    :class="m.type === 'Ingreso' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
                  >
                    {{ m.type }}
                  </span>
                </td>
                <td class="py-2.5 px-4 font-bold font-heading" :class="m.type === 'Ingreso' ? 'text-emerald-700' : 'text-rose-700'">
                  {{ m.type === 'Ingreso' ? '+' : '-' }} S/. {{ m.amount.toFixed(2) }}
                </td>
                <td class="py-2.5 px-4 text-slate-700 font-medium">{{ m.description }}</td>
                <td class="py-2.5 px-4 text-slate-400">{{ m.timestamp }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modales de Caja -->
    <CashSessionModal />
    <CashMovementModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCashierStore } from '@/stores/cashierStore'
import CashSessionModal from '@/components/cashier/CashSessionModal.vue'
import CashMovementModal from '@/components/cashier/CashMovementModal.vue'
import { Wallet, PlusCircle } from 'lucide-vue-next'

const cashierStore = useCashierStore()

onMounted(async () => {
  await cashierStore.checkActiveSession()
})
</script>
