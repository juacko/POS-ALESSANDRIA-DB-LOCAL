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

  async function createProduct(product: Partial<Product>, modifierGroupIds: string[]) {
    await api.createProduct({ product, modifierGroupIds })
    await loadCatalog()
  }

  async function updateProduct(id: string, product: Partial<Product>, modifierGroupIds?: string[]) {
    await api.updateProduct({ id, product, modifierGroupIds })
    await loadCatalog()
  }

  async function toggleProductActive(id: string, active: number) {
    await api.toggleProductActive({ id, active })
    await loadCatalog()
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
    createProduct,
    updateProduct,
    toggleProductActive
  }
})
