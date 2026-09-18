<template>
  <header class="h-14 sm:h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between shadow-sm z-30 select-none shrink-0">
    <!-- Brand & Back Button -->
    <div class="flex items-center gap-2 sm:gap-4">
      <button
        v-if="showBackButton"
        @click="$emit('back')"
        class="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl font-medium text-xs sm:text-sm transition-all group"
      >
        <ArrowLeft class="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        <span class="hidden xs:inline sm:inline">Mesas</span>
      </button>

      <div class="flex items-center gap-2 sm:gap-3">
        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-base sm:text-xl shadow-md shadow-indigo-200 shrink-0">
          A
        </div>
        <div class="truncate max-w-[140px] sm:max-w-none">
          <h1 class="text-sm sm:text-lg font-bold text-slate-900 leading-tight font-heading truncate">
            Alessandria <span class="text-indigo-600 font-medium text-xs sm:text-sm">/ Min Min</span>
          </h1>
          <p class="text-[10px] text-slate-400 font-medium hidden sm:block">Sistema POS Desktop & Móvil</p>
        </div>
      </div>
    </div>

    <!-- Right Actions: Cashier status badge, User info, Settings, Logout -->
    <div class="flex items-center gap-1.5 sm:gap-3">
      <!-- Estado de Caja Badge (Solo visible para Cajero y Administrador) -->
      <div
        v-if="authStore.isCashier"
        @click="router.push('/cashier')"
        class="hidden md:flex cursor-pointer px-3 py-1.5 rounded-xl border items-center gap-2 text-xs font-semibold transition-all hover:scale-105"
        :class="cashierStore.activeSession
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-rose-50 border-rose-200 text-rose-700'"
      >
        <span class="w-2 h-2 rounded-full animate-pulse" :class="cashierStore.activeSession ? 'bg-emerald-500' : 'bg-rose-500'"></span>
        <span>{{ cashierStore.activeSession ? 'Caja Abierta' : 'Caja Cerrada' }}</span>
      </div>

      <!-- User Avatar / Badge -->
      <div v-if="authStore.currentUser" class="flex items-center gap-2 bg-slate-50 p-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200/60">
        <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs sm:text-sm shrink-0">
          {{ authStore.currentUser.full_name.charAt(0) }}
        </div>
        <div class="hidden lg:block text-left">
          <p class="text-xs font-bold text-slate-800 leading-none">{{ authStore.currentUser.full_name }}</p>
          <span class="text-[10px] uppercase tracking-wider font-semibold text-indigo-600">{{ authStore.currentUser.role }}</span>
        </div>
      </div>

      <!-- Botón Conectar Móvil QR (Oculto en celulares, solo visible en desktop/tablets grandes) -->
      <button
        v-if="isDesktopPlatform"
        @click="isMobileModalOpen = true"
        class="hidden lg:flex px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all items-center gap-1.5 shadow-sm"
        title="Conectar Celulares o Tablets por Wi-Fi"
      >
        <Smartphone class="w-4 h-4 text-indigo-600" />
        <span>📲 Conectar Móvil</span>
      </button>

      <!-- Ajustes Config Button (Solo visible para Administradores) -->
      <button
        v-if="authStore.isAdmin"
        @click="router.push('/settings')"
        class="p-1.5 sm:p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-transparent hover:border-indigo-100 transition-all"
        title="Configuración del Sistema"
      >
        <Settings class="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <!-- Salir Button -->
      <button
        @click="handleLogout"
        class="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
        title="Cerrar Sesión"
      >
        <LogOut class="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>

    <!-- Modal de Conexión Móvil QR -->
    <MobileConnectModal :is-open="isMobileModalOpen" @close="isMobileModalOpen = false" />
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'
import { ArrowLeft, Settings, LogOut, Smartphone } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { useCashierStore } from '@/stores/cashierStore'
import MobileConnectModal from './MobileConnectModal.vue'

defineEmits(['back'])

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const cashierStore = useCashierStore()

const isMobileModalOpen = ref(false)
const isDesktopPlatform = computed(() => typeof window !== 'undefined' && !!window.api)

const showBackButton = computed(() => {
  return route.name === 'pos'
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>
