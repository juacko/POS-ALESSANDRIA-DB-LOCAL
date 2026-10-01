<template>
  <Modal
    :is-open="isOpen"
    :title="isEdit ? 'Editar Grupo de Modificadores / Variantes' : 'Nuevo Grupo de Modificadores / Variantes'"
    max-width="lg"
    @close="$emit('close')"
  >
    <template #icon>
      <SlidersHorizontal class="w-5 h-5 text-indigo-600" />
    </template>

    <div class="space-y-4">
      <div>
        <label class="text-xs font-bold text-slate-700 block mb-1">Nombre del Grupo</label>
        <input
          v-model="nameInput"
          type="text"
          placeholder="Ej: Tamaño de Bebida, Sabores de Helado, Toppings..."
          class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <!-- Tipo de Selección / Regla -->
      <div>
        <label class="text-xs font-bold text-slate-700 block mb-2">Comportamiento del Grupo</label>
        <div class="space-y-2">
          <!-- Opción 1: Variante / Selección Única -->
          <label
            class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none"
            :class="selectionModeInput === 'single'
              ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
              : 'border-slate-200 hover:border-slate-300 bg-white'"
          >
            <input
              type="radio"
              name="selection_mode"
              value="single"
              v-model="selectionModeInput"
              class="mt-0.5 text-indigo-600 focus:ring-indigo-500"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-900 font-heading">Variante / Selección Única (1 sola opción)</span>
                <span class="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Recomendado para tamaños</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                El cliente debe elegir obligatoriamente solo una alternativa (ej: 10 oz vs 12 oz, Vaso vs Cono, Leche Entera vs Deslactosada).
              </p>
            </div>
          </label>

          <!-- Opción 2: Múltiple con Límite -->
          <label
            class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none"
            :class="selectionModeInput === 'multiple_limited'
              ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
              : 'border-slate-200 hover:border-slate-300 bg-white'"
          >
            <input
              type="radio"
              name="selection_mode"
              value="multiple_limited"
              v-model="selectionModeInput"
              class="mt-0.5 text-indigo-600 focus:ring-indigo-500"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-900 font-heading">Múltiple con Límite Definido</span>
                <span class="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">Ej: 2 o 3 bolas</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Permite seleccionar varias opciones hasta alcanzar un tope máximo fijado (ej: elegir hasta 2 o 3 sabores).
              </p>
            </div>
          </label>

          <!-- Opción 3: Múltiple Libre / Ilimitado -->
          <label
            class="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none"
            :class="selectionModeInput === 'multiple_unlimited'
              ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
              : 'border-slate-200 hover:border-slate-300 bg-white'"
          >
            <input
              type="radio"
              name="selection_mode"
              value="multiple_unlimited"
              v-model="selectionModeInput"
              class="mt-0.5 text-indigo-600 focus:ring-indigo-500"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-900 font-heading">Múltiple Libre / Adicionales</span>
                <span class="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded">Toppings y Extras</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                El cliente puede añadir todos los modificadores que desee sin restricción de cantidad (ej: Fudge + Chantilly + Pecanas).
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- Input de Límite (visible si es multiple_limited o multiple_unlimited) -->
      <div v-if="selectionModeInput === 'multiple_limited'" class="bg-blue-50/80 p-3 rounded-xl border border-blue-200 flex items-center justify-between gap-3">
        <div>
          <label class="text-xs font-bold text-blue-900 block">Límite Máximo de Opciones</label>
          <span class="text-[11px] text-blue-700">Cantidad máxima que el cliente podrá marcar</span>
        </div>
        <input
          v-model.number="selectionLimitInput"
          type="number"
          min="1"
          max="20"
          class="w-20 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-slate-900 font-extrabold text-center text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
    </div>

    <template #footer>
      <button
        @click="$emit('close')"
        class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors"
      >
        Cancelar
      </button>

      <button
        @click="handleSave"
        :disabled="!nameInput.trim() || isSubmitting"
        class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
      >
        <span>{{ isEdit ? 'Guardar Cambios' : 'Crear Grupo' }}</span>
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProductStore } from '@/stores/productStore'
import { ModifierGroup } from '@shared/types/product'
import Modal from '@/components/common/Modal.vue'
import { SlidersHorizontal } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  groupToEdit?: ModifierGroup | null
}>()

const emit = defineEmits(['close', 'saved'])

const productStore = useProductStore()
const isEdit = ref(false)
const isSubmitting = ref(false)
const nameInput = ref('')
const selectionModeInput = ref<'single' | 'multiple_unlimited' | 'multiple_limited'>('single')
const selectionLimitInput = ref<number>(1)

watch(() => props.isOpen, (open) => {
  if (open) {
    if (props.groupToEdit) {
      isEdit.value = true
      nameInput.value = props.groupToEdit.name
      selectionModeInput.value = props.groupToEdit.selection_mode
      selectionLimitInput.value = props.groupToEdit.selection_limit || 1
    } else {
      isEdit.value = false
      nameInput.value = ''
      selectionModeInput.value = 'single'
      selectionLimitInput.value = 1
    }
  }
})

async function handleSave() {
  if (!nameInput.value.trim()) return

  isSubmitting.value = true
  try {
    const limit = selectionModeInput.value === 'single'
      ? 1
      : (selectionModeInput.value === 'multiple_unlimited' ? 10 : Number(selectionLimitInput.value) || 1)

    if (isEdit.value && props.groupToEdit) {
      await productStore.updateModifierGroup(props.groupToEdit.id, {
        name: nameInput.value.trim(),
        selection_mode: selectionModeInput.value,
        selection_limit: limit
      })
    } else {
      await productStore.createModifierGroup({
        name: nameInput.value.trim(),
        selection_mode: selectionModeInput.value,
        selection_limit: limit
      })
    }
    emit('saved')
    emit('close')
  } catch (e: any) {
    alert(e.message || 'Error al guardar el grupo')
  } finally {
    isSubmitting.value = false
  }
}
</script>
