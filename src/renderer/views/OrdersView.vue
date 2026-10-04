<template>
  <div class="h-full flex flex-col bg-slate-50 overflow-hidden">
    <!-- Header Principal -->
    <div class="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-lg sm:text-xl font-bold text-slate-900 font-heading">Control de Órdenes</h2>
          <span
            v-if="activeOrders.length > 0"
            class="px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse"
          >
            {{ activeOrders.length }} activas
          </span>
        </div>
        <p class="text-xs text-slate-400">Monitor de despacho en cocina/barra y trazabilidad histórica</p>
      </div>

      <!-- Selector de Pestañas y Actualizar -->
      <div class="flex items-center gap-2">
        <div class="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            @click="activeTab = 'active'"
            class="px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            :class="activeTab === 'active'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'"
          >
            <Zap class="w-3.5 h-3.5" :class="activeTab === 'active' ? 'text-amber-500 fill-amber-500' : ''" />
            <span>Pedidos Activos</span>
            <span
              v-if="activeOrders.length > 0"
              class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black"
              :class="activeTab === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'"
            >
              {{ activeOrders.length }}
            </span>
          </button>

          <button
            @click="activeTab = 'history'"
            class="px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            :class="activeTab === 'history'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'"
          >
            <Receipt class="w-3.5 h-3.5 text-slate-400" />
            <span>Historial Completo</span>
          </button>
        </div>

        <button
          @click="loadData"
          class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
          title="Actualizar Órdenes"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        </button>
      </div>
    </div>

    <!-- ==================== PESTAÑA 1: MONITOR DE PEDIDOS ACTIVOS ==================== -->
    <div v-if="activeTab === 'active'" class="flex-1 flex flex-col overflow-hidden">
      <!-- Barra superior de filtros rápidos de activos -->
      <div class="bg-white/70 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs shrink-0 flex-wrap">
        <div class="flex items-center gap-1.5">
          <span class="text-slate-400 font-semibold mr-1">Filtrar:</span>
          <button
            @click="activeLocationFilter = 'all'"
            class="px-2.5 py-1 rounded-lg font-bold transition-colors"
            :class="activeLocationFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            Todos ({{ activeOrders.length }})
          </button>
          <button
            @click="activeLocationFilter = 'tables'"
            class="px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1"
            :class="activeLocationFilter === 'tables' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            <UtensilsCrossed class="w-3 h-3" />
            Mesas ({{ activeTablesCount }})
          </button>
          <button
            @click="activeLocationFilter = 'quick'"
            class="px-2.5 py-1 rounded-lg font-bold transition-colors flex items-center gap-1"
            :class="activeLocationFilter === 'quick' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            <Zap class="w-3 h-3" />
            Rápidos ({{ activeQuickCount }})
          </button>
        </div>

        <div class="text-[11px] text-slate-500 flex items-center gap-1">
          <Clock class="w-3.5 h-3.5 text-indigo-500" />
          <span>Haz clic en <strong>[ ✓ ]</strong> para marcar cada producto servido</span>
        </div>
      </div>

      <!-- Contenedor Principal de Cards -->
      <div class="flex-1 p-3 sm:p-6 overflow-y-auto pb-20 md:pb-16">
        <div v-if="isLoading && activeOrders.length === 0" class="text-center py-16 text-slate-400 text-sm">
          Cargando pedidos activos...
        </div>

        <div v-else-if="filteredActiveOrders.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
          <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 class="w-8 h-8" />
          </div>
          <h3 class="text-base font-bold text-slate-800">¡Todo al día y servido!</h3>
          <p class="text-xs text-slate-400 max-w-sm mt-1">
            No hay comandas activas pendientes en este momento. Las nuevas órdenes enviadas desde mesas o pedidos rápidos aparecerán aquí automáticamente en tiempo real.
          </p>
        </div>

        <!-- Grid de Cards de Pedidos Activos -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div
            v-for="ord in filteredActiveOrders"
            :key="ord.id"
            class="bg-white rounded-2xl border transition-all duration-200 shadow-sm flex flex-col justify-between overflow-hidden"
            :class="getServedProgress(ord).allServed
              ? 'border-emerald-300 ring-2 ring-emerald-100'
              : 'border-slate-200/90 hover:border-indigo-300'"
          >
            <!-- Cabecera de la Card -->
            <div class="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-2">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Badge Ubicación (Primero y Destacado) -->
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black shadow-2xs"
                    :class="ord.table_number === 'RAPIDO'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-indigo-100 text-indigo-900 border border-indigo-200'"
                  >
                    <Zap v-if="ord.table_number === 'RAPIDO'" class="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                    <UtensilsCrossed v-else class="w-3.5 h-3.5 text-indigo-600" />
                    {{ formatTableDisplay(ord.table_number) }}
                  </span>

                  <!-- # de Orden (Secundario en Gris) -->
                  <span class="text-xs font-bold text-slate-400 font-mono tracking-tight">
                    #{{ ord.order_number }}
                  </span>
                </div>

                <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span class="flex items-center gap-0.5 font-medium truncate max-w-[130px]">
                    <User class="w-3 h-3 text-slate-400" />
                    {{ ord.user_name || 'Personal' }}
                  </span>
                  <span>•</span>
                  <span class="flex items-center gap-0.5 font-semibold" :class="getElapsedAlertClass(ord.created_at)">
                    <Clock class="w-3 h-3" />
                    {{ formatElapsedTime(ord.created_at) }}
                  </span>
                </div>
              </div>

              <!-- Estado General de la Comanda -->
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-black shrink-0"
                :class="getServedProgress(ord).allServed
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'"
              >
                {{ getServedProgress(ord).allServed ? 'Listo para servir' : 'En preparación' }}
              </span>
            </div>

            <!-- Cuerpo: Lista de Productos y Comprobación de Servido -->
            <div class="p-3.5 space-y-2 flex-1 max-h-80 overflow-y-auto">
              <div
                v-for="item in ord.items"
                :key="item.id"
                class="p-2.5 rounded-xl border transition-all flex items-start gap-2.5"
                :class="item.is_served === 1
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'"
              >
                <!-- Botón de Check Interactivo para Servir -->
                <button
                  @click="handleToggleItemServed(item)"
                  class="mt-0.5 p-1 rounded-lg transition-transform active:scale-90 shrink-0"
                  :class="item.is_served === 1
                    ? 'text-emerald-600 bg-white border border-emerald-300'
                    : 'text-slate-300 hover:text-emerald-500 bg-white border border-slate-200'"
                  :title="item.is_served === 1 ? 'Marcar como pendiente' : 'Marcar como servido'"
                >
                  <CheckCircle2 v-if="item.is_served === 1" class="w-4 h-4 fill-emerald-500 text-white" />
                  <Circle v-else class="w-4 h-4" />
                </button>

                <!-- Detalle del Producto -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline justify-between gap-1">
                    <p
                      class="text-xs font-bold leading-tight"
                      :class="item.is_served === 1 ? 'line-through text-slate-400' : 'text-slate-800'"
                    >
                      <span class="text-indigo-600 font-extrabold mr-1">{{ item.quantity }}x</span>
                      {{ item.product_name }}
                    </p>
                    <span class="text-[11px] font-bold text-slate-700 shrink-0">
                      S/. {{ item.final_price.toFixed(2) }}
                    </span>
                  </div>

                  <!-- Variantes / Sabores / Modificadores -->
                  <div v-if="item.selected_modifiers && item.selected_modifiers.length > 0" class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="mod in item.selected_modifiers"
                      :key="mod.modifier_id"
                      class="px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600 text-[10px] font-semibold"
                    >
                      {{ mod.name }}
                      <span v-if="mod.price_adjustment > 0" class="text-indigo-600 font-bold">
                        (+S/.{{ mod.price_adjustment.toFixed(2) }})
                      </span>
                    </span>
                  </div>
                  <p v-else-if="item.modifiers_detail" class="text-[10px] text-slate-500 italic mt-0.5">
                    {{ item.modifiers_detail }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Progreso de la Comanda -->
            <div class="px-3.5 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2 flex-1 mr-3">
                <div class="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-emerald-500 transition-all duration-300"
                    :style="{ width: `${getServedProgress(ord).percentage}%` }"
                  />
                </div>
                <span class="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                  {{ getServedProgress(ord).servedCount }}/{{ getServedProgress(ord).totalCount }} servidos
                </span>
              </div>

              <button
                v-if="!getServedProgress(ord).allServed"
                @click="handleMarkAllServed(ord)"
                class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap"
              >
                Servir Todo ✓
              </button>
              <span v-else class="text-[11px] font-black text-emerald-600 whitespace-nowrap">
                Todo servido ✓
              </span>
            </div>

            <!-- Pie de Card: Total y Acción Rápida -->
            <div class="p-3 bg-white border-t border-slate-200/90 flex items-center justify-between gap-3">
              <div>
                <span class="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">Total</span>
                <span class="text-base font-black text-slate-900 font-heading">
                  S/. {{ ord.total_amount.toFixed(2) }}
                </span>
              </div>

              <div class="flex items-center gap-1.5">
                <button
                  @click="openCancelActiveOrderModal(ord)"
                  class="p-2 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Anular Pedido Activo"
                >
                  <Trash2 class="w-4 h-4" />
                </button>

                <button
                  @click="openDetailModal(ord)"
                  class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Ver Ticket Detallado"
                >
                  <Eye class="w-4 h-4" />
                </button>

                <button
                  @click="handleManageOrder(ord)"
                  class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 transition-all flex items-center gap-1 active:scale-95"
                >
                  <span>Cobrar / Mesa</span>
                  <Zap class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== PESTAÑA 2: HISTORIAL COMPLETO DE ÓRDENES ==================== -->
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <!-- Filtros Automáticos y Búsqueda -->
      <div class="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <!-- Chips de Estado -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            @click="selectedStatusFilter = 'all'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
            :class="selectedStatusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
          >
            <span>Todos</span>
            <span class="px-1.5 py-0.2 rounded-md text-[10px]" :class="selectedStatusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'">
              {{ historyOrders.length }}
            </span>
          </button>

          <button
            @click="selectedStatusFilter = 'Abierta'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
            :class="selectedStatusFilter === 'Abierta'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'"
          >
            <span>🟡 Abiertas</span>
            <span class="px-1.5 py-0.2 rounded-md text-[10px]" :class="selectedStatusFilter === 'Abierta' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900'">
              {{ countByStatus.open }}
            </span>
          </button>

          <button
            @click="selectedStatusFilter = 'Pagada'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
            :class="selectedStatusFilter === 'Pagada'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'"
          >
            <span>🟢 Pagadas</span>
            <span class="px-1.5 py-0.2 rounded-md text-[10px]" :class="selectedStatusFilter === 'Pagada' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-900'">
              {{ countByStatus.paid }}
            </span>
          </button>

          <button
            v-if="countByStatus.cancelled > 0"
            @click="selectedStatusFilter = 'Cancelada'"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
            :class="selectedStatusFilter === 'Cancelada'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'"
          >
            <span>🔴 Canceladas</span>
            <span class="px-1.5 py-0.2 rounded-md text-[10px]" :class="selectedStatusFilter === 'Cancelada' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-900'">
              {{ countByStatus.cancelled }}
            </span>
          </button>
        </div>

        <!-- Filtro Canal y Buscador -->
        <div class="flex items-center gap-2">
          <!-- Selector de Ubicación -->
          <select
            v-model="selectedLocationFilter"
            class="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas las Ubicaciones</option>
            <option value="tables">Solo Mesas de Salón</option>
            <option value="quick">Solo Pedidos Rápidos</option>
          </select>

          <!-- Input de Búsqueda -->
          <div class="relative w-44 sm:w-56">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar # orden o mesa..."
              class="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <!-- Tabla / Lista de Historial -->
      <div class="flex-1 p-3 sm:p-6 overflow-y-auto pb-20 md:pb-16">
        <div v-if="isLoading && historyOrders.length === 0" class="text-center py-10 text-slate-400 text-sm">
          Cargando historial de órdenes...
        </div>

        <div v-else-if="filteredHistoryOrders.length === 0" class="text-center py-10 text-slate-400 text-sm">
          No se encontraron órdenes con los filtros seleccionados.
        </div>

        <div v-else class="space-y-3">
          <!-- Vista Móvil: Tarjetas Detalladas con Pagos -->
          <div class="md:hidden space-y-2.5">
            <div
              v-for="ord in filteredHistoryOrders"
              :key="ord.id"
              class="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm space-y-2.5"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Mesa de primero -->
                  <span class="font-black text-slate-900 font-heading flex items-center gap-1 text-sm">
                    <Zap v-if="ord.table_number === 'RAPIDO'" class="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <UtensilsCrossed v-else class="w-3.5 h-3.5 text-indigo-500" />
                    {{ formatTableDisplay(ord.table_number) }}
                  </span>

                  <!-- # de orden secundario en gris -->
                  <span class="text-xs font-bold text-slate-400 font-mono">#{{ ord.order_number }}</span>

                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    :class="ord.status === 'Pagada'
                      ? 'bg-emerald-100 text-emerald-800'
                      : (ord.status === 'Cancelada' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')"
                  >
                    {{ ord.status }}
                  </span>
                </div>

                <span class="text-base font-black text-indigo-600 font-heading shrink-0">
                  S/. {{ ord.total_amount.toFixed(2) }}
                </span>
              </div>

              <!-- Motivo de cancelación en móvil si aplica -->
              <div v-if="ord.status === 'Cancelada' && ord.cancellation_reason" class="p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                <span class="font-bold">Motivo:</span> {{ ord.cancellation_reason }}
              </div>

              <div class="flex items-center justify-between text-xs text-slate-500">
                <span class="truncate">{{ ord.user_name || 'Personal' }}</span>
                <span class="text-[11px] text-slate-400 shrink-0">{{ ord.created_at }}</span>
              </div>

              <!-- Métodos de Pago en Móvil -->
              <div v-if="ord.status === 'Pagada'" class="pt-2 border-t border-slate-100">
                <div class="flex items-center justify-between gap-1 flex-wrap">
                  <span class="text-[10px] font-bold text-slate-400 uppercase">Pago:</span>

                  <!-- Desglose de Pagos -->
                  <div class="flex items-center gap-1 flex-wrap">
                    <template v-if="ord.payments && ord.payments.length > 0">
                      <span
                        v-if="ord.payments.length > 1"
                        class="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200"
                      >
                        🔀 Mixto
                      </span>
                      <span
                        v-for="pay in ord.payments"
                        :key="pay.id"
                        class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        :class="pay.payment_method === 'Efectivo'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : (pay.payment_method === 'Tarjeta' ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-purple-50 text-purple-800 border border-purple-200')"
                      >
                        <strong>{{ pay.payment_method }}:</strong> S/. {{ pay.amount.toFixed(2) }}
                      </span>
                    </template>
                    <span v-else class="text-[11px] text-slate-400">Registrado en caja</span>
                  </div>
                </div>
              </div>

              <!-- Botones de Acción Móvil -->
              <div class="flex items-center justify-end gap-2 pt-1">
                <button
                  @click="openDetailModal(ord)"
                  class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Ver Detalle
                </button>
                <button
                  v-if="ord.status === 'Abierta'"
                  @click="handleManageOrder(ord)"
                  class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Cobrar
                </button>
              </div>
            </div>
          </div>

          <!-- Vista Desktop: Tabla Tradicional Enriquecida -->
          <div class="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase font-extrabold text-slate-400">
                  <th class="py-3 px-4">Mesa / Ubicación</th>
                  <th class="py-3 px-4">Orden #</th>
                  <th class="py-3 px-4">Estado</th>
                  <th class="py-3 px-4">Atendido Por</th>
                  <th class="py-3 px-4">Método(s) de Pago</th>
                  <th class="py-3 px-4">Monto Total</th>
                  <th class="py-3 px-4">Fecha / Hora</th>
                  <th class="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                <tr v-for="ord in filteredHistoryOrders" :key="ord.id" class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4 font-black text-slate-900 font-heading">
                    <span class="inline-flex items-center gap-1.5">
                      <Zap v-if="ord.table_number === 'RAPIDO'" class="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <UtensilsCrossed v-else class="w-3.5 h-3.5 text-indigo-500" />
                      {{ formatTableDisplay(ord.table_number) }}
                    </span>
                  </td>

                  <td class="py-3 px-4 text-xs font-bold text-slate-400 font-mono">
                    #{{ ord.order_number }}
                  </td>

                  <td class="py-3 px-4">
                    <div class="space-y-0.5">
                      <span
                        class="px-2.5 py-1 rounded-full text-xs font-bold inline-block"
                        :class="ord.status === 'Pagada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : (ord.status === 'Cancelada' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800')"
                      >
                        {{ ord.status }}
                      </span>
                      <p
                        v-if="ord.cancellation_reason"
                        class="text-[11px] text-rose-600 font-medium italic truncate max-w-[170px]"
                        :title="ord.cancellation_reason"
                      >
                        {{ ord.cancellation_reason }}
                      </p>
                    </div>
                  </td>

                  <td class="py-3 px-4 text-xs font-medium text-slate-600">
                    {{ ord.user_name || 'Personal' }}
                  </td>

                  <!-- Métodos de Pago Diferenciados -->
                  <td class="py-3 px-4">
                    <template v-if="ord.status === 'Pagada'">
                      <div v-if="!ord.payments || ord.payments.length === 0" class="text-xs text-slate-400">
                        Caja
                      </div>

                      <!-- 1 Solo Método de Pago -->
                      <div v-else-if="ord.payments.length === 1" class="flex items-center gap-1.5">
                        <span
                          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                          :class="ord.payments[0].payment_method === 'Efectivo'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : (ord.payments[0].payment_method === 'Tarjeta' ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-purple-50 text-purple-800 border border-purple-200')"
                        >
                          <DollarSign v-if="ord.payments[0].payment_method === 'Efectivo'" class="w-3.5 h-3.5 text-emerald-600" />
                          <CreditCard v-else-if="ord.payments[0].payment_method === 'Tarjeta'" class="w-3.5 h-3.5 text-sky-600" />
                          <Smartphone v-else class="w-3.5 h-3.5 text-purple-600" />
                          <span>{{ ord.payments[0].payment_method }}</span>
                          <span class="font-extrabold">(S/. {{ ord.payments[0].amount.toFixed(2) }})</span>
                        </span>
                      </div>

                      <!-- Varios Métodos de Pago (Pago Mixto) -->
                      <div v-else class="space-y-1">
                        <div class="flex items-center gap-1">
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                            🔀 Mixto
                          </span>
                        </div>
                        <div class="flex flex-wrap gap-1">
                          <span
                            v-for="p in ord.payments"
                            :key="p.id"
                            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold"
                            :class="p.payment_method === 'Efectivo'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : (p.payment_method === 'Tarjeta' ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-purple-50 text-purple-800 border border-purple-200')"
                          >
                            <span>{{ p.payment_method }}:</span>
                            <span class="font-extrabold">S/. {{ p.amount.toFixed(2) }}</span>
                          </span>
                        </div>
                      </div>
                    </template>
                    <span v-else class="text-xs text-amber-600 font-semibold italic">
                      Pendiente
                    </span>
                  </td>

                  <td class="py-3 px-4 font-black text-slate-900 font-heading">
                    S/. {{ ord.total_amount.toFixed(2) }}
                  </td>

                  <td class="py-3 px-4 text-xs text-slate-400 font-medium">
                    {{ ord.created_at }}
                  </td>

                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        v-if="ord.status === 'Abierta'"
                        @click="openCancelActiveOrderModal(ord)"
                        class="px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Anular Pedido"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                        <span class="hidden lg:inline">Anular</span>
                      </button>

                      <button
                        v-if="ord.status === 'Pagada'"
                        @click="openChangePaymentModal(ord)"
                        class="px-2 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Cambiar Método de Pago"
                      >
                        <RefreshCw class="w-3.5 h-3.5" />
                        <span class="hidden lg:inline">Pago</span>
                      </button>

                      <button
                        @click="openDetailModal(ord)"
                        class="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Eye class="w-3.5 h-3.5 text-slate-400" />
                        <span>Detalle</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detalle de Orden -->
    <TicketDetailModal
      :is-open="isDetailModalOpen"
      :order="selectedOrderForDetail"
      @close="isDetailModalOpen = false"
      @manage="handleManageOrder"
      @cancel-order="openCancelActiveOrderModal"
      @delete-payment="openDeletePaymentModal"
      @change-payment="openChangePaymentModal"
    />

    <!-- Modal de Razón Obligatoria (Anular orden o Eliminar pago) -->
    <OrderReasonModal
      :is-open="isReasonModalOpen"
      :mode="reasonModalMode"
      :order="selectedOrderForReason"
      @close="isReasonModalOpen = false"
      @confirm="handleConfirmReason"
    />

    <!-- Modal Cambiar Método de Pago -->
    <ChangePaymentMethodModal
      :is-open="isChangePaymentModalOpen"
      :order="selectedOrderForChangePayment"
      @close="isChangePaymentModalOpen = false"
      @confirm="handleConfirmChangePayment"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Order, OrderItem } from '@shared/types/order'
import { formatTableDisplay } from '@shared/utils/formatters'
import { api } from '@/api'
import { usePosStore } from '@/stores/posStore'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import TicketDetailModal from '@/components/orders/TicketDetailModal.vue'
import OrderReasonModal from '@/components/orders/OrderReasonModal.vue'
import ChangePaymentMethodModal from '@/components/orders/ChangePaymentMethodModal.vue'
import {
  Zap,
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  Circle,
  User,
  Search,
  Receipt,
  Eye,
  RefreshCw,
  DollarSign,
  CreditCard,
  Smartphone,
  Trash2
} from 'lucide-vue-next'

const router = useRouter()
const posStore = usePosStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const activeTab = ref<'active' | 'history'>('active')
const isLoading = ref(false)
const activeOrders = ref<Order[]>([])
const historyOrders = ref<Order[]>([])

// Filtros para Activos
const activeLocationFilter = ref<'all' | 'tables' | 'quick'>('all')

// Filtros para Historial
const selectedStatusFilter = ref<'all' | 'Abierta' | 'Pagada' | 'Cancelada'>('all')
const selectedLocationFilter = ref<'all' | 'tables' | 'quick'>('all')
const searchQuery = ref('')

// Modal Detalle
const isDetailModalOpen = ref(false)
const selectedOrderForDetail = ref<Order | null>(null)

// Modales de Motivo Obligatorio y Cambio de Pago
const isReasonModalOpen = ref(false)
const reasonModalMode = ref<'cancel_order' | 'delete_payment'>('cancel_order')
const selectedOrderForReason = ref<Order | null>(null)

const isChangePaymentModalOpen = ref(false)
const selectedOrderForChangePayment = ref<Order | null>(null)

let unsubscribeSync: (() => void) | undefined

onMounted(async () => {
  await loadData()

  // Conectar con el bus de eventos de sincronización en vivo
  if (window.api?.onSync) {
    unsubscribeSync = window.api.onSync((type) => {
      if (type === 'orders' || type === 'tables' || type === 'cashier') {
        loadData()
      }
    })
  }
})

onUnmounted(() => {
  if (unsubscribeSync) {
    unsubscribeSync()
  }
})

async function loadData() {
  isLoading.value = true
  try {
    const [actives, history] = await Promise.all([
      api.getActiveOrders(),
      api.getOrdersHistory(100)
    ])
    activeOrders.value = actives || []
    historyOrders.value = history || []
  } catch (e) {
    console.error('Error al cargar órdenes', e)
  } finally {
    isLoading.value = false
  }
}

// Conteo de pedidos activos por tipo
const activeTablesCount = computed(() => {
  return activeOrders.value.filter(o => o.table_number !== 'RAPIDO').length
})

const activeQuickCount = computed(() => {
  return activeOrders.value.filter(o => o.table_number === 'RAPIDO').length
})

// Filtrado de pedidos activos
const filteredActiveOrders = computed(() => {
  return activeOrders.value.filter(o => {
    if (activeLocationFilter.value === 'tables' && o.table_number === 'RAPIDO') return false
    if (activeLocationFilter.value === 'quick' && o.table_number !== 'RAPIDO') return false
    return true
  })
})

// Conteo de historial por estado
const countByStatus = computed(() => {
  const open = historyOrders.value.filter(o => o.status === 'Abierta').length
  const paid = historyOrders.value.filter(o => o.status === 'Pagada').length
  const cancelled = historyOrders.value.filter(o => o.status === 'Cancelada').length
  return { open, paid, cancelled }
})

// Filtrado de historial
const filteredHistoryOrders = computed(() => {
  return historyOrders.value.filter(o => {
    // Filtro de estado
    if (selectedStatusFilter.value !== 'all' && o.status !== selectedStatusFilter.value) {
      return false
    }

    // Filtro de ubicación
    if (selectedLocationFilter.value === 'tables' && o.table_number === 'RAPIDO') {
      return false
    }
    if (selectedLocationFilter.value === 'quick' && o.table_number !== 'RAPIDO') {
      return false
    }

    // Búsqueda por # de orden o mesa
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const matchNum = o.order_number?.toString().includes(q)
      const matchTable = o.table_number.toLowerCase().includes(q) || formatTableDisplay(o.table_number).toLowerCase().includes(q)
      const matchUser = o.user_name?.toLowerCase().includes(q)
      if (!matchNum && !matchTable && !matchUser) return false
    }

    return true
  })
})

