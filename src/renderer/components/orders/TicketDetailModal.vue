<template>
  <Modal
    :is-open="isOpen"
    :title="`Detalle de Orden #${order?.order_number || ''}`"
    max-width="lg"
    @close="$emit('close')"
  >
    <template #icon>
      <Receipt class="w-5 h-5 text-indigo-600" />
    </template>

    <div v-if="order" class="space-y-4">
      <!-- Datos Generales -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ubicación</span>
          <span class="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
            <Zap v-if="order.table_number === 'RAPIDO'" class="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <UtensilsCrossed v-else class="w-3.5 h-3.5 text-indigo-500" />
            {{ order.table_number === 'RAPIDO' ? 'Pedido Rápido' : `Mesa ${order.table_number}` }}
          </span>
        </div>

        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado</span>
          <span
            class="inline-block mt-0.5 px-2 py-0.5 rounded-full font-black text-[11px]"
            :class="order.status === 'Pagada'
              ? 'bg-emerald-100 text-emerald-800'
              : (order.status === 'Cancelada' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')"
          >
            {{ order.status }}
          </span>
        </div>

        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Atendido por</span>
          <span class="font-bold text-slate-700 block mt-0.5 truncate">
            {{ order.user_name || 'Personal' }}
          </span>
        </div>

        <div>
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fecha / Hora</span>
          <span class="font-semibold text-slate-600 block mt-0.5 text-[11px]">
            {{ order.created_at }}
          </span>
        </div>
      </div>

      <!-- Lista de Ítems / Productos -->
      <div>
        <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Productos de la Comanda</span>
          <span class="text-[11px] font-normal text-slate-400">{{ order.items?.length || 0 }} ítems</span>
        </h4>

        <div class="border border-slate-200/90 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
          <div
            v-for="(item, idx) in order.items"
            :key="item.id || idx"
            class="p-3 flex items-start justify-between gap-3 text-xs"
          >
            <div class="flex items-start gap-2.5 flex-1 min-w-0">
              <span class="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-black text-xs shrink-0">
                {{ item.quantity }}x
              </span>

              <div class="min-w-0">
                <p class="font-bold text-slate-800">{{ item.product_name }}</p>

                <!-- Variantes / Modificadores -->
                <div v-if="item.selected_modifiers && item.selected_modifiers.length > 0" class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="mod in item.selected_modifiers"
                    :key="mod.modifier_id"
                    class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                  >
                    {{ mod.name }}
                    <strong v-if="mod.price_adjustment > 0" class="text-indigo-600 font-bold ml-0.5">
                      (+S/. {{ mod.price_adjustment.toFixed(2) }})
                    </strong>
                  </span>
                </div>
                <p v-else-if="item.modifiers_detail" class="text-[11px] text-slate-400 italic mt-0.5">
                  {{ item.modifiers_detail }}
                </p>

                <!-- Estado de Servido -->
                <div class="mt-1">
                  <span
                    v-if="item.is_served === 1"
                    class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                  >
                    <Check class="w-3 h-3 text-emerald-600" /> Servido
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
                  >
                    Pendiente por servir
                  </span>
                </div>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="text-xs font-bold text-slate-800 block">
                S/. {{ item.final_price.toFixed(2) }}
              </span>
              <span v-if="item.quantity > 1" class="text-[10px] text-slate-400 block">
                (S/. {{ item.unit_price.toFixed(2) }} c/u)
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Desglose de Pagos -->
      <div class="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-600">Total de la Orden:</span>
          <span class="text-lg font-black text-slate-900 font-heading">
            S/. {{ order.total_amount.toFixed(2) }}
          </span>
        </div>

        <div v-if="order.status === 'Pagada'" class="border-t border-slate-200/80 pt-2.5 space-y-1.5">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Métodos de Pago Utilizados:
          </span>

          <div v-if="!order.payments || order.payments.length === 0" class="text-xs text-slate-500 italic">
            Pago registrado en caja.
          </div>

          <div v-else class="space-y-1.5">
            <div
              v-for="pay in order.payments"
              :key="pay.id"
              class="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-white border border-slate-200"
            >
              <div class="flex items-center gap-2">
                <span
                  class="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  :class="pay.payment_method === 'Efectivo'
                    ? 'bg-emerald-100 text-emerald-700'
                    : (pay.payment_method === 'Tarjeta' ? 'bg-sky-100 text-sky-700' : 'bg-purple-100 text-purple-700')"
                >
                  <DollarSign v-if="pay.payment_method === 'Efectivo'" class="w-3.5 h-3.5" />
                  <CreditCard v-else-if="pay.payment_method === 'Tarjeta'" class="w-3.5 h-3.5" />
                  <Smartphone v-else class="w-3.5 h-3.5" />
                </span>
                <span class="font-bold text-slate-800">{{ pay.payment_method }}</span>
                <span class="text-[10px] text-slate-400">{{ pay.timestamp }}</span>
              </div>

              <span class="font-extrabold text-slate-900 font-heading">
                S/. {{ pay.amount.toFixed(2) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        @click="$emit('close')"
        class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
      >
        Cerrar
      </button>

      <button
        v-if="order?.status === 'Abierta'"
        @click="$emit('manage', order)"
        class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5"
      >
        <span>Gestionar / Cobrar</span>
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { Order } from '@shared/types/order'
import Modal from '@/components/common/Modal.vue'
import {
  Receipt,
  Zap,
  UtensilsCrossed,
  Check,
  DollarSign,
  CreditCard,
  Smartphone
} from 'lucide-vue-next'

defineProps<{
  isOpen: boolean
  order: Order | null
}>()

defineEmits(['close', 'manage'])
</script>
