<template>
  <div class="h-full flex bg-slate-50 overflow-hidden">
    <!-- Panel Izquierdo: Catálogo de Productos -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">
      <!-- Search & Category Header -->
      <div class="bg-white border-b border-slate-200/80 p-2.5 sm:p-4 space-y-2 sm:space-y-3 shrink-0">
        <!-- Search input -->
        <div class="relative">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="productStore.searchQuery"
            type="text"
            placeholder="Buscar producto..."
            class="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-100 border border-transparent rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
          />
        </div>

        <!-- Categorías Pills -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <button
            @click="productStore.selectedCategoryId = 'all'"
            class="px-3 sm:px-4 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all shrink-0 active:scale-95"
            :class="productStore.selectedCategoryId === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            Todos
          </button>

          <button
            v-for="cat in productStore.categories"
            :key="cat.id"
            @click="productStore.selectedCategoryId = cat.id"
            class="px-3 sm:px-4 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all shrink-0 active:scale-95"
            :class="productStore.selectedCategoryId === cat.id
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Grid de Productos -->
      <div class="flex-1 p-2.5 sm:p-5 overflow-y-auto pb-24 md:pb-6">
        <div v-if="productStore.isLoading" class="h-full flex items-center justify-center text-slate-400 text-sm">
          Cargando catálogo...
        </div>

        <div v-else-if="productStore.filteredProducts.length === 0" class="h-full flex items-center justify-center text-slate-400 text-xs sm:text-sm">
          No se encontraron productos en esta categoría.
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          <ProductCard
            v-for="prod in productStore.filteredProducts"
            :key="prod.id"
            :product="prod"
            @select="handleProductSelect"
          />
        </div>
      </div>

      <!-- Botón Flotante Móvil para Ver Pedido / Comanda -->
      <div v-if="posStore.itemsCount > 0" class="md:hidden fixed bottom-[60px] left-3 right-3 z-30">
        <button
          @click="posStore.openMobileCart()"
          class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-300 font-extrabold flex items-center justify-between text-xs sm:text-sm transition-all active:scale-95"
        >
          <div class="flex items-center gap-2">
            <ShoppingBag class="w-4 h-4" />
            <span>{{ (posStore.activeTableId && posStore.currentOrder) ? 'Ver Pedido Actual' : 'Ver Comanda' }} ({{ posStore.itemsCount }})</span>
          </div>
          <span class="font-black font-heading text-sm sm:text-base">S/. {{ posStore.totalAmount.toFixed(2) }}</span>
        </button>
      </div>
    </div>

    <!-- Panel Derecho: Carrito de Compras -->
    <CartPanel
      :is-mobile-open="posStore.isMobileCartOpen"
      @close-mobile="posStore.closeMobileCart()"
    />

    <!-- Modales POS -->
    <ModifierModal />
    <PaymentModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useProductStore } from '@/stores/productStore'
import { usePosStore } from '@/stores/posStore'
import { Product } from '@shared/types/product'
import ProductCard from '@/components/pos/ProductCard.vue'
import CartPanel from '@/components/pos/CartPanel.vue'
import ModifierModal from '@/components/pos/ModifierModal.vue'
import PaymentModal from '@/components/pos/PaymentModal.vue'
import { Search, ShoppingBag } from 'lucide-vue-next'

const productStore = useProductStore()
const posStore = usePosStore()

onMounted(async () => {
  await productStore.loadCatalog()
})

function handleProductSelect(product: Product) {
  posStore.addProductToCart(product)
}
</script>
