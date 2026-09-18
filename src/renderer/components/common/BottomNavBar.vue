<template>
  <!-- Barra Móvil Fija Abajo / Pill Flotante Adaptativo en Desktop -->
  <nav
    class="fixed z-40 select-none transition-all duration-200
           bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl pb-safe
           md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-fit md:max-w-fit md:p-1.5 md:rounded-2xl md:border md:border-slate-200/80 md:shadow-xl md:bg-white/95 md:backdrop-blur-md"
  >
    <div class="flex items-center justify-around md:justify-center gap-1 md:gap-1.5 px-2 py-1.5 md:p-0 w-full md:w-auto">
      <button
        v-for="item in navItems"
        :key="item.id"
        @click="navigate(item.id)"
        class="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2.5 sm:px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 shrink-0"
        :class="isActive(item.id)
          ? [item.activeClass, 'shadow-sm font-bold']
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80'"
      >
        <component
          :is="item.icon"
          class="w-4 h-4 shrink-0 transition-transform"
          :class="isActive(item.id) && item.iconActiveClass ? item.iconActiveClass : (item.id === 'quick-order' && !isActive(item.id) ? 'text-amber-500 fill-amber-500' : '')"
        />
        <span class="text-[10px] md:text-xs whitespace-nowrap">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { UtensilsCrossed, Zap, ClipboardList, Wallet, Package } from 'lucide-vue-next'
import { usePosStore } from '@/stores/posStore'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const route = useRoute()
const posStore = usePosStore()
const authStore = useAuthStore()

const currentRouteName = computed(() => route.name)

interface NavItem {
  id: string
  label: string
  icon: any
  activeClass: string
  iconActiveClass?: string
}

const navItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    {
      id: 'tables',
      label: 'Mesas',
      icon: UtensilsCrossed,
      activeClass: 'bg-indigo-600 text-white shadow-indigo-200'
    },
    {
      id: 'quick-order',
      label: 'Rápido',
      icon: Zap,
      activeClass: 'bg-amber-500 text-white shadow-amber-200',
      iconActiveClass: 'text-amber-200 fill-amber-200'
    },
    {
      id: 'orders',
      label: 'Órdenes',
      icon: ClipboardList,
      activeClass: 'bg-indigo-600 text-white shadow-indigo-200'
    }
  ]

  // Solo Administrador y Cajero tienen acceso a Caja
  if (authStore.isCashier) {
    items.push({
      id: 'cashier',
      label: 'Caja',
      icon: Wallet,
      activeClass: 'bg-emerald-600 text-white shadow-emerald-200'
    })
  }

  // Si es administrador, agregar acceso a Catálogo/Ajustes
  if (authStore.isAdmin) {
    items.push({
      id: 'settings',
      label: 'Ajustes',
      icon: Package,
      activeClass: 'bg-slate-900 text-white shadow-slate-200'
    })
  }

  return items
})

function isActive(id: string): boolean {
  if (id === 'tables') {
    return currentRouteName.value === 'tables' || (currentRouteName.value === 'pos' && !!posStore.activeTableId)
  }
  if (id === 'quick-order') {
    return currentRouteName.value === 'pos' && !posStore.activeTableId
  }
  if (id === 'orders') {
    return currentRouteName.value === 'orders'
  }
  if (id === 'cashier') {
    return currentRouteName.value === 'cashier'
  }
  if (id === 'settings') {
    return currentRouteName.value === 'settings'
  }
  return false
}

function navigate(id: string) {
  if (id === 'quick-order') {
    posStore.startQuickOrder()
    router.push({ name: 'pos' })
  } else {
    router.push({ name: id })
  }
}
</script>
