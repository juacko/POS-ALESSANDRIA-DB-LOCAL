<template>
  <div class="h-full flex flex-col bg-slate-50 overflow-hidden select-none">
    <!-- Header Principal con Selector de Pestañas -->
    <div class="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
      <div>
        <h2 class="text-lg sm:text-xl font-bold text-slate-900 font-heading flex items-center gap-2">
          <Settings class="w-5 h-5 text-indigo-600" />
          <span>Configuración del Sistema</span>
        </h2>
        <p class="text-xs text-slate-400">Administración de catálogo, precios y equipo de trabajo</p>
      </div>

      <!-- Selector de Pestañas (Catálogo vs Personal) -->
      <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
        <button
          @click="activeTab = 'catalog'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
          :class="activeTab === 'catalog'
            ? 'bg-white text-indigo-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'"
        >
          <Package class="w-4 h-4" />
          <span>Catálogo de Productos</span>
        </button>

        <button
          @click="activeTab = 'users'"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
          :class="activeTab === 'users'
            ? 'bg-white text-indigo-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'"
        >
          <Users class="w-4 h-4" />
          <span>Personal y Permisos</span>
        </button>
      </div>
    </div>

    <!-- ==================== PESTAÑA 1: CATÁLOGO DE PRODUCTOS ==================== -->
    <template v-if="activeTab === 'catalog'">
      <!-- Buscador y Filtros de Productos -->
      <div class="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
        <div class="flex items-center gap-3 flex-1 max-w-lg">
          <div class="relative flex-1">
            <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar producto..."
              class="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <select
            v-model="selectedCategory"
            class="px-3 py-2 bg-slate-100 border border-transparent rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Todas las Categorías</option>
            <option v-for="cat in productStore.categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <button
          @click="openCreateModal"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus class="w-4 h-4" />
          <span>NUEVO PRODUCTO</span>
        </button>
      </div>

      <!-- Tabla CRUD de Productos -->
      <div class="flex-1 p-4 sm:p-6 overflow-y-auto pb-20 md:pb-16">
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase font-extrabold text-slate-400">
                <th class="py-3 px-4">Producto</th>
                <th class="py-3 px-4">Categoría</th>
                <th class="py-3 px-4">Precio Base</th>
                <th class="py-3 px-4">Modificadores</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              <tr v-for="p in filteredProducts" :key="p.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-4 font-bold text-slate-900 font-heading">
                  {{ p.name }}
                </td>
                <td class="py-3 px-4">
                  <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold">
                    {{ p.category_name }}
                  </span>
                </td>
                <td class="py-3 px-4 font-extrabold text-slate-900 font-heading">
                  S/. {{ p.base_price.toFixed(2) }}
                </td>
                <td class="py-3 px-4 text-xs text-slate-500">
                  <template v-if="p.modifier_groups && p.modifier_groups.length > 0">
                    <span
                      v-for="g in p.modifier_groups"
                      :key="g.id"
                      class="inline-block bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-md mr-1"
                    >
                      {{ g.name }}
                    </span>
                  </template>
                  <span v-else class="text-slate-300">Ninguno</span>
                </td>
                <td class="py-3 px-4">
                  <button
                    @click="toggleActive(p)"
                    class="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    :class="p.active ? 'bg-emerald-500' : 'bg-slate-300'"
                    :title="p.active ? 'Desactivar producto' : 'Activar producto'"
                  >
                    <span
                      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="p.active ? 'translate-x-5' : 'translate-x-0'"
                    />
                  </button>
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    @click="openEditModal(p)"
                    class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar Producto"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ==================== PESTAÑA 2: PERSONAL Y PERMISOS ==================== -->
    <template v-else>
      <!-- Subheader Personal -->
      <div class="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Equipo de Trabajo y Permisos</h3>
          <p class="text-[11px] text-slate-400">Control de colaboradores autorizados para acceder a caja, comandas o ajustes</p>
        </div>

        <button
          @click="openCreateUserModal"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 shrink-0"
        >
          <UserPlus class="w-4 h-4" />
          <span>NUEVO COLABORADOR</span>
        </button>
      </div>

      <!-- Lista de Colaboradores -->
      <div class="flex-1 p-4 sm:p-6 overflow-y-auto pb-20 md:pb-16 space-y-4">
        <!-- Guía Rápida de Roles para la Cafetería -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-sm flex items-start gap-3">
            <div class="p-2 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
              <ShieldCheck class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-900 font-heading">Administrador</h4>
              <p class="text-[11px] text-slate-500 mt-0.5">Control total, edición de productos/precios, usuarios y arqueos.</p>
            </div>
          </div>

          <div class="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-sm flex items-start gap-3">
            <div class="p-2 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
              <Wallet class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-900 font-heading">Cajero</h4>
              <p class="text-[11px] text-slate-500 mt-0.5">Apertura y cierre de caja, cobros y ventas directas.</p>
            </div>
          </div>

          <div class="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-sm flex items-start gap-3">
            <div class="p-2 rounded-xl bg-amber-50 text-amber-700 shrink-0">
              <UtensilsCrossed class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-900 font-heading">Atención / Mozo</h4>
              <p class="text-[11px] text-slate-500 mt-0.5">Toma comandas en salón desde móvil o PC. No puede cobrar ni abrir caja.</p>
            </div>
          </div>
        </div>

        <!-- Tabla de Usuarios -->
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase font-extrabold text-slate-400">
                <th class="py-3 px-4">Colaborador</th>
                <th class="py-3 px-4">Usuario (Login)</th>
                <th class="py-3 px-4">Rol Asignado</th>
                <th class="py-3 px-4">Acceso a Caja</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              <tr v-for="user in authStore.allUsersList" :key="user.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3.5 px-4 font-bold text-slate-900">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                      :class="user.role === 'Administrador'
                        ? 'bg-indigo-100 text-indigo-700'
                        : (user.role === 'Cajero' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')"
                    >
                      {{ user.full_name.charAt(0) }}
                    </div>
                    <div>
                      <span class="block text-xs sm:text-sm font-bold text-slate-900">{{ user.full_name }}</span>
                      <span v-if="user.id === authStore.currentUser?.id" class="text-[10px] text-indigo-600 font-semibold">(Sesión actual)</span>
                    </div>
                  </div>
                </td>

                <td class="py-3.5 px-4 text-xs font-semibold text-slate-600">
                  <code class="px-2 py-1 bg-slate-100 rounded-md text-slate-800">@{{ user.username }}</code>
                </td>

                <td class="py-3.5 px-4">
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                    :class="user.role === 'Administrador'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : (user.role === 'Cajero'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200')"
                  >
                    <ShieldCheck v-if="user.role === 'Administrador'" class="w-3.5 h-3.5 text-indigo-600" />
                    <Wallet v-else-if="user.role === 'Cajero'" class="w-3.5 h-3.5 text-emerald-600" />
                    <UtensilsCrossed v-else class="w-3.5 h-3.5 text-amber-600" />
                    <span>{{ user.role }}</span>
                  </span>
                </td>

                <td class="py-3.5 px-4 text-xs">
                  <span v-if="user.role === 'Administrador' || user.role === 'Cajero'" class="text-emerald-600 font-semibold flex items-center gap-1">
                    <Check class="w-3.5 h-3.5" /> Autorizado
                  </span>
                  <span v-else class="text-slate-400 font-medium flex items-center gap-1">
                    <X class="w-3.5 h-3.5" /> Bloqueado
                  </span>
                </td>

                <td class="py-3.5 px-4">
                  <button
                    @click="handleToggleUser(user)"
                    :disabled="user.id === authStore.currentUser?.id"
                    class="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                    :class="user.active ? 'bg-emerald-500' : 'bg-slate-300'"
                    :title="user.id === authStore.currentUser?.id ? 'No puedes desactivar tu propia sesión' : (user.active ? 'Desactivar acceso' : 'Activar acceso')"
                  >
                    <span
                      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="user.active ? 'translate-x-5' : 'translate-x-0'"
                    />
                  </button>
                </td>

                <td class="py-3.5 px-4 text-right">
                  <button
                    @click="openEditUserModal(user)"
                    class="px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1"
                    title="Editar datos o cambiar PIN"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                    <span>Editar / PIN</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modal Formulario de Producto -->
    <ProductFormModal
      :is-open="isFormModalOpen"
      :product-to-edit="productToEdit"
      @close="isFormModalOpen = false"
    />

    <!-- Modal Formulario de Usuario -->
    <UserFormModal
      :is-open="isUserModalOpen"
      :user-to-edit="userToEdit"
      @close="isUserModalOpen = false"
      @saved="handleUserSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/productStore'
import { useAuthStore } from '@/stores/authStore'
import { Product } from '@shared/types/product'
import { User } from '@shared/types/user'
import ProductFormModal from '@/components/products/ProductFormModal.vue'
import UserFormModal from '@/components/users/UserFormModal.vue'
import {
  Settings,
  Plus,
  Search,
  Pencil,
  Package,
  Users,
  UserPlus,
  ShieldCheck,
  Wallet,
  UtensilsCrossed,
  Check,
  X
} from 'lucide-vue-next'

const productStore = useProductStore()
const authStore = useAuthStore()

const activeTab = ref<'catalog' | 'users'>('catalog')

// Estado Catálogo
const searchQuery = ref('')
const selectedCategory = ref('all')
const isFormModalOpen = ref(false)
const productToEdit = ref<Product | null>(null)

// Estado Usuarios
const isUserModalOpen = ref(false)
const userToEdit = ref<User | null>(null)

onMounted(async () => {
  await Promise.all([
    productStore.loadCatalog(),
    authStore.loadAllUsers()
  ])
})

const filteredProducts = computed(() => {
  return productStore.products.filter(p => {
    const matchCat = selectedCategory.value === 'all' || p.category_id === selectedCategory.value
    const matchSearch = !searchQuery.value.trim() || p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchCat && matchSearch
  })
})

function openCreateModal() {
  productToEdit.value = null
  isFormModalOpen.value = true
}

function openEditModal(product: Product) {
  productToEdit.value = product
  isFormModalOpen.value = true
}

async function toggleActive(product: Product) {
  const nextState = product.active === 1 ? 0 : 1
  await productStore.toggleProductActive(product.id, nextState)
}

function openCreateUserModal() {
  userToEdit.value = null
  isUserModalOpen.value = true
}

function openEditUserModal(user: User) {
  userToEdit.value = user
  isUserModalOpen.value = true
}

async function handleToggleUser(user: User) {
  try {
    const nextState = user.active === 1 ? 0 : 1
    await authStore.toggleUserActive(user.id, nextState)
  } catch (err: any) {
    alert(err.message || 'Error al cambiar estado del colaborador')
  }
}

async function handleUserSaved() {
  await authStore.loadAllUsers()
}
</script>
