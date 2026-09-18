import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { User, UserRole } from '@shared/types/user'
import { api } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>({
    id: 'u-admin',
    username: 'admin',
    full_name: 'Administrador General',
    role: 'Administrador',
    active: 1
  })

  // Lista de usuarios activos para login rápido
  const usersList = ref<User[]>([])
  // Lista de todos los colaboradores para panel de administración
  const allUsersList = ref<User[]>([])
  const isLoading = ref(false)

  // Permisos computados según el rol del usuario autenticado
  const isAdmin = computed(() => currentUser.value?.role === 'Administrador')
  const isCashier = computed(() => currentUser.value?.role === 'Administrador' || currentUser.value?.role === 'Cajero')
  const isWaiter = computed(() => currentUser.value?.role === 'Atención')

  const canManageCatalog = computed(() => isAdmin.value)
  const canManageUsers = computed(() => isAdmin.value)
  const canAccessCashier = computed(() => isCashier.value)
  const canDirectCharge = computed(() => isCashier.value)

  async function loadUsers() {
    try {
      usersList.value = await api.getUsers()
    } catch (e) {
      console.error('Error al cargar usuarios activos', e)
    }
  }

  async function loadAllUsers() {
    isLoading.value = true
    try {
      allUsersList.value = await api.getAllUsers()
    } catch (e) {
      console.error('Error al cargar todos los usuarios', e)
    } finally {
      isLoading.value = false
    }
  }

  async function login(username: string, pin: string) {
    try {
      const user = await api.login({ username, pin })
      currentUser.value = user
      return true
    } catch (e: any) {
      alert(e.message || 'Error al iniciar sesión')
      return false
    }
  }

  async function createUser(data: { username: string; fullName: string; role: UserRole; pin: string }) {
    const created = await api.createUser(data)
    await loadAllUsers()
    await loadUsers()
    return created
  }

  async function updateUser(data: { id: string; fullName: string; role: UserRole; pin?: string }) {
    const updated = await api.updateUser(data)
    // Si el usuario actualizado es el usuario logueado actualmente, actualizar sesión
    if (currentUser.value && currentUser.value.id === updated.id) {
      currentUser.value = updated
    }
    await loadAllUsers()
    await loadUsers()
    return updated
  }

  async function toggleUserActive(id: string, active: number) {
    await api.toggleUserActive({ id, active })
    await loadAllUsers()
    await loadUsers()
  }

  function logout() {
    currentUser.value = null
  }

  return {
    currentUser,
    usersList,
    allUsersList,
    isLoading,
    isAdmin,
    isCashier,
    isWaiter,
    canManageCatalog,
    canManageUsers,
    canAccessCashier,
    canDirectCharge,
    loadUsers,
    loadAllUsers,
    login,
    createUser,
    updateUser,
    toggleUserActive,
    logout
  }
})
