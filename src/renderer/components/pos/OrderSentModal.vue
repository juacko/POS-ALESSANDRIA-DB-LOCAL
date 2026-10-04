<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-200"
      @click.self="$emit('stay')"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm sm:max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 flex flex-col items-center text-center select-none"
      >
        <!-- Icon Badge -->
        <div class="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-4 shadow-sm relative">
          <UtensilsCrossed class="w-8 h-8 text-indigo-600" />
          <span class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
            <Check class="w-3.5 h-3.5 stroke-[3]" />
          </span>
        </div>

        <!-- Heading -->
        <h3 class="text-xl font-black text-slate-900 font-heading mb-1">
          ¡Comanda Enviada!
        </h3>
        <p class="text-xs sm:text-sm text-slate-500 mb-5">
          El pedido ha sido guardado y despachado correctamente a cocina.
        </p>

        <!-- Summary Card -->
        <div class="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 text-left">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-base shrink-0">
              <Zap v-if="tableNumber === 'RAPIDO'" class="w-5 h-5 fill-amber-500 text-amber-500" />
              <UtensilsCrossed v-else class="w-5 h-5" />
            </div>
            <div>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Ubicación</p>
              <h4 class="text-base font-black text-slate-900 font-heading leading-tight">
                {{ formatTableDisplay(tableNumber) }}
              </h4>
            </div>
          </div>

          <div class="text-right">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">En Comanda</p>
            <span class="inline-flex items-center gap-1 text-sm font-extrabold text-indigo-600 font-heading">
              {{ itemsCount || 0 }} {{ itemsCount === 1 ? 'ítem' : 'ítems' }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col gap-2.5 w-full">
          <button
            @click="$emit('goToTables')"
            class="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 active:scale-95"
          >
            <ArrowLeft class="w-4 h-4" />
            <span>Volver al Salón de Mesas</span>
          </button>

          <button
            @click="$emit('stay')"
            class="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-all"
          >
            Seguir en esta Mesa
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { formatTableDisplay } from '@shared/utils/formatters'
import { UtensilsCrossed, Check, Zap, ArrowLeft } from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
  tableNumber: string
  itemsCount?: number
}>()

defineEmits(['goToTables', 'stay'])
</script>
