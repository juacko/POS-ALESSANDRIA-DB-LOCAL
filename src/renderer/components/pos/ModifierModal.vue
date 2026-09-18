<template>
  <Modal
    :is-open="posStore.isModifierModalOpen"
    :title="`Opciones para ${posStore.selectedProductForModifiers?.name || ''}`"
    max-width="lg"
    @close="posStore.isModifierModalOpen = false"
  >
    <template #icon>
      <SlidersHorizontal class="w-5 h-5 text-indigo-600" />
    </template>

    <div v-if="posStore.selectedProductForModifiers" class="space-y-6">
      <div
        v-for="group in posStore.selectedProductForModifiers.modifier_groups"
        :key="group.id"
        class="space-y-3 border-b border-slate-100 pb-4 last:border-0"
      >
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-bold text-slate-800 font-heading">{{ group.name }}</h4>
          <span class="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
            {{ group.selection_mode === 'single' ? 'Selección Única' : `Máx. ${group.selection_limit} opciones` }}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label
            v-for="mod in group.modifiers"
            :key="mod.id"
            class="cursor-pointer border rounded-xl p-3 flex items-center justify-between transition-all select-none"
            :class="isModifierSelected(group.id, mod.id)
              ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'"
          >
            <div class="flex items-center gap-2.5">
              <input
                :type="group.selection_mode === 'single' ? 'radio' : 'checkbox'"
                :name="group.id"
                :checked="isModifierSelected(group.id, mod.id)"
                @change="toggleModifier(group, mod)"
                class="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span class="text-sm font-semibold text-slate-800">{{ mod.name }}</span>
            </div>

            <span v-if="mod.price_adjustment > 0" class="text-xs font-bold text-indigo-600">
              +S/. {{ mod.price_adjustment.toFixed(2) }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        @click="posStore.isModifierModalOpen = false"
        class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
      >
        Cancelar
      </button>
      <button
        @click="confirmAddWithModifiers"
        class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all"
      >
        Agregar a la Orden
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePosStore } from '@/stores/posStore'
import { ModifierGroup, ModifierOption } from '@shared/types/product'
import { SelectedModifier } from '@shared/types/order'
import Modal from '@/components/common/Modal.vue'
import { SlidersHorizontal } from 'lucide-vue-next'

const posStore = usePosStore()
const selectedModifiers = ref<SelectedModifier[]>([])

watch(() => posStore.isModifierModalOpen, (isOpen) => {
  if (isOpen) {
    selectedModifiers.value = []
  }
})

function isModifierSelected(groupId: string, modId: string): boolean {
  return selectedModifiers.value.some(m => m.group_id === groupId && m.modifier_id === modId)
}

function toggleModifier(group: ModifierGroup, mod: ModifierOption) {
  if (group.selection_mode === 'single') {
    // Reemplazar la selección previa del grupo
    selectedModifiers.value = selectedModifiers.value.filter(m => m.group_id !== group.id)
    selectedModifiers.value.push({
      group_id: group.id,
      group_name: group.name,
      modifier_id: mod.id,
      name: mod.name,
      price_adjustment: mod.price_adjustment
    })
  } else {
    // Selección múltiple
    const index = selectedModifiers.value.findIndex(m => m.group_id === group.id && m.modifier_id === mod.id)
    if (index >= 0) {
      selectedModifiers.value.splice(index, 1)
    } else {
      // Verificar límite
      const countInGroup = selectedModifiers.value.filter(m => m.group_id === group.id).length
      if (group.selection_limit > 0 && countInGroup >= group.selection_limit) {
        alert(`Solo puedes seleccionar hasta ${group.selection_limit} opciones en ${group.name}.`)
        return
      }
      selectedModifiers.value.push({
        group_id: group.id,
        group_name: group.name,
        modifier_id: mod.id,
        name: mod.name,
        price_adjustment: mod.price_adjustment
      })
    }
  }
}

function confirmAddWithModifiers() {
  if (posStore.selectedProductForModifiers) {
    posStore.addProductToCart(posStore.selectedProductForModifiers, selectedModifiers.value)
  }
  posStore.isModifierModalOpen = false
}
</script>
