<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 transition-all duration-200"
      @click.self="closeOnBackdrop ? $emit('close') : null"
    >
      <div
        class="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 w-full max-h-[92dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        :class="maxWidthClass"
      >
        <!-- Modal Header -->
        <div v-if="title" class="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <h3 class="text-base sm:text-xl font-bold text-slate-800 font-heading flex items-center gap-2 truncate">
            <slot name="icon"></slot>
            <span class="truncate">{{ title }}</span>
          </h3>
          <button
            @click="$emit('close')"
            class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors shrink-0"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-3.5 sm:p-6 overflow-y-auto flex-1">
          <slot></slot>
        </div>

        <!-- Modal Footer -->
        <div v-if="$slots.footer" class="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2 sm:gap-3 shrink-0 pb-safe">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    title?: string
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    closeOnBackdrop?: boolean
  }>(),
  {
    maxWidth: 'md',
    closeOnBackdrop: true
  }
)

defineEmits(['close'])

const maxWidthClass = computed(() => {
  switch (props.maxWidth) {
    case 'sm': return 'max-w-sm'
    case 'md': return 'max-w-md'
    case 'lg': return 'max-w-lg'
    case 'xl': return 'max-w-xl'
    case '2xl': return 'max-w-2xl'
    default: return 'max-w-md'
  }
})
</script>