// Helper de comprobación de servidos por orden
function getServedProgress(ord: Order) {
  const items = ord.items || []
  if (items.length === 0) return { servedCount: 0, totalCount: 0, percentage: 100, allServed: true }

  const servedCount = items.filter(i => i.is_served === 1).length
  const totalCount = items.length
  const percentage = Math.round((servedCount / totalCount) * 100)
  const allServed = servedCount === totalCount

  return { servedCount, totalCount, percentage, allServed }
}

// Alternar estado servido de un producto
async function handleToggleItemServed(item: OrderItem) {
  // Actualización optimista local
  item.is_served = item.is_served === 1 ? 0 : 1

  try {
    await api.toggleItemServed({ itemId: item.id })
  } catch (e) {
    console.error('Error al actualizar estado servido', e)
    // Revertir en caso de error
    item.is_served = item.is_served === 1 ? 0 : 1
  }
}

// Marcar todos los productos de la orden como servidos
async function handleMarkAllServed(ord: Order) {
  if (ord.items) {
    ord.items.forEach(i => (i.is_served = 1))
  }

  try {
    await api.markAllOrderItemsServed({ orderId: ord.id })
  } catch (e) {
    console.error('Error al marcar todo servido', e)
    await loadData()
  }
}

// Gestionar orden en POS (cobrar o agregar más)
function handleManageOrder(ord: Order) {
  isDetailModalOpen.value = false
  posStore.loadExistingOrder(ord)
  router.push({ name: 'pos' })
}

