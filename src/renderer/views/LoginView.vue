<template>
  <div class="h-screen w-screen bg-slate-900 flex items-center justify-center p-6 select-none">
    <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <!-- Brand Logo -->
      <div class="text-center space-y-2">
        <div class="w-16 h-16 rounded-3xl bg-indigo-600 text-white font-black text-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30">
          A
        </div>
        <h2 class="text-2xl font-black text-slate-900 font-heading">Alessandria POS</h2>
        <p class="text-xs text-slate-400 font-medium">Cafeterías, Bares y Heladerías</p>
      </div>

      <!-- User Selector -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1.5">Colaborador</label>
          <select
            v-model="selectedUsername"
            class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <template v-if="authStore.usersList.length > 0">
              <option
                v-for="user in authStore.usersList"
                :key="user.id"
                :value="user.username"
              >
                {{ user.full_name }} ({{ user.role }})
              </option>
            </template>
            <template v-else>
              <option value="admin">Administrador General (Administrador)</option>
              <option value="cajero">Cajero Principal (Cajero)</option>
              <option value="atencion">Atención al Cliente (Atención)</option>
            </template>
          </select>
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1.5">Contraseña / PIN</label>
          <input
            v-model="pinInput"
            type="password"
            placeholder="••••••••"
            required
            class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold tracking-widest text-center text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-300 transition-all font-heading text-base"
        >
          {{ isSubmitting ? 'INGRESANDO...' : 'INICIAR SESIÓN' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const selectedUsername = ref('admin')
const pinInput = ref('')
const isSubmitting = ref(false)

onMounted(async () => {
  await authStore.loadUsers()
  if (authStore.usersList.length > 0) {
    selectedUsername.value = authStore.usersList[0].username
  }
})

watch(() => authStore.usersList, (list) => {
  if (list.length > 0 && !list.some(u => u.username === selectedUsername.value)) {
    selectedUsername.value = list[0].username
  }
})

async function handleLogin() {
  if (!pinInput.value) return
  isSubmitting.value = true
  try {
    const success = await authStore.login(selectedUsername.value, pinInput.value)
    if (success) {
      router.push('/tables')
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>
