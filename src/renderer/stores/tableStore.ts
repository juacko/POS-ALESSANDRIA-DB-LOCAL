import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Table } from '@shared/types/table'
import { api } from '@/api'

export const useTableStore = defineStore('tables', () => {
  const tables = ref<Table[]>([])
  const selectedZone = ref<string>('all')
  const activeTable = ref<Table | null>(null)
  const isLoading = ref<boolean>(false)

  async function loadTables(silent = false) {
    if (!silent) isLoading.value = true
    try {
      tables.value = await api.getTables()
    } catch (e) {
      console.error('Error al cargar mesas', e)
    } finally {
      if (!silent) isLoading.value = false
    }
  }

  const zones = computed(() => {
    const list = new Set(tables.value.map(t => t.zone))
    return Array.from(list)
  })

  const filteredTables = computed(() => {
    if (selectedZone.value === 'all') return tables.value
    return tables.value.filter(t => t.zone === selectedZone.value)
  })

  function selectTable(table: Table) {
    activeTable.value = table
  }

  return {
    tables,
    zones,
    selectedZone,
    activeTable,
    isLoading,
    filteredTables,
    loadTables,
    selectTable
  }
})
