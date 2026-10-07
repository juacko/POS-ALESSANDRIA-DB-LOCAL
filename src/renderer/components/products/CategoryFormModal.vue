<template>
  <Modal
    :is-open="isOpen"
    :title="isEdit ? 'Editar Categoría' : 'Nueva Categoría'"
    max-width="md"
    @close="$emit('close')"
  >
    <template #icon>
      <FolderTree class="w-5 h-5 text-indigo-600" />
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Nombre de la Categoría -->
      <div>
        <label class="text-xs font-bold text-slate-700 block mb-1">
          Nombre de la Categoría <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="nameInput"
          type="text"
          placeholder="Ej: Helados, Cafetería, Bebidas, Postres..."
          class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm transition-all"
          autofocus
          required
        />
        <p class="text-[11px] text-slate-400 mt-1">
          Aparecerá en las pestañas del POS, el catálogo y los reportes de ventas.
        </p>
      </div>

      <!-- Orden de Visualización -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-xs font-bold text-slate-700">
            Orden de Visualización
          </label>
          <span class="text-[11px] font-semibold text-slate-400">Prioridad en menú</span>
        </div>
        <input
          v-model.number="displayOrderInput"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          class="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm transition-all"
        />
        <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">
          Los números menores aparecen más a la izquierda en la barra de categorías del POS (ej: 0 = primero, 1 = segundo, etc.).
        </p>
      </div>

      <!-- Vista Previa en Vivo -->
      <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Vista previa del botón en POS:
        </span>
        <div class="flex items-center gap-2">
          <span
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm inline-flex items-center gap-1.5"
          >
            <FolderTree class="w-3.5 h-3.5" />
            <span>{{ nameInput.trim() || 'Nombre de Categoría' }}</span>
          </span>
          <span class="text-[11px] text-slate-400 font-medium">
            (Orden: #{{ displayOrderInput || 0 }})
          </span>
        </div>
      </div>

      <div v-if="errorMessage" class="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
        {{ errorMessage }}
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        @click="$emit('close')"
        class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
      >
        Cancelar
      </button>

      <button
        type="button"
        @click="handleSubmit"
        :disabled="!isValid || isSaving"
        class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
      >
        <span v-if="isSaving" class="animate-spin mr-1">⌛</span>
        <span>{{ isEdit ? 'Guardar Cambios' : 'Crear Categoría' }}</span>
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Category } from '@shared/types/product'
import Modal from '@/components/common/Modal.vue'
import { FolderTree } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  categoryToEdit: Category | null
  suggestedOrder?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: { name: string; display_order: number }): void
}>()

const nameInput = ref('')
const displayOrderInput = ref(0)
const isSaving = ref(false)
const errorMessage = ref('')

const isEdit = computed(() => !!props.categoryToEdit)

const isValid = computed(() => {
  return nameInput.value.trim().length >= 2
})

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      errorMessage.value = ''
      isSaving.value = false
      if (props.categoryToEdit) {
        nameInput.value = props.categoryToEdit.name
        displayOrderInput.value = props.categoryToEdit.display_order ?? 0
      } else {
        nameInput.value = ''
        displayOrderInput.value = props.suggestedOrder ?? 0
      }
    }
  }
)

function handleSubmit() {
  if (!isValid.value) {
    errorMessage.value = 'El nombre debe tener al menos 2 caracteres.'
    return
  }

  emit('save', {
    name: nameInput.value.trim(),
    display_order: Number(displayOrderInput.value) || 0
  })
}
</script>
