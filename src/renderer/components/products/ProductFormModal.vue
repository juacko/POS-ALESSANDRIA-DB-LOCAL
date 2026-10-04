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
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-bold text-slate-700">Grupos de Modificadores / Variantes</label>
          <span class="text-[11px] text-slate-400">Marca y personaliza las reglas para este producto</span>
        </div>
        <div v-if="productStore.modifierGroups.length === 0" class="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
          No hay grupos creados todavía. Puedes crearlos en la pestaña "Modificadores y Variantes".
        </div>
        <div v-else class="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 max-h-60 overflow-y-auto">
          <div
            v-for="group in productStore.modifierGroups"
            :key="group.id"
            class="rounded-xl border p-2.5 transition-all"
            :class="isGroupSelected(group.id) ? 'bg-white border-indigo-200 shadow-sm' : 'border-slate-200/60 hover:bg-white/70'"
          >
            <div class="flex items-center justify-between gap-2">
              <label class="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  :checked="isGroupSelected(group.id)"
                  @change="toggleGroupSelection(group)"
                  class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span>{{ group.name }}</span>
              </label>

              <span
                class="text-[10px] px-1.5 py-0.5 rounded font-bold"
                :class="group.selection_mode === 'single' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'"
              >
                {{ group.selection_mode === 'single' ? 'Variante (1)' : (group.selection_mode === 'multiple_limited' ? `Máx. ${group.selection_limit}` : 'Libre') }}
              </span>
            </div>

            <!-- Panel de Personalización de Regla para este Producto -->
            <div
              v-if="isGroupSelected(group.id)"
              class="mt-2 pt-2 border-t border-slate-100 pl-6 space-y-1.5"
            >
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-semibold text-slate-500">Regla para este producto:</span>
                <label class="flex items-center gap-1 text-[11px] text-indigo-700 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="groupConfigs[group.id].hasCustomRule"
                    class="rounded text-indigo-600 w-3.5 h-3.5"
                  />
                  <span>Personalizar límite de opciones</span>
                </label>
              </div>

              <div v-if="groupConfigs[group.id]?.hasCustomRule" class="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <select
                    v-model="groupConfigs[group.id].overrideMode"
                    class="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 outline-none"
                  >
                    <option value="single">Selección Única (1 sola opción)</option>
                    <option value="multiple_limited">Múltiple con Límite</option>
                    <option value="multiple_unlimited">Múltiple Libre (Ilimitado)</option>
                  </select>
                </div>

                <div v-if="groupConfigs[group.id].overrideMode === 'multiple_limited'" class="flex items-center gap-1.5">
                  <span class="text-[11px] text-slate-500 shrink-0">Límite:</span>
                  <input
                    v-model.number="groupConfigs[group.id].overrideLimit"
                    type="number"
                    min="1"
                    max="20"
                    placeholder="2"
                    class="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 font-black text-center text-slate-900 outline-none"
                  />
                  <span class="text-[11px] text-slate-400">opc.</span>
                </div>
              </div>
            </div>
          </div>
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
import { useNotificationStore } from '@/stores/notificationStore'
import { Product, ModifierGroup, ProductModifierGroupConfig } from '@shared/types/product'
import Modal from '@/components/common/Modal.vue'
import { PackagePlus } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  productToEdit?: Product | null
}>()

const emit = defineEmits(['close'])

const productStore = useProductStore()
const notificationStore = useNotificationStore()

const isEdit = ref(false)
const nameInput = ref('')
const categoryIdInput = ref('')
const basePriceInput = ref<number>(0)

interface GroupConfigItem {
  selected: boolean
  hasCustomRule: boolean
  overrideMode: 'single' | 'multiple_unlimited' | 'multiple_limited'
  overrideLimit: number
}

const groupConfigs = ref<Record<string, GroupConfigItem>>({})

function isGroupSelected(groupId: string): boolean {
  return Boolean(groupConfigs.value[groupId]?.selected)
}

function toggleGroupSelection(group: ModifierGroup) {
  if (!groupConfigs.value[group.id]) {
    groupConfigs.value[group.id] = {
      selected: true,
      hasCustomRule: false,
      overrideMode: group.selection_mode,
      overrideLimit: group.selection_limit || 1
    }
  } else {
    groupConfigs.value[group.id].selected = !groupConfigs.value[group.id].selected
  }
}

watch(() => props.isOpen, (open) => {
  if (open) {
    groupConfigs.value = {}

    if (props.productToEdit) {
      isEdit.value = true
      nameInput.value = props.productToEdit.name
      categoryIdInput.value = props.productToEdit.category_id
      basePriceInput.value = props.productToEdit.base_price

      if (props.productToEdit.modifier_groups) {
        for (const g of props.productToEdit.modifier_groups) {
          const hasCustom = Boolean(g.override_mode || (g.override_limit !== null && g.override_limit !== undefined))
          groupConfigs.value[g.id] = {
            selected: true,
            hasCustomRule: hasCustom,
            overrideMode: g.override_mode || g.selection_mode,
            overrideLimit: g.override_limit !== null && g.override_limit !== undefined ? g.override_limit : g.selection_limit
          }
        }
      }
    } else {
      isEdit.value = false
      nameInput.value = ''
      categoryIdInput.value = productStore.categories[0]?.id || 'cat-1'
      basePriceInput.value = 10
    }
  }
})

async function handleSave() {
  try {
    const modifierPayload: ProductModifierGroupConfig[] = []
    for (const [groupId, cfg] of Object.entries(groupConfigs.value)) {
      if (cfg.selected) {
        if (cfg.hasCustomRule) {
          modifierPayload.push({
            group_id: groupId,
            override_mode: cfg.overrideMode,
            override_limit: cfg.overrideMode === 'single' ? 1 : (Number(cfg.overrideLimit) || 1)
          })
        } else {
          modifierPayload.push({
            group_id: groupId
          })
        }
      }
    }

    if (isEdit.value && props.productToEdit) {
      await productStore.updateProduct(props.productToEdit.id, {
        name: nameInput.value,
        category_id: categoryIdInput.value,
        base_price: basePriceInput.value
      }, modifierPayload)
    } else {
      await productStore.createProduct({
        name: nameInput.value,
        category_id: categoryIdInput.value,
        base_price: basePriceInput.value,
        active: 1
      }, modifierPayload)
    }
    notificationStore.success(
      isEdit.value ? 'Producto actualizado' : 'Producto creado',
      `"${nameInput.value}" se guardó correctamente.`
    )
    emit('close')
  } catch (e: any) {
    notificationStore.error('Error al guardar producto', e.message || 'No se pudo guardar el producto')
  }
}
</script>
