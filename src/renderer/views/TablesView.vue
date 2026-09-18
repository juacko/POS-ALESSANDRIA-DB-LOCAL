<template>
  <div class="h-full flex flex-col bg-slate-50 overflow-hidden">
    <!-- Top Filter Bar por Zonas -->
    <div class="bg-white border-b border-slate-200/80 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 shrink-0">
      <div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 flex-1">
        <button
          @click="tableStore.selectedZone = 'all'"
          class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95"
          :class="tableStore.selectedZone === 'all'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          Todas
        </button>

        <button
          v-for="zone in tableStore.zones"
          :key="zone"
          @click="tableStore.selectedZone = zone"
          class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95"
          :class="tableStore.selectedZone === zone
            ? 'bg-slate-900 text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          {{ zone }}
        </button>
      </div>

      <!-- Leyenda de Estados Compacta -->
      <div class="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-medium text-slate-500 shrink-0">
        <div class="flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span class="hidden xs:inline">Libre</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          <span class="hidden xs:inline">Ocupada</span>
        </div>
      </div>
    </div>

    <!-- Grid de Mesas -->
    <div class="flex-1 p-3 sm:p-6 overflow-y-auto pb-20 md:pb-16">
      <div v-if="tableStore.isLoading" class="h-full flex items-center justify-center text-slate-400 text-sm">
        Cargando salón...
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5">
        <TableCard
          v-for="table in tableStore.filteredTables"
          :key="table.id"
          :table="table"
          @select="handleSelectTable"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTableStore } from '@/stores/tableStore'
import { usePosStore } from '@/stores/posStore'
import { Table } from '@shared/types/table'
import TableCard from '@/components/tables/TableCard.vue'

const router = useRouter()
const tableStore = useTableStore()
const posStore = usePosStore()

onMounted(async () => {
  await tableStore.loadTables()
})

async function handleSelectTable(table: Table) {
  tableStore.selectTable(table)
  await posStore.loadOrderForTable(table.id, table.name)
  router.push('/pos')
}
</script>
