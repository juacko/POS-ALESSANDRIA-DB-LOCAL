<template>
  <Modal
    :is-open="cashierStore.isCashModalOpen"
    :title="cashierStore.activeSession ? 'Cierre y Arqueo General de Caja' : 'Apertura de Caja Registradora'"
    :max-width="cashierStore.activeSession ? 'xl' : 'md'"
    @close="cashierStore.isCashModalOpen = false"
  >
    <template #icon>
      <div
        class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
        :class="cashierStore.activeSession ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'"
      >
        <Lock v-if="cashierStore.activeSession" class="w-5 h-5" />
        <Wallet v-else class="w-5 h-5" />
      </div>
    </template>

    <!-- ==================== MODO 1: APERTURA DE CAJA ==================== -->
    <div v-if="!cashierStore.activeSession" class="space-y-4">
      <div class="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-start gap-3">
        <Sparkles class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div class="text-xs text-emerald-900 leading-relaxed">
          <p class="font-bold">Iniciar turno de ventas</p>
          <p class="text-emerald-700 mt-0.5">
            Declara el fondo inicial en efectivo asignado a la gaveta de caja para dar vuelto.
          </p>
        </div>
      </div>

      <div>
        <label class="text-xs font-bold text-slate-700 block mb-1.5">Fondo Inicial en Efectivo (S/.)</label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">S/.</span>
          <input
            v-model.number="initialCashInput"
            type="number"
            step="5"
            min="0"
            placeholder="100.00"
            class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 font-black font-heading text-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      <!-- Atajos de Fondo Inicial -->
      <div>
        <span class="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Montos Rápidos:</span>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="amount in [50, 100, 150, 200]"
            :key="amount"
            type="button"
            @click="initialCashInput = amount"
            class="py-2 rounded-xl text-xs font-bold transition-all border"
            :class="initialCashInput === amount
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'"
          >
            S/. {{ amount }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== MODO 2: CIERRE Y ARQUEO DE CAJA ==================== -->
    <div v-else class="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      <!-- Banner de Alerta si existen órdenes abiertas sin cobrar -->
      <div
        v-if="(totals.openOrdersCount || 0) > 0"
        class="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 shadow-xs"
      >
        <AlertTriangle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="font-extrabold">
            ¡Atención! Hay {{ totals.openOrdersCount }} {{ totals.openOrdersCount === 1 ? 'pedido activo' : 'pedidos activos' }} sin cobrar (S/. {{ (totals.openOrdersTotal || 0).toFixed(2) }}).
          </p>
          <p class="text-amber-800 text-[11px] mt-0.5">
            Se recomienda cobrar o anular las comandas abiertas en mesas antes de realizar el cierre definitivo de caja.
          </p>
        </div>
      </div>

      <!-- Cabecera Informativa de Sesión -->
      <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
            👤
          </div>
          <div>
            <span class="text-slate-400 text-[10px] uppercase font-bold block">Responsable de Caja</span>
            <span class="font-extrabold text-slate-800">{{ cashierStore.activeSession.user_name || 'Cajero' }}</span>
          </div>
        </div>

        <div class="flex items-center gap-4 text-right">
          <div>
            <span class="text-slate-400 text-[10px] uppercase font-bold block">Apertura</span>
            <span class="font-bold text-slate-700">{{ formatTime(cashierStore.activeSession.opening_time) }}</span>
          </div>
          <div>
            <span class="text-slate-400 text-[10px] uppercase font-bold block">Tiempo Activo</span>
            <span class="font-bold text-indigo-600">{{ elapsedTime }}</span>
          </div>
        </div>
      </div>

      <!-- Resumen de Tarjetas KPI -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div class="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Ventas</span>
          <p class="text-base sm:text-lg font-black text-slate-900 font-heading mt-0.5">
            S/. {{ (totals.totalSales || 0).toFixed(2) }}
          </p>
          <span class="text-[10px] text-slate-500 font-medium">{{ totals.orderCount || 0 }} comandas</span>
        </div>

        <div class="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ticket Promedio</span>
          <p class="text-base sm:text-lg font-black text-indigo-600 font-heading mt-0.5">
            S/. {{ (totals.averageTicket || 0).toFixed(2) }}
          </p>
          <span class="text-[10px] text-slate-500 font-medium">Por comanda</span>
        </div>

        <div class="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Salón / Mesas</span>
          <p class="text-base sm:text-lg font-black text-slate-800 font-heading mt-0.5">
            S/. {{ (totals.dineInSales || 0).toFixed(2) }}
          </p>
          <span class="text-[10px] text-slate-500 font-medium">{{ totals.dineInOrders || 0 }} ventas</span>
        </div>

        <div class="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Para Llevar / Rápido</span>
          <p class="text-base sm:text-lg font-black text-amber-700 font-heading mt-0.5">
            S/. {{ (totals.takeoutSales || 0).toFixed(2) }}
          </p>
          <span class="text-[10px] text-slate-500 font-medium">{{ totals.takeoutOrders || 0 }} ventas</span>
        </div>
      </div>

      <!-- Desglose de Ventas por Método de Pago -->
      <div class="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2.5">
        <div class="flex items-center justify-between text-xs">
          <h4 class="font-extrabold text-slate-800 flex items-center gap-1.5">
            <CreditCard class="w-4 h-4 text-indigo-600" />
            <span>Ingresos por Canal de Pago</span>
          </h4>
          <span class="text-[11px] font-semibold text-slate-400">Total cobrado: S/. {{ (totals.totalSales || 0).toFixed(2) }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <!-- Efectivo -->
          <div class="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
            <div>
              <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <span>💵 Efectivo</span>
              </div>
              <span class="text-[10px] text-emerald-700">{{ totals.cashPaymentsCount || 0 }} transacciones</span>
            </div>
            <div class="text-right">
              <span class="text-sm font-black text-emerald-800 font-heading block">
                S/. {{ (totals.cashPayments || 0).toFixed(2) }}
              </span>
              <span class="text-[10px] font-bold text-emerald-600">
                {{ getPercentage(totals.cashPayments, totals.totalSales) }}%
              </span>
            </div>
          </div>

          <!-- Tarjeta -->
          <div class="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between">
            <div>
              <div class="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                <span>💳 Tarjeta POS</span>
              </div>
              <span class="text-[10px] text-sky-700">{{ totals.cardPaymentsCount || 0 }} transacciones</span>
            </div>
            <div class="text-right">
              <span class="text-sm font-black text-sky-800 font-heading block">
                S/. {{ (totals.cardPayments || 0).toFixed(2) }}
              </span>
              <span class="text-[10px] font-bold text-sky-600">
                {{ getPercentage(totals.cardPayments, totals.totalSales) }}%
              </span>
            </div>
          </div>

          <!-- Yape / Plin -->
          <div class="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between">
            <div>
              <div class="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                <span>📱 Yape / Plin</span>
              </div>
              <span class="text-[10px] text-purple-700">{{ totals.yapePaymentsCount || 0 }} transacciones</span>
            </div>
            <div class="text-right">
              <span class="text-sm font-black text-purple-800 font-heading block">
                S/. {{ (totals.yapePayments || 0).toFixed(2) }}
              </span>
              <span class="text-[10px] font-bold text-purple-600">
                {{ getPercentage(totals.yapePayments, totals.totalSales) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Fórmula y Balance Físico de Efectivo en Gaveta -->
      <div class="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-[11px] uppercase font-bold tracking-wider text-indigo-200 flex items-center gap-1.5">
            <Calculator class="w-4 h-4 text-indigo-300" />
            <span>Balance Matemático de Gaveta</span>
          </span>
          <span class="text-xs bg-indigo-800/80 px-2 py-0.5 rounded-md text-indigo-200 font-semibold">
            Solo Efectivo Físico
          </span>
        </div>

        <!-- Ecuación de Efectivo en Chips -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div class="bg-white/10 rounded-xl p-2 border border-white/10">
            <span class="text-[10px] text-slate-300 block">Fondo Inicial</span>
            <span class="font-extrabold text-white text-sm">S/. {{ (totals.initialCash || 0).toFixed(2) }}</span>
          </div>

          <div class="bg-white/10 rounded-xl p-2 border border-white/10">
            <span class="text-[10px] text-emerald-300 block">(+) Ventas Ef.</span>
            <span class="font-extrabold text-emerald-400 text-sm">+ S/. {{ (totals.cashPayments || 0).toFixed(2) }}</span>
          </div>

          <div class="bg-white/10 rounded-xl p-2 border border-white/10">
            <span class="text-[10px] text-sky-300 block">(+) Ingresos Man.</span>
            <span class="font-extrabold text-sky-400 text-sm">+ S/. {{ (totals.manualIncomes || 0).toFixed(2) }}</span>
          </div>

          <div class="bg-white/10 rounded-xl p-2 border border-white/10">
            <span class="text-[10px] text-rose-300 block">(-) Egresos Man.</span>
            <span class="font-extrabold text-rose-400 text-sm">- S/. {{ (totals.manualExpenses || 0).toFixed(2) }}</span>
          </div>
        </div>

        <div class="pt-2 border-t border-white/15 flex items-center justify-between">
          <div>
            <span class="text-xs text-indigo-200 block font-medium">Efectivo Esperado en Gaveta (Sistema):</span>
            <span class="text-2xl font-black font-heading text-white">
              S/. {{ (totals.expected_cash || 0).toFixed(2) }}
            </span>
          </div>

          <button
            type="button"
            @click="actualCashInput = Number((totals.expected_cash || 0).toFixed(2))"
            class="text-[11px] font-bold bg-white/15 hover:bg-white/25 active:scale-95 text-white px-3 py-1.5 rounded-xl transition-all border border-white/20"
            title="Copiar monto esperado si la caja está exacta"
          >
            Copiar Esperado ✓
          </button>
        </div>
      </div>

      <!-- ARQUEO REAL Y DESCUADRE -->
      <div class="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-800 block">
            Efectivo Real Contado en Gaveta (S/.)
          </label>

          <!-- Toggle Contador de Billetes y Monedas -->
          <button
            type="button"
            @click="isBillCounterOpen = !isBillCounterOpen"
            class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <Coins class="w-3.5 h-3.5" />
            <span>{{ isBillCounterOpen ? 'Ocultar Contador' : 'Contador de Billetes/Monedas' }}</span>
          </button>
        </div>

        <!-- Desglose de Billetes y Monedas (Opcional) -->
        <div v-if="isBillCounterOpen" class="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
          <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Conteo por Denominación:
          </span>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div
              v-for="den in denominations"
              :key="den.val"
              class="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-slate-200"
            >
              <span class="font-bold text-slate-700 text-xs">S/. {{ den.label }}</span>
              <div class="flex items-center gap-1">
                <span class="text-slate-400 text-[10px]">x</span>
                <input
                  v-model.number="den.qty"
                  type="number"
                  min="0"
                  class="w-12 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold py-0.5 outline-none focus:ring-1 focus:ring-indigo-500"
                  @input="recalculateFromDenominations"
                />
              </div>
            </div>
          </div>
          <div class="text-right pt-1 text-[11px] font-bold text-indigo-700">
            Suma del conteo: S/. {{ billCounterTotal.toFixed(2) }}
          </div>
        </div>

        <!-- Input de Conteo Real Directo -->
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">S/.</span>
          <input
            v-model.number="actualCashInput"
            type="number"
            step="0.50"
            min="0"
            placeholder="0.00"
            class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 font-black font-heading text-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <!-- CHIP INTELIGENTE DE DESCUADRE / CUADRATURA -->
        <div
          class="p-3 rounded-2xl border flex items-center justify-between text-xs transition-all"
          :class="cashDiffClass"
        >
          <div class="flex items-center gap-2">
            <CheckCircle2 v-if="cashDiff === 0" class="w-5 h-5 text-emerald-600 shrink-0" />
            <TrendingDown v-else-if="cashDiff < 0" class="w-5 h-5 text-rose-600 shrink-0" />
            <TrendingUp v-else class="w-5 h-5 text-amber-600 shrink-0" />

            <div>
              <span class="font-extrabold block">
                {{ cashDiffTitle }}
              </span>
              <span class="text-[11px] opacity-80">
                {{ cashDiffSubtitle }}
              </span>
            </div>
          </div>

          <div class="text-right">
            <span class="text-base font-black font-heading block">
              {{ cashDiff >= 0 ? '+' : '' }} S/. {{ cashDiff.toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- Observaciones -->
        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">Notas u Observaciones del Cierre</label>
          <textarea
            v-model="notesInput"
            rows="2"
            placeholder="Justificación de sobrante/faltante, incidencias del turno (opcional)..."
            class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- ==================== FOOTER ==================== -->
    <template #footer>
      <button
        @click="cashierStore.isCashModalOpen = false"
        class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
      >
        Cancelar
      </button>

      <button
        v-if="!cashierStore.activeSession"
        @click="handleOpenSession"
        :disabled="initialCashInput < 0 || isSubmitting"
        class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-200 transition-all flex items-center gap-1.5"
      >
        <span v-if="isSubmitting" class="animate-spin">⏳</span>
        <span>Abrir Caja Registradora</span>
      </button>

      <button
        v-else
        @click="handleCloseSession"
        :disabled="actualCashInput < 0 || isSubmitting"
        class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-rose-200 transition-all flex items-center gap-1.5"
      >
        <span v-if="isSubmitting" class="animate-spin">⏳</span>
        <span>Cerrar y Archivar Turno</span>
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useCashierStore } from '@/stores/cashierStore'
import { useNotificationStore } from '@/stores/notificationStore'
import Modal from '@/components/common/Modal.vue'
import {
  Wallet,
  Lock,
  Sparkles,
  AlertTriangle,
  CreditCard,
  Calculator,
  Coins,
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from 'lucide-vue-next'

const cashierStore = useCashierStore()
const notificationStore = useNotificationStore()

const initialCashInput = ref<number>(100)
const actualCashInput = ref<number>(0)
const notesInput = ref<string>('')
const isSubmitting = ref(false)
const isBillCounterOpen = ref(false)

// Denominaciones peruanas para el desglose de efectivo
const denominations = reactive([
  { val: 200, label: '200.00', qty: 0 },
  { val: 100, label: '100.00', qty: 0 },
  { val: 50, label: '50.00', qty: 0 },
  { val: 20, label: '20.00', qty: 0 },
  { val: 10, label: '10.00', qty: 0 },
  { val: 5, label: '5.00', qty: 0 },
  { val: 2, label: '2.00', qty: 0 },
  { val: 1, label: '1.00', qty: 0 },
  { val: 0.5, label: '0.50', qty: 0 }
])

const billCounterTotal = computed(() => {
  return denominations.reduce((acc, d) => acc + (d.val * (d.qty || 0)), 0)
})

function recalculateFromDenominations() {
  actualCashInput.value = Number(billCounterTotal.value.toFixed(2))
}

// Totales de la sesión
const totals = computed(() => {
  return cashierStore.sessionTotals || {
    initialCash: cashierStore.activeSession?.initial_cash || 0,
    cashPayments: 0,
    cardPayments: 0,
    yapePayments: 0,
    cashPaymentsCount: 0,
    cardPaymentsCount: 0,
    yapePaymentsCount: 0,
    manualIncomes: 0,
    manualExpenses: 0,
    expected_cash: cashierStore.activeSession?.initial_cash || 0,
    totalSales: 0,
    orderCount: 0,
    averageTicket: 0,
    dineInSales: 0,
    takeoutSales: 0,
    dineInOrders: 0,
    takeoutOrders: 0,
    openOrdersCount: 0,
    openOrdersTotal: 0
  }
})

// Descuadre en tiempo real
const cashDiff = computed(() => {
  const expected = totals.value.expected_cash || 0
  const actual = actualCashInput.value || 0
  return Number((actual - expected).toFixed(2))
})

const cashDiffClass = computed(() => {
  if (cashDiff.value === 0) {
    return 'bg-emerald-50 border-emerald-300 text-emerald-900 ring-1 ring-emerald-400/30'
  }
  if (cashDiff.value < 0) {
    return 'bg-rose-50 border-rose-300 text-rose-900 ring-1 ring-rose-400/30'
  }
  return 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-400/30'
})

const cashDiffTitle = computed(() => {
  if (cashDiff.value === 0) return 'Caja Cuadrada Exacta'
  if (cashDiff.value < 0) return 'Faltante en Caja Registradora'
  return 'Sobrante en Caja Registradora'
})

const cashDiffSubtitle = computed(() => {
  if (cashDiff.value === 0) return 'El dinero físico coincide perfectamente con el cálculo del sistema.'
  if (cashDiff.value < 0) return 'Hay menos dinero físico en gaveta del esperado.'
  return 'Hay más dinero físico en gaveta del registrado por el sistema.'
})

// Tiempo transcurrido de la sesión
const elapsedTime = computed(() => {
  if (!cashierStore.activeSession?.opening_time) return ''
  const start = new Date(cashierStore.activeSession.opening_time).getTime()
  const diffMinutes = Math.floor((Date.now() - start) / 60000)
  if (diffMinutes < 1) return 'Recién abierta'
  const hours = Math.floor(diffMinutes / 60)
  const mins = diffMinutes % 60
  return `${hours}h ${mins}m`
})

function formatTime(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getPercentage(amount: number, total: number) {
  if (!total || total === 0) return 0
  return Math.round((amount / total) * 100)
}

// Al abrir el modal, refrescar totales y resetear inputs
watch(() => cashierStore.isCashModalOpen, async (isOpen) => {
  if (isOpen) {
    isSubmitting.value = false
    notesInput.value = ''
    isBillCounterOpen.value = false
    denominations.forEach(d => (d.qty = 0))

    if (cashierStore.activeSession) {
      await cashierStore.refreshCurrentSessionTotals()
      actualCashInput.value = Number((totals.value.expected_cash || 0).toFixed(2))
    } else {
      initialCashInput.value = 100
      actualCashInput.value = 0
    }
  }
})

async function handleOpenSession() {
  if (initialCashInput.value < 0) return
  isSubmitting.value = true
  try {
    await cashierStore.openSession(initialCashInput.value)
    cashierStore.isCashModalOpen = false
    notificationStore.success('Caja abierta', 'Sesión de caja abierta correctamente.')
  } catch (e: any) {
    notificationStore.error('Error al abrir caja', e.message || 'No se pudo abrir la sesión de caja')
  } finally {
    isSubmitting.value = false
  }
}

async function handleCloseSession() {
  if (actualCashInput.value < 0) return

  // Advertencia si hay órdenes abiertas
  if ((totals.value.openOrdersCount || 0) > 0) {
    const confirmOpen = window.confirm(
      `¡Atención! Hay ${totals.value.openOrdersCount} pedidos abiertos sin cobrar.\n¿Deseas cerrar caja de todas formas?`
    )
    if (!confirmOpen) return
  }

  isSubmitting.value = true
  try {
    await cashierStore.closeSession(actualCashInput.value, notesInput.value)
    cashierStore.isCashModalOpen = false
    notificationStore.success('Caja cerrada', 'Caja cerrada y arqueada correctamente.')
  } catch (e: any) {
    notificationStore.error('Error al cerrar caja', e.message || 'No se pudo cerrar la caja')
  } finally {
    isSubmitting.value = false
  }
}
</script>
