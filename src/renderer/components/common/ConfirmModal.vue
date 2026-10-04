<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-200"
      @click.self="$emit('cancel')"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 flex flex-col items-center text-center select-none"
      >
        <!-- Icon Badge -->
        <div
          class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
          :class="badgeClasses"
        >
          <Trash2 v-if="type === 'danger'" class="w-7 h-7 text-rose-600" />
          <AlertTriangle v-else-if="type === 'warning'" class="w-7 h-7 text-amber-600" />
          <HelpCircle v-else class="w-7 h-7 text-indigo-600" />
        </div>

        <!-- Title & Message -->
        <h3 class="text-lg font-black text-slate-900 font-heading mb-1.5 leading-snug">
          {{ title }}
        </h3>
        <p class="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed max-w-sm">
          {{ message }}
        </p>

        <!-- Actions -->
        <div class="flex items-center gap-3 w-full">
          <button
            @click="$emit('cancel')"
            class="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-all"
          >
            {{ cancelText }}
          </button>

          <button
            @click="$emit('confirm')"
            class="flex-1 py-3 px-4 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95"
            :class="confirmButtonClasses"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Trash2, AlertTriangle, HelpCircle } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    title: string
    message: string
    type?: 'danger' | 'warning' | 'info'
    confirmText?: string
    cancelText?: string
  }>(),
  {
    type: 'danger',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar'
  }
)

defineEmits(['confirm', 'cancel'])

const badgeClasses = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-rose-50 border border-rose-200'
    case 'warning':
      return 'bg-amber-50 border border-amber-200'
    case 'info':
    default:
      return 'bg-indigo-50 border border-indigo-200'
  }
})

const confirmButtonClasses = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-rose-200'
    case 'warning':
      return 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-amber-200'
    case 'info':
    default:
      return 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-200'
  }
})
</script>
