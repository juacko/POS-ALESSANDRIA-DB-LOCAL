import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Product, Category, ModifierGroup } from '@shared/types/product'
import { api } from '@/api'

export const useProductStore = defineStore('products', () => {
  const categories = ref<Category[]>([])
  const products = ref<Product[]>([])
  const modifierGroups = ref<ModifierGroup[]>([])
  const selectedCategoryId = ref<string>('all')
  const searchQuery = ref<string>('')
  const isLoading = ref<boolean>(false)

  async function loadCatalog() {
    isLoading.value = true
    try {
      categories.value = await api.getCategories()
      products.value = await api.getProducts(true)
      modifierGroups.value = await api.getModifierGroups()
    } catch (e) {
      console.error('Error al cargar catálogo', e)
    } finally {
      isLoading.value = false
    }
  }

  const filteredProducts = computed(() => {
    return products.value.filter(p => {
      const matchCat = selectedCategoryId.value === 'all' || p.category_id === selectedCategoryId.value
      const matchSearch = searchQuery.value.trim() === '' || p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
      return matchCat && matchSearch
    })
  })

  async function createProduct(product: Partial<Product>, modifierGroups: (string | any)[]) {
    await api.createProduct({ product, modifierGroups })
    await loadCatalog()
  }

  async function updateProduct(id: string, product: Partial<Product>, modifierGroups?: (string | any)[]) {
    await api.updateProduct({ id, product, modifierGroups })
    await loadCatalog()
  }

  async function toggleProductActive(id: string, active: number) {
    await api.toggleProductActive({ id, active })
    await loadCatalog()
  }

  // Acciones de Modificadores y Variantes
  async function createModifierGroup(data: { name: string; selection_mode: 'single' | 'multiple_unlimited' | 'multiple_limited'; selection_limit?: number }) {
    const created = await api.createModifierGroup(data)
    await loadCatalog()
    return created
  }

  async function updateModifierGroup(id: string, data: { name: string; selection_mode: 'single' | 'multiple_unlimited' | 'multiple_limited'; selection_limit?: number }) {
    const updated = await api.updateModifierGroup({ id, ...data })
    await loadCatalog()
    return updated
  }

  async function deleteModifierGroup(id: string) {
    const success = await api.deleteModifierGroup({ id })
    await loadCatalog()
    return success
  }

  async function duplicateModifierGroup(id: string, name?: string) {
    const duplicated = await api.duplicateModifierGroup({ id, name })
    await loadCatalog()
    return duplicated
  }

  async function createModifierOption(data: { group_id: string; name: string; price_adjustment: number; is_default?: number }) {
    const created = await api.createModifierOption(data)
    await loadCatalog()
    return created
  }

  async function updateModifierOption(id: string, data: { name: string; price_adjustment: number; is_default?: number }) {
    const updated = await api.updateModifierOption({ id, ...data })
    await loadCatalog()
    return updated
  }

  async function setDefaultModifierOption(groupId: string, optionId: string) {
    const success = await api.setDefaultModifierOption({ groupId, optionId })
    await loadCatalog()
    return success
  }

  async function deleteModifierOption(id: string) {
    const success = await api.deleteModifierOption({ id })
    await loadCatalog()
    return success
  }

  // Acciones de Categorías
  async function createCategory(data: { name: string; display_order?: number }) {
    const created = await api.createCategory(data)
    await loadCatalog()
    return created
  }

  async function updateCategory(id: string, data: { name: string; display_order?: number }) {
    const updated = await api.updateCategory({ id, ...data })
    await loadCatalog()
    return updated
  }

  async function deleteCategory(id: string) {
    const success = await api.deleteCategory({ id })
    await loadCatalog()
    return success
  }

  return {
    categories,
    products,
    modifierGroups,
    selectedCategoryId,
    searchQuery,
    isLoading,
    filteredProducts,
    loadCatalog,
    createCategory,
    updateCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    toggleProductActive,
    createModifierGroup,
    updateModifierGroup,
    deleteModifierGroup,
    duplicateModifierGroup,
    createModifierOption,
    updateModifierOption,
    setDefaultModifierOption,
    deleteModifierOption
  }
})
