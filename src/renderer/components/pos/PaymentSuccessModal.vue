<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-200"
      @click.self="$emit('close')"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm sm:max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 flex flex-col items-center text-center select-none"
      >
        <!-- Icon Badge -->
        <div class="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4 shadow-sm relative">
          <CheckCircle2 class="w-9 h-9 text-emerald-600" />
        </div>

        <!-- Heading -->
        <h3 class="text-xl font-black text-slate-900 font-heading mb-1">
          ¡Cobro Realizado con Éxito!
        </h3>
        <p class="text-xs sm:text-sm text-slate-500 mb-5">
          La orden ha sido pagada y archivada en caja correctamente.
        </p>

        <!-- Summary Receipt Card -->
        <div class="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-5 text-left space-y-3">
          <!-- Ubicación y # Orden -->
          <div class="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
            <span class="inline-flex items-center gap-1.5 font-black text-slate-800 text-sm font-heading">
              <Zap v-if="tableNumber === 'RAPIDO'" class="w-4 h-4 text-amber-500 fill-amber-500" />
              <UtensilsCrossed v-else class="w-4 h-4 text-indigo-600" />
              {{ formatTableDisplay(tableNumber) }}
            </span>
            <span v-if="orderNumber" class="text-xs font-bold text-slate-400 font-mono">
              #{{ orderNumber }}
            </span>
          </div>

          <!-- Total Cobrado -->
          <div class="flex items-baseline justify-between">
            <span class="text-xs uppercase font-extrabold text-slate-400">Total Cobrado</span>
            <span class="text-xl font-black text-slate-900 font-heading">
              S/. {{ (totalAmount || 0).toFixed(2) }}
            </span>
          </div>

          <!-- Desglose de Pago -->
          <div v-if="payments && payments.length > 0" class="pt-1 border-t border-slate-200/50 flex flex-wrap gap-1.5">
            <span
              v-for="(pay, idx) in payments"
              :key="idx"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-white border border-slate-200 text-slate-700"
            >
              <span>{{ pay.method }}:</span>
              <span class="text-indigo-600">S/. {{ pay.amount.toFixed(2) }}</span>
            </span>
          </div>

          <!-- Vuelto / Cambio (si aplica) -->
          <div
            v-if="changeAmount && changeAmount > 0"
            class="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between"
          >
            <span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">Vuelto a entregar:</span>
            <span class="text-base font-black text-emerald-700 font-heading">
              S/. {{ changeAmount.toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col gap-2.5 w-full">
          <button
            @click="$emit('newSale')"
            class="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95"
          >
            <ArrowLeft class="w-4 h-4" />
            <span>Volver al Salón de Mesas</span>
          </button>

          <button
            @click="$emit('close')"
            class="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-all"
          >
            Aceptar y Cerrar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { formatTableDisplay } from '@shared/utils/formatters'
import { CheckCircle2, UtensilsCrossed, Zap, ArrowLeft } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
  orderNumber?: number | string
  tableNumber: string
  totalAmount: number
  payments?: { method: string; amount: number }[]
  changeAmount?: number
}>()

defineEmits(['newSale', 'close'])
</script>
