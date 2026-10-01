<template>
  <Modal
    :is-open="isOpen"
    :title="isEdit ? 'Editar Opción / Variante' : `Nueva Opción para ${groupName || 'Grupo'}`"
    max-width="md"
    @close="$emit('close')"
  >
    <template #icon>
      <PlusCircle class="w-5 h-5 text-indigo-600" />
    </template>

    <div class="space-y-4">
      <div>
        <label class="text-xs font-bold text-slate-700 block mb-1">Nombre de la Opción / Sabor / Presentación</label>
        <input
          v-model="nameInput"
          type="text"
          placeholder="Ej: Chocolate Fudgy, Vaso 12 oz, Fudge Artesanal..."
          class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div>
        <label class="text-xs font-bold text-slate-700 block mb-1">
          Ajuste de Precio Adicional (S/.)
        </label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+ S/.</span>
          <input
            v-model.number="priceAdjustmentInput"
            type="number"
            step="0.50"
            min="0"
            placeholder="0.00"
            class="w-full pl-14 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-black font-heading focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <p class="text-[11px] text-slate-400 mt-1">
          Deja en <strong>0.00</strong> si la opción no tiene costo adicional (incluido en el precio base).
        </p>
      </div>

      <div class="pt-1">
        <label class="flex items-center gap-2.5 cursor-pointer select-none p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
          <input
            v-model="isDefaultInput"
            type="checkbox"
            class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <div>
            <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>📌</span> Opción predeterminada al vender
            </span>
            <p class="text-[11px] text-slate-500">
              Aparecerá seleccionada automáticamente al pedir este producto en caja.
            </p>
          </div>
        </label>
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
        <span>{{ isEdit ? 'Guardar Cambios' : 'Agregar Opción' }}</span>
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProductStore } from '@/stores/productStore'
import { ModifierOption } from '@shared/types/product'
import Modal from '@/components/common/Modal.vue'
import { PlusCircle } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  groupId: string
  groupName?: string
  optionToEdit?: ModifierOption | null
}>()

const emit = defineEmits(['close', 'saved'])

const productStore = useProductStore()
const isEdit = ref(false)
const isSubmitting = ref(false)
const nameInput = ref('')
const priceAdjustmentInput = ref<number>(0)
const isDefaultInput = ref(false)

watch(() => props.isOpen, (open) => {
  if (open) {
    if (props.optionToEdit) {
      isEdit.value = true
      nameInput.value = props.optionToEdit.name
      priceAdjustmentInput.value = props.optionToEdit.price_adjustment
      isDefaultInput.value = props.optionToEdit.is_default === 1
    } else {
      isEdit.value = false
      nameInput.value = ''
      priceAdjustmentInput.value = 0
      isDefaultInput.value = false
    }
  }
})

async function handleSave() {
  if (!nameInput.value.trim() || !props.groupId) return

  isSubmitting.value = true
  try {
    const priceAdj = Number(priceAdjustmentInput.value) || 0
    const isDef = isDefaultInput.value ? 1 : 0

    if (isEdit.value && props.optionToEdit) {
      await productStore.updateModifierOption(props.optionToEdit.id, {
        name: nameInput.value.trim(),
        price_adjustment: priceAdj,
        is_default: isDef
      })
    } else {
      await productStore.createModifierOption({
        group_id: props.groupId,
        name: nameInput.value.trim(),
        price_adjustment: priceAdj,
        is_default: isDef
      })
    }
    emit('saved')
    emit('close')
  } catch (e: any) {
    alert(e.message || 'Error al guardar la opción')
  } finally {
    isSubmitting.value = false
  }
}
</script>