function openDetailModal(ord: Order) {
  selectedOrderForDetail.value = ord
  isDetailModalOpen.value = true
}

// Formatear tiempo transcurrido desde creación
function formatElapsedTime(dateStr?: string): string {
  if (!dateStr) return 'Reciente'
  const date = new Date(dateStr)
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000)

  if (diffMinutes < 1) return 'Hace un instante'
  if (diffMinutes === 1) return 'Hace 1 min'
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`
  const hours = Math.floor(diffMinutes / 60)
  return `Hace ${hours} h ${diffMinutes % 60} m`
}

function getElapsedAlertClass(dateStr?: string): string {
  if (!dateStr) return 'text-slate-500'
  const diffMinutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diffMinutes >= 20) return 'text-rose-600 font-black'
  if (diffMinutes >= 12) return 'text-amber-600 font-bold'
  return 'text-slate-500'
}

// ==================== ACCIONES CON MOTIVO OBLIGATORIO ====================

function openCancelActiveOrderModal(ord: Order) {
  selectedOrderForReason.value = ord
  reasonModalMode.value = 'cancel_order'
  isReasonModalOpen.value = true
}

function openDeletePaymentModal(ord: Order) {
  selectedOrderForReason.value = ord
  reasonModalMode.value = 'delete_payment'
  isReasonModalOpen.value = true
}

function openChangePaymentModal(ord: Order) {
  selectedOrderForChangePayment.value = ord
  isChangePaymentModalOpen.value = true
}

async function handleConfirmReason(data: { reason: string; destinationStatus: 'Abierta' | 'Cancelada' }) {
  if (!selectedOrderForReason.value) return

  const ord = selectedOrderForReason.value
  const user = authStore.currentUser

  try {
    if (reasonModalMode.value === 'cancel_order') {
      await api.cancelActiveOrder({
        orderId: ord.id,
        reason: data.reason,
        userId: user?.id,
        userName: user?.full_name
      })
      notificationStore.success('Pedido Anulado', `La comanda ${formatTableDisplay(ord.table_number)} ha sido cancelada.`)
    } else {
      await api.deleteOrderPayments({
        orderId: ord.id,
        reason: data.reason,
        destinationStatus: data.destinationStatus,
        userId: user?.id,
        userName: user?.full_name
      })
      if (data.destinationStatus === 'Abierta') {
        notificationStore.success('Pago Revertido', `El pago fue eliminado y la orden ${formatTableDisplay(ord.table_number)} ha sido reabierta.`)
      } else {
        notificationStore.success('Venta y Pago Anulados', `El pago y la orden ${formatTableDisplay(ord.table_number)} han sido cancelados.`)
      }
    }

    isReasonModalOpen.value = false

    // Recargar datos y refrescar modal de detalle si está abierto
    await loadData()
    if (isDetailModalOpen.value && selectedOrderForDetail.value?.id === ord.id) {
      const updated = await api.getOrderById(ord.id)
      selectedOrderForDetail.value = updated
    }
  } catch (err: any) {
    notificationStore.error('Error en la operación', err.message || 'No se pudo completar la acción.')
  }
}

async function handleConfirmChangePayment(data: {
  payments: { method: 'Efectivo' | 'Tarjeta' | 'Yape/Plin'; amount: number }[]
  reason: string
}) {
  if (!selectedOrderForChangePayment.value) return

  const ord = selectedOrderForChangePayment.value
  const user = authStore.currentUser

  try {
    await api.changeOrderPaymentMethod({
      orderId: ord.id,
      newPayments: data.payments,
      reason: data.reason,
      userId: user?.id,
      userName: user?.full_name
    })

    notificationStore.success(
      'Método de Pago Modificado',
      `Se actualizaron los métodos de pago para ${formatTableDisplay(ord.table_number)}.`
    )

    isChangePaymentModalOpen.value = false

    // Recargar datos y refrescar modal de detalle si está abierto
    await loadData()
    if (isDetailModalOpen.value && selectedOrderForDetail.value?.id === ord.id) {
      const updated = await api.getOrderById(ord.id)
      selectedOrderForDetail.value = updated
    }
  } catch (err: any) {
    notificationStore.error('Error al cambiar método', err.message || 'No se pudo actualizar el método de pago.')
  }
}
</script>
