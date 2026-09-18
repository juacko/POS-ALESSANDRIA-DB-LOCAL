<template>
  <Modal
    :is-open="isOpen"
    :title="isEdit ? 'Editar Producto' : 'Nuevo Producto'"
    max-width="lg"
    @close="$emit('close')"
  >
    <template #icon>
      <PackagePlus class="w-5 h-5 text-indigo-600" />
    </template>

    <div class="space-y-4">
      <div>
        <label class="text-xs font-bold text-slate-700 block mb-1">Nombre del Producto</label>
        <input
          v-model="nameInput"
          type="text"
          placeholder="Ej. Café Espresso, Copa Helado Nutella..."
          class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
          <select
            v-model="categoryIdInput"
            class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option v-for="cat in productStore.categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="text-xs font-bold text-slate-700 block mb-1">Precio Base (S/.)</label>
          <input
            v-model.number="basePriceInput"
            type="number"
            step="0.50"
            min="0"
            placeholder="0.00"
            class="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-extrabold font-heading focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <!-- Grupos de Modificadores Disponibles -->
      <div>
        <label class="text-xs font-bold text-slate-700 block mb-1.5">Grupos de Modificadores Aplicables</label>
        <div class="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 max-h-40 overflow-y-auto">
          <label
            v-for="group in productStore.modifierGroups"
            :key="group.id"
            class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-indigo-600"
          >
            <input
              type="checkbox"
              :value="group.id"
              v-model="selectedGroupIds"
              class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span>{{ group.name }}</span>
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        @click="$emit('close')"
        class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
      >
        Cancelar
      </button>

      <button
        @click="handleSave"
        :disabled="!nameInput.trim() || basePriceInput <= 0"
        class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all"
      >
        {{ isEdit ? 'Guardar Cambios' : 'Crear Producto' }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProductStore } from '@/stores/productStore'
import { Product } from '@shared/types/product'
import Modal from '@/components/common/Modal.vue'
import { PackagePlus } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  productToEdit?: Product | null
}>()

const emit = defineEmits(['close'])

const productStore = useProductStore()

const isEdit = ref(false)
const nameInput = ref('')
const categoryIdInput = ref('')
const basePriceInput = ref<number>(0)
const selectedGroupIds = ref<string[]>([])

watch(() => props.isOpen, (open) => {
  if (open) {
    if (props.productToEdit) {
      isEdit.value = true
      nameInput.value = props.productToEdit.name
      categoryIdInput.value = props.productToEdit.category_id
      basePriceInput.value = props.productToEdit.base_price
      selectedGroupIds.value = props.productToEdit.modifier_groups?.map(g => g.id) || []
    } else {
      isEdit.value = false
      nameInput.value = ''
      categoryIdInput.value = productStore.categories[0]?.id || 'cat-1'
      basePriceInput.value = 10
      selectedGroupIds.value = []
    }
  }
})

async function handleSave() {
  try {
    if (isEdit.value && props.productToEdit) {
      await productStore.updateProduct(props.productToEdit.id, {
        name: nameInput.value,
        category_id: categoryIdInput.value,
        base_price: basePriceInput.value
      }, selectedGroupIds.value)
    } else {
      await productStore.createProduct({
        name: nameInput.value,
        category_id: categoryIdInput.value,
        base_price: basePriceInput.value,
        active: 1
      }, selectedGroupIds.value)
    }
    emit('close')
  } catch (e: any) {
    alert(e.message || 'Error al guardar producto')
  }
}
</script>
