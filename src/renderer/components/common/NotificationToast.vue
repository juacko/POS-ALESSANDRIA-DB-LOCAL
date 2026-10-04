<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
    <TransitionGroup
      enter-active-class="transform transition ease-out duration-300"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-4"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="toast in notificationStore.toasts"
        :key="toast.id"
        class="pointer-events-auto w-full bg-white rounded-2xl shadow-xl border p-3.5 flex items-start gap-3 backdrop-blur-md transition-all duration-200"
        :class="getToastBorderClasses(toast.type)"
      >
        <!-- Icon Container -->
        <div
          class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          :class="getToastIconClasses(toast.type)"
        >
          <CheckCircle2 v-if="toast.type === 'success'" class="w-4 h-4 text-emerald-600" />
          <XCircle v-else-if="toast.type === 'error'" class="w-4 h-4 text-rose-600" />
          <AlertTriangle v-else-if="toast.type === 'warning'" class="w-4 h-4 text-amber-600" />
          <Info v-else class="w-4 h-4 text-indigo-600" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 pr-1">
          <h4 class="text-xs sm:text-sm font-bold text-slate-800 leading-tight font-heading">
            {{ toast.title }}
          </h4>
          <p v-if="toast.message" class="text-xs text-slate-500 mt-0.5 leading-snug break-words">
            {{ toast.message }}
          </p>
        </div>

        <!-- Close Button -->
        <button
          @click="notificationStore.removeToast(toast.id)"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 -mr-1 -mt-1"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useNotificationStore, ToastType } from '@/stores/notificationStore'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

const notificationStore = useNotificationStore()

function getToastBorderClasses(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'border-emerald-200 bg-white shadow-emerald-900/5'
    case 'error':
      return 'border-rose-200 bg-white shadow-rose-900/5'
    case 'warning':
      return 'border-amber-200 bg-white shadow-amber-900/5'
    case 'info':
    default:
      return 'border-indigo-200 bg-white shadow-indigo-900/5'
  }
}

function getToastIconClasses(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'bg-emerald-50'
    case 'error':
      return 'bg-rose-50'
    case 'warning':
      return 'bg-amber-50'
    case 'info':
    default:
      return 'bg-indigo-50'
  }
}
</script>
