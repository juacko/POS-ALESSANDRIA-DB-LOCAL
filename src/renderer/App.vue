<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden bg-slate-50 font-inter antialiased">
    <!-- Top Bar (Visible excepto en Login) -->
    <PosTopBar v-if="authStore.currentUser && route.name !== 'login'" @back="handleBackToTables" />

    <!-- Main Content Area -->
    <main class="flex-1 overflow-hidden relative">
      <router-view />
    </main>

    <!-- Navigation Flotante Inferior (Visible en operaciones principales) -->
    <BottomNavBar v-if="authStore.currentUser && route.name !== 'login'" />

    <!-- Notificaciones Toast Globales -->
    <NotificationToast />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useCashierStore } from '@/stores/cashierStore'
import PosTopBar from '@/components/common/PosTopBar.vue'
import BottomNavBar from '@/components/common/BottomNavBar.vue'
import NotificationToast from '@/components/common/NotificationToast.vue'
import { initRealtimeSync } from '@/services/syncService'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cashierStore = useCashierStore()

onMounted(async () => {
  await cashierStore.checkActiveSession()
  initRealtimeSync()
})

function handleBackToTables() {
  router.push('/tables')
}
</script>
