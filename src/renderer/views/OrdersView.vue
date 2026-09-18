<template>
  <div class="h-full flex flex-col bg-slate-50 overflow-hidden">
    <div class="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-900 font-heading">Historial de Órdenes</h2>
        <p class="text-xs text-slate-400">Listado de pedidos registrados y estado de cobranza</p>
      </div>

      <button
        @click="loadOrders"
        class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
      >
        Actualizar Lista
      </button>
    </div>

    <div class="flex-1 p-3 sm:p-6 overflow-y-auto pb-20 md:pb-16">
      <div v-if="isLoading" class="text-center py-10 text-slate-400 text-sm">
        Cargando órdenes...
      </div>

      <div v-else-if="orders.length === 0" class="text-center py-10 text-slate-400 text-sm">
        No se registran órdenes recientes.
      </div>

      <div v-else class="space-y-3">
        <!-- Vista Móvil: Lista de Tarjetas Limpias -->
        <div class="md:hidden space-y-2.5">
          <div
            v-for="ord in orders"
            :key="ord.id"
            class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm flex items-center justify-between"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-black text-slate-900 font-heading">#{{ ord.order_number }}</span>
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  :class="ord.status === 'Pagada'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'"
                >
                  {{ ord.status }}
                </span>
              </div>
              <p class="text-xs font-semibold text-slate-700 mt-1 flex items-center gap-1">
                <Zap v-if="ord.table_number === 'RAPIDO'" class="w-3 h-3 text-amber-500 fill-amber-500" />
                {{ ord.table_number === 'RAPIDO' ? 'Pedido Rápido' : `Mesa ${ord.table_number}` }}
              </p>
              <span class="text-[10px] text-slate-400 block mt-0.5">{{ ord.created_at }}</span>
            </div>

            <div class="text-right">
              <span class="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">Total</span>
              <span class="text-base font-black text-indigo-600 font-heading">
                S/. {{ ord.total_amount.toFixed(2) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Vista Desktop: Tabla Tradicional -->
        <div class="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase font-extrabold text-slate-400">
                <th class="py-3 px-4">Orden #</th>
                <th class="py-3 px-4">Mesa / Ubicación</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4">Monto Total</th>
                <th class="py-3 px-4">Fecha / Hora</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              <tr v-for="ord in orders" :key="ord.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-4 font-extrabold text-slate-900 font-heading">
                  #{{ ord.order_number }}
                </td>
                <td class="py-3 px-4 font-semibold text-slate-700">
                  <span class="inline-flex items-center gap-1">
                    <Zap v-if="ord.table_number === 'RAPIDO'" class="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {{ ord.table_number === 'RAPIDO' ? 'Pedido Rápido' : `Mesa ${ord.table_number}` }}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <span
                    class="px-2.5 py-1 rounded-full text-xs font-bold"
                    :class="ord.status === 'Pagada'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'"
                  >
                    {{ ord.status }}
                  </span>
                </td>
                <td class="py-3 px-4 font-black text-slate-900 font-heading">
                  S/. {{ ord.total_amount.toFixed(2) }}
                </td>
                <td class="py-3 px-4 text-xs text-slate-400 font-medium">
                  {{ ord.created_at }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Order } from '@shared/types/order'
import { api } from '@/api'
import { Zap } from 'lucide-vue-next'

const orders = ref<Order[]>([])
const isLoading = ref(false)

onMounted(async () => {
  await loadOrders()
})

async function loadOrders() {
  isLoading.value = true
  try {
    orders.value = await api.getOrdersHistory(50)
  } catch (e) {
    console.error('Error al cargar historial de órdenes', e)
  } finally {
    isLoading.value = false
  }
}
</script>
