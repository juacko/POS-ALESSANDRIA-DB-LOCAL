<template>
  <div
    @click="$emit('select', product)"
    class="group cursor-pointer bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all duration-150 flex flex-col justify-between active:scale-95 select-none"
  >
    <div class="flex items-start justify-between gap-1.5">
      <div class="min-w-0 flex-1">
        <span class="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md inline-block truncate max-w-full">
          {{ product.category_name || 'General' }}
        </span>
        <h4 class="text-xs sm:text-sm font-bold text-slate-900 font-heading mt-1 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
          {{ product.name }}
        </h4>
      </div>

      <!-- Badge si requiere modificadores -->
      <span
        v-if="product.modifier_groups && product.modifier_groups.length > 0"
        class="text-[9px] sm:text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1 sm:px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0"
        title="Opciones de Modificadores"
      >
        <SlidersHorizontal class="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        <span class="hidden xs:inline">Opciones</span>
      </span>
    </div>

    <div class="mt-2 sm:mt-3 pt-1.5 sm:pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
      <span class="text-xs sm:text-base font-extrabold text-slate-900 font-heading truncate">
        S/. {{ product.base_price.toFixed(2) }}
      </span>

      <button class="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 group-hover:bg-indigo-600 text-slate-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
        <Plus class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Product } from '@shared/types/product'
import { SlidersHorizontal, Plus } from 'lucide-vue-next'

defineProps<{
  product: Product
}>()

defineEmits(['select'])
</script>
