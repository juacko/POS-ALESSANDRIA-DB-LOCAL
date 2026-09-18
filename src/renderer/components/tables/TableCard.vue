<template>
  <div
    @click="$emit('select', table)"
    class="relative group cursor-pointer bg-white rounded-2xl p-3.5 sm:p-5 border transition-all duration-150 shadow-sm hover:shadow-md active:scale-95 flex flex-col justify-between overflow-hidden select-none"
    :class="table.status === 'Ocupada'
      ? 'border-amber-300 hover:border-amber-400 bg-amber-50/25'
      : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20'"
  >
    <!-- Accent Line -->
    <div
      class="absolute top-0 left-0 right-0 h-1 sm:h-1.5 transition-all"
      :class="table.status === 'Ocupada' ? 'bg-amber-500' : 'bg-emerald-500'"
    ></div>

    <!-- Header Card: Nombre de Mesa y Status -->
    <div class="flex items-start justify-between gap-1">
      <div class="min-w-0 flex-1">
        <h3 class="text-sm sm:text-lg font-bold text-slate-900 font-heading group-hover:text-indigo-600 transition-colors truncate">
          {{ table.name }}
        </h3>
        <span class="text-[10px] sm:text-xs font-medium text-slate-400 truncate block">{{ table.zone }}</span>
      </div>

      <!-- Badge status -->
      <span
        class="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold shrink-0"
        :class="table.status === 'Ocupada'
          ? 'bg-amber-100 text-amber-800 border border-amber-200'
          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'"
      >
        <span
          class="w-1.5 h-1.5 rounded-full"
          :class="table.status === 'Ocupada' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'"
        ></span>
        <span>{{ table.status }}</span>
      </span>
    </div>

    <!-- Body Card: Monto Acumulado y Cantidad de Productos -->
    <div class="mt-2.5 sm:mt-4 pt-2 sm:pt-4 border-t border-slate-100 flex items-end justify-between gap-1">
      <div>
        <p class="text-[9px] sm:text-[11px] uppercase tracking-wider font-semibold text-slate-400">Total</p>
        <p class="text-base sm:text-xl font-extrabold text-slate-900 font-heading">
          S/. {{ (table.total_amount || 0).toFixed(2) }}
        </p>
      </div>

      <div class="text-right shrink-0">
        <span
          class="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg"
          :class="table.status === 'Ocupada' ? 'bg-amber-100/60 text-amber-900' : 'bg-slate-100 text-slate-500'"
        >
          <ShoppingBag class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          {{ table.items_count || 0 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Table } from '@shared/types/table'
import { ShoppingBag } from 'lucide-vue-next'

defineProps<{
  table: Table
}>()

defineEmits(['select'])
</script>
