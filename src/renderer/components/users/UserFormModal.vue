<template>
  <Modal
    :is-open="isOpen"
    :title="isEditing ? 'Editar Colaborador' : 'Nuevo Colaborador'"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Nombre Completo -->
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
        <input
          v-model="form.fullName"
          type="text"
          placeholder="Ej. Ana Pérez"
          required
          class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
        />
      </div>

      <!-- Nombre de Usuario (login) -->
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Nombre de Usuario *</label>
        <input
          v-model="form.username"
          type="text"
          placeholder="Ej. anap"
          :disabled="isEditing"
          required
          class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all disabled:opacity-60 disabled:bg-slate-100"
        />
        <p v-if="isEditing" class="text-[10px] text-slate-400 mt-0.5">El nombre de usuario no se puede cambiar una vez creado.</p>
      </div>

      <!-- Selección de Rol con Guía Visual -->
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1.5">Rol y Nivel de Acceso *</label>
        <div class="grid grid-cols-1 gap-2">
          <!-- Opción 1: Mozo / Atención -->
          <label
            class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all"
            :class="form.role === 'Atención'
              ? 'border-amber-400 bg-amber-50/50 shadow-sm'
              : 'border-slate-200 hover:bg-slate-50'"
          >
            <input
              type="radio"
              name="user-role"
              value="Atención"
              v-model="form.role"
              class="mt-1 text-amber-600 focus:ring-amber-500"
            />
            <div class="flex-1">
              <div class="flex items-center gap-1.5">
                <UtensilsCrossed class="w-4 h-4 text-amber-600" />
                <span class="text-xs font-bold text-slate-900">Atención (Mozo / Salón)</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5">
                Toma pedidos en mesas y pedido rápido. No puede cobrar ni modificar caja o precios.
              </p>
            </div>
          </label>

          <!-- Opción 2: Cajero -->
          <label
            class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all"
            :class="form.role === 'Cajero'
              ? 'border-emerald-400 bg-emerald-50/50 shadow-sm'
              : 'border-slate-200 hover:bg-slate-50'"
          >
            <input
              type="radio"
              name="user-role"
              value="Cajero"
              v-model="form.role"
              class="mt-1 text-emerald-600 focus:ring-emerald-500"
            />
            <div class="flex-1">
              <div class="flex items-center gap-1.5">
                <Wallet class="w-4 h-4 text-emerald-600" />
                <span class="text-xs font-bold text-slate-900">Cajero (Cobros y Caja)</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5">
                Abre y cierra caja, cobra pedidos (Efectivo/Tarjeta/Yape) y atiende mostrador.
              </p>
            </div>
          </label>

          <!-- Opción 3: Administrador -->
          <label
            class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all"
            :class="form.role === 'Administrador'
              ? 'border-indigo-400 bg-indigo-50/50 shadow-sm'
              : 'border-slate-200 hover:bg-slate-50'"
          >
            <input
              type="radio"
              name="user-role"
              value="Administrador"
              v-model="form.role"
              class="mt-1 text-indigo-600 focus:ring-indigo-500"
            />
            <div class="flex-1">
              <div class="flex items-center gap-1.5">
                <ShieldCheck class="w-4 h-4 text-indigo-600" />
                <span class="text-xs font-bold text-slate-900">Administrador (Dueño / Encargado)</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5">
                Acceso total: gestión de catálogo de productos, precios, personal y arqueos.
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- PIN de Acceso -->
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">
          {{ isEditing ? 'Nuevo PIN / Contraseña (opcional)' : 'PIN / Contraseña de Acceso (mínimo 4 dígitos) *' }}
        </label>
        <input
          v-model="form.pin"
          type="password"
          placeholder="••••"
          maxlength="10"
          :required="!isEditing"
          class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold tracking-widest text-center focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
        />
        <p v-if="isEditing" class="text-[10px] text-slate-400 mt-0.5">
          Deja este campo en blanco si deseas mantener el PIN actual del colaborador.
        </p>
      </div>

      <!-- Error banner -->
      <div v-if="errorMessage" class="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
        {{ errorMessage }}
      </div>

      <!-- Botones de Acción -->
      <div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
        >
          <Save class="w-4 h-4" />
          <span>{{ isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Colaborador') }}</span>
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { User, UserRole } from '@shared/types/user'
import { useAuthStore } from '@/stores/authStore'
import Modal from '@/components/common/Modal.vue'
import { UtensilsCrossed, Wallet, ShieldCheck, Save } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  userToEdit?: User | null
}>()

const emit = defineEmits(['close', 'saved'])
const authStore = useAuthStore()

const isEditing = computed(() => !!props.userToEdit)
const isSubmitting = ref(false)
const errorMessage = ref('')

const form = reactive({
  fullName: '',
  username: '',
  role: 'Atención' as UserRole,
  pin: ''
})

watch(() => props.isOpen, (open) => {
  if (open) {
    errorMessage.value = ''
    if (props.userToEdit) {
      form.fullName = props.userToEdit.full_name
      form.username = props.userToEdit.username
      form.role = props.userToEdit.role
      form.pin = ''
    } else {
      form.fullName = ''
      form.username = ''
      form.role = 'Atención'
      form.pin = ''
    }
  }
})

async function handleSubmit() {
  errorMessage.value = ''

  if (!isEditing.value && (!form.pin || form.pin.length < 4)) {
    errorMessage.value = 'El PIN debe tener al menos 4 caracteres numéricos o alfanuméricos.'
    return
  }

  if (isEditing.value && form.pin && form.pin.length < 4) {
    errorMessage.value = 'El nuevo PIN debe tener al menos 4 caracteres.'
    return
  }

  isSubmitting.value = true
  try {
    if (isEditing.value && props.userToEdit) {
      await authStore.updateUser({
        id: props.userToEdit.id,
        fullName: form.fullName,
        role: form.role,
        pin: form.pin || undefined
      })
    } else {
      await authStore.createUser({
        username: form.username,
        fullName: form.fullName,
        role: form.role,
        pin: form.pin
      })
    }
    emit('saved')
    emit('close')
  } catch (err: any) {
    errorMessage.value = err.message || 'Error al procesar usuario.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
