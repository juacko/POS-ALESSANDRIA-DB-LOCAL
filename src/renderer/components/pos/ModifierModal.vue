<template>
  <Modal
    :is-open="posStore.isModifierModalOpen"
    :title="posStore.editingCartItemIndex !== null ? `Editar Opciones de ${posStore.selectedProductForModifiers?.name || ''}` : `Opciones para ${posStore.selectedProductForModifiers?.name || ''}`"
    max-width="lg"
    @close="handleClose"
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
              <span class="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <span>{{ mod.name }}</span>
                <span v-if="mod.is_default === 1" class="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded border border-amber-200" title="Opción predeterminada">
                  📌
                </span>
              </span>
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
        @click="handleClose"
        class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
      >
        Cancelar
      </button>
      <button
        @click="confirmAddWithModifiers"
        class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all"
      >
        {{ posStore.editingCartItemIndex !== null ? 'Actualizar Opciones' : 'Agregar a la Orden' }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePosStore } from '@/stores/posStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { ModifierGroup, ModifierOption } from '@shared/types/product'
import { SelectedModifier } from '@shared/types/order'
import { api } from '@/api'
import Modal from '@/components/common/Modal.vue'
import { SlidersHorizontal } from 'lucide-vue-next'

const posStore = usePosStore()
const notificationStore = useNotificationStore()
const selectedModifiers = ref<SelectedModifier[]>([])

watch(() => posStore.isModifierModalOpen, (isOpen) => {
  if (isOpen) {
    if (posStore.editingCartItemIndex !== null && posStore.initialModifiersForEdit.length > 0) {
      selectedModifiers.value = [...posStore.initialModifiersForEdit]
    } else {
      selectedModifiers.value = []
      if (posStore.selectedProductForModifiers?.modifier_groups) {
        for (const group of posStore.selectedProductForModifiers.modifier_groups) {
          if (!group.modifiers || group.modifiers.length === 0) continue

          if (group.selection_mode === 'single') {
            const defaultMod = group.modifiers.find(m => m.is_default === 1) || group.modifiers[0]
            if (defaultMod) {
              selectedModifiers.value.push({
                group_id: group.id,
                group_name: group.name,
                modifier_id: defaultMod.id,
                name: defaultMod.name,
                price_adjustment: defaultMod.price_adjustment
              })
            }
          } else {
            // Para selecciones múltiples, preseleccionar opciones marcadas con pin default
            const defaultMods = group.modifiers.filter(m => m.is_default === 1)
            const limit = group.selection_limit > 0 ? group.selection_limit : defaultMods.length
            for (const defMod of defaultMods.slice(0, limit)) {
              selectedModifiers.value.push({
                group_id: group.id,
                group_name: group.name,
                modifier_id: defMod.id,
                name: defMod.name,
                price_adjustment: defMod.price_adjustment
              })
            }
          }
        }
      }
    }
  }
})

function handleClose() {
  posStore.isModifierModalOpen = false
  posStore.editingCartItemIndex = null
  posStore.initialModifiersForEdit = []
}

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
        notificationStore.warning('Límite alcanzado', `Solo puedes seleccionar hasta ${group.selection_limit} opciones en ${group.name}.`)
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

async function confirmAddWithModifiers() {
  const prod = posStore.selectedProductForModifiers
  if (!prod) {
    handleClose()
    return
  }

  if (posStore.editingCartItemIndex !== null) {
    const idx = posStore.editingCartItemIndex
    const item = posStore.cartItems[idx]
    if (item) {
      // Recalcular precio unitario y final
      const modTotal = selectedModifiers.value.reduce((sum, m) => sum + m.price_adjustment, 0)
      const newUnitPrice = prod.base_price + modTotal
      
      item.selected_modifiers = [...selectedModifiers.value]
      item.modifiers_detail = JSON.stringify(selectedModifiers.value)
      item.unit_price = newUnitPrice
      item.final_price = newUnitPrice * item.quantity

      // Si este item ya está guardado en una orden activa en DB, persistir cambio
      if (posStore.currentOrder && item.id) {
        try {
          await api.updateOrderItemModifiers({
            orderId: posStore.currentOrder.id,
            itemId: item.id,
            selectedModifiers: selectedModifiers.value,
            newUnitPrice
          })
          notificationStore.success('Opciones actualizadas', `Se actualizaron las opciones de ${item.product_name}.`)
        } catch (err: any) {
          notificationStore.error('Error al guardar opciones', err.message || 'No se pudo actualizar en el servidor')
        }
      }
    }
  } else {
    posStore.addProductToCart(prod, selectedModifiers.value, true)
  }

  handleClose()
}
</script>
