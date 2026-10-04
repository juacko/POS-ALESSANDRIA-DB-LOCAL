<template>
  <div class="h-full flex flex-col bg-slate-50 overflow-hidden select-none">
    <!-- Header Principal -->
    <div class="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 print:hidden">
      <div>
        <h2 class="text-lg sm:text-xl font-bold text-slate-900 font-heading flex items-center gap-2">
          <BarChart3 class="w-5 h-5 text-indigo-600" />
          <span>Reportes y Analítica Financiera</span>
        </h2>
        <p class="text-xs text-slate-400">Supervisión de ingresos, tendencias, productos más vendidos y arqueos</p>
      </div>

      <!-- Acciones: Exportar, Imprimir, Refrescar -->
      <div class="flex items-center gap-2 flex-wrap">
        <button
          @click="loadAllReports"
          :disabled="isLoading"
          class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          title="Recargar datos"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          <span class="hidden sm:inline">Actualizar</span>
        </button>

        <button
          @click="exportToCSV"
          :disabled="isLoading"
          class="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Download class="w-3.5 h-3.5" />
          <span>Exportar CSV</span>
        </button>

        <button
          @click="handlePrint"
          class="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Printer class="w-3.5 h-3.5" />
          <span>Imprimir</span>
        </button>
      </div>
    </div>

    <!-- Barra de Filtros de Período -->
    <div class="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 print:hidden">
      <!-- Botones de Período Rápido -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <button
          v-for="btn in periodButtons"
          :key="btn.id"
          @click="selectPeriod(btn.id)"
          class="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
          :class="selectedPeriod === btn.id
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        >
          {{ btn.label }}
        </button>
      </div>

      <!-- Selector de Fechas (Manual o Visualización) -->
      <div class="flex items-center gap-2 text-xs">
        <div class="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
          <Calendar class="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            v-model="customStartDate"
            type="date"
            @change="applyCustomDateRange"
            class="bg-transparent border-none text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          />
          <span class="text-slate-400 font-bold">a</span>
          <input
            v-model="customEndDate"
            type="date"
            @change="applyCustomDateRange"
            class="bg-transparent border-none text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          />
        </div>
      </div>
    </div>

    <!-- Selector de Pestañas -->
    <div class="bg-slate-100/80 border-b border-slate-200 px-4 sm:px-6 py-1 flex items-center gap-1 shrink-0 overflow-x-auto scrollbar-none print:hidden">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
        :class="activeTab === tab.id
          ? 'bg-white text-indigo-700 shadow-sm'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- Encabezado Visible en Impresión -->
    <div class="hidden print:block p-6 bg-white border-b border-slate-300">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-slate-900 font-heading">Alessandria / Min Min</h1>
          <p class="text-sm text-slate-600">Reporte Gerencial de Ventas y Arqueo</p>
        </div>
        <div class="text-right text-xs text-slate-500">
          <p><strong>Período:</strong> {{ customStartDate }} al {{ customEndDate }}</p>
          <p><strong>Impreso el:</strong> {{ new Date().toLocaleString('es-PE') }}</p>
        </div>
      </div>
    </div>

    <!-- Contenedor Principal con Scroll -->
    <div class="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 pb-24 md:pb-16 print:p-0 print:overflow-visible">
      <!-- Loading Indicator -->
      <div v-if="isLoading" class="text-center py-16 text-slate-400">
        <RefreshCw class="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
        <p class="text-xs font-semibold">Procesando métricas y análisis de ventas...</p>
      </div>

      <template v-else>
        <!-- ==================== PESTAÑA 1: VENTAS & TENDENCIAS ==================== -->
        <div v-if="activeTab === 'overview'" class="space-y-6">
          <!-- Tarjetas KPI Principales -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <!-- Ventas Totales -->
            <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ventas Totales</span>
                <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <TrendingUp class="w-4 h-4" />
                </div>
              </div>
              <p class="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">
                S/. {{ summary.totalSales.toFixed(2) }}
              </p>
              <span class="text-[11px] text-slate-400 mt-1 block">Facturado en el período</span>
            </div>

            <!-- Pedidos Completados -->
            <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transacciones</span>
                <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag class="w-4 h-4" />
                </div>
              </div>
              <p class="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">
                {{ summary.orderCount }}
              </p>
              <span class="text-[11px] text-slate-400 mt-1 block">Pedidos finalizados</span>
            </div>

            <!-- Ticket Promedio -->
            <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ticket Promedio</span>
                <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <DollarSign class="w-4 h-4" />
                </div>
              </div>
              <p class="text-xl sm:text-2xl font-black text-slate-900 font-heading mt-2">
                S/. {{ summary.averageTicket.toFixed(2) }}
              </p>
              <span class="text-[11px] text-slate-400 mt-1 block">Por cliente/pedido</span>
            </div>

            <!-- Canales (Salón vs Rápido) -->
            <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Canales de Venta</span>
                <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Zap class="w-4 h-4" />
                </div>
              </div>
              <div class="mt-2 text-xs space-y-1">
                <div class="flex justify-between font-semibold text-slate-700">
                  <span>Mesas:</span>
                  <span class="font-bold text-slate-900">S/. {{ summary.dineInSales.toFixed(2) }} ({{ summary.dineInOrders }})</span>
                </div>
                <div class="flex justify-between font-semibold text-slate-700">
                  <span>Rápido:</span>
                  <span class="font-bold text-slate-900">S/. {{ summary.takeoutSales.toFixed(2) }} ({{ summary.takeoutOrders }})</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Medios de Pago y Canales -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Efectivo -->
            <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Wallet class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-500">Efectivo</span>
                  <span class="text-xs font-bold text-slate-700">{{ getPercentage(summary.cashPayments, summary.totalSales) }}%</span>
                </div>
                <p class="text-base font-extrabold text-slate-900 font-heading">S/. {{ summary.cashPayments.toFixed(2) }}</p>
                <div class="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full" :style="{ width: `${getPercentage(summary.cashPayments, summary.totalSales)}%` }"></div>
                </div>
              </div>
            </div>

            <!-- Tarjeta -->
            <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CreditCard class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-500">Tarjeta (POS)</span>
                  <span class="text-xs font-bold text-slate-700">{{ getPercentage(summary.cardPayments, summary.totalSales) }}%</span>
                </div>
                <p class="text-base font-extrabold text-slate-900 font-heading">S/. {{ summary.cardPayments.toFixed(2) }}</p>
                <div class="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div class="bg-blue-500 h-full rounded-full" :style="{ width: `${getPercentage(summary.cardPayments, summary.totalSales)}%` }"></div>
                </div>
              </div>
            </div>

            <!-- Yape / Plin -->
            <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Smartphone class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-500">Yape / Plin</span>
                  <span class="text-xs font-bold text-slate-700">{{ getPercentage(summary.yapePayments, summary.totalSales) }}%</span>
                </div>
                <p class="text-base font-extrabold text-slate-900 font-heading">S/. {{ summary.yapePayments.toFixed(2) }}</p>
                <div class="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div class="bg-purple-500 h-full rounded-full" :style="{ width: `${getPercentage(summary.yapePayments, summary.totalSales)}%` }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Gráfico de Tendencia Temporal Interactivo -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 class="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                  <TrendingUp class="w-4 h-4 text-indigo-600" />
                  <span>Curva de Ventas en el Tiempo</span>
                </h3>
                <p class="text-xs text-slate-400">Identifica las horas pico o días con mayor demanda</p>
              </div>

              <!-- Selector de Agrupación -->
              <div class="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                <button
                  @click="changeTrendGroup('hour')"
                  class="px-2.5 py-1 rounded-lg transition-all"
                  :class="trendGroupBy === 'hour' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
                >
                  Por Hora
                </button>
                <button
                  @click="changeTrendGroup('day')"
                  class="px-2.5 py-1 rounded-lg transition-all"
                  :class="trendGroupBy === 'day' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'"
                >
                  Por Día
                </button>
              </div>
            </div>

            <!-- Gráfico de Barras SVG Dinámico -->
            <div v-if="trendData.length > 0" class="pt-4">
              <div class="h-56 flex items-end gap-2 sm:gap-3 px-2 border-b border-slate-200 pb-2">
                <div
                  v-for="(point, idx) in trendData"
                  :key="idx"
                  class="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  <!-- Tooltip flotante en hover -->
                  <div class="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-12 z-20 bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 shadow-lg transition-opacity whitespace-nowrap">
                    <p class="font-bold">S/. {{ point.total.toFixed(2) }}</p>
                    <p class="text-slate-300">{{ point.orders }} pedidos</p>
                  </div>

                  <!-- Barra de altura relativa -->
                  <div
                    class="w-full max-w-[36px] bg-indigo-500 hover:bg-indigo-600 transition-all rounded-t-md min-h-[4px]"
                    :style="{ height: `${getBarHeight(point.total)}%` }"
                  ></div>

                  <!-- Etiqueta eje X -->
                  <span class="text-[9px] sm:text-[10px] text-slate-400 font-semibold mt-2 truncate max-w-[48px] text-center">
                    {{ point.label }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-12 text-slate-400 text-xs font-medium">
              No hay movimientos de venta registrados en las horas o fechas de este período.
            </div>
          </div>
        </div>

        <!-- ==================== PESTAÑA 2: PRODUCTOS & CATEGORÍAS ==================== -->
        <div v-if="activeTab === 'products'" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Ranking de Productos Más Vendidos (2 columnas en desktop) -->
            <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 class="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                    <Package class="w-4 h-4 text-indigo-600" />
                    <span>Top Productos Más Vendidos</span>
                  </h3>
                  <p class="text-xs text-slate-400">Productos con mayor rotación e ingresos generados</p>
                </div>

                <!-- Filtro por Categoría -->
                <select
                  v-model="productCategoryFilter"
                  @change="loadTopProducts"
                  class="px-3 py-1.5 bg-slate-100 border border-transparent rounded-xl text-xs font-semibold text-slate-700 outline-none self-start sm:self-auto"
                >
                  <option value="all">Todas las Categorías</option>
                  <option v-for="cat in categorySales" :key="cat.categoryId" :value="cat.categoryId">
                    {{ cat.categoryName }}
                  </option>
                </select>
              </div>

              <div v-if="topProducts.length === 0" class="text-center py-12 text-slate-400 text-xs">
                No se registraron ventas de productos en este período.
              </div>

              <!-- Tabla de Ranking -->
              <div v-else class="overflow-x-auto">
                <table class="w-full min-w-[550px] text-left text-xs">
                  <thead>
                    <tr class="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      <th class="py-2.5 px-3">#</th>
                      <th class="py-2.5 px-3">Producto</th>
                      <th class="py-2.5 px-3">Categoría</th>
                      <th class="py-2.5 px-3 text-right">Uds.</th>
                      <th class="py-2.5 px-3 text-right">Recaudación</th>
                      <th class="py-2.5 px-3 w-32">Participación</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="(prod, idx) in topProducts" :key="prod.productId" class="hover:bg-slate-50/80 transition-colors">
                      <td class="py-3 px-3">
                        <span
                          class="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold"
                          :class="idx === 0 ? 'bg-amber-100 text-amber-800 font-extrabold' : (idx === 1 ? 'bg-slate-200 text-slate-700' : (idx === 2 ? 'bg-amber-50 text-amber-700' : 'text-slate-400'))"
                        >
                          {{ idx + 1 }}
                        </span>
                      </td>
                      <td class="py-3 px-3 font-bold text-slate-800">
                        {{ prod.productName }}
                      </td>
                      <td class="py-3 px-3">
                        <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {{ prod.categoryName }}
                        </span>
                      </td>
                      <td class="py-3 px-3 text-right font-semibold text-slate-700">
                        {{ prod.quantity }}
                      </td>
                      <td class="py-3 px-3 text-right font-black text-indigo-600 font-heading">
                        S/. {{ prod.totalSales.toFixed(2) }}
                      </td>
                      <td class="py-3 px-3">
                        <div class="flex items-center gap-2">
                          <div class="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div class="bg-indigo-600 h-full rounded-full" :style="{ width: `${prod.percentageOfTotal}%` }"></div>
                          </div>
                          <span class="text-[10px] font-bold text-slate-500 w-8 text-right">{{ prod.percentageOfTotal.toFixed(1) }}%</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Resumen por Categorías (1 columna) -->
            <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
              <div>
                <h3 class="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                  <PieChart class="w-4 h-4 text-indigo-600" />
                  <span>Ventas por Categoría</span>
                </h3>
                <p class="text-xs text-slate-400">Distribución de ingresos por área</p>
              </div>

              <div v-if="categorySales.length === 0" class="text-center py-12 text-slate-400 text-xs">
                Sin datos de categorías.
              </div>

              <div v-else class="space-y-3.5 pt-2">
                <div v-for="cat in categorySales" :key="cat.categoryId" class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-slate-800">{{ cat.categoryName }}</span>
                    <span class="font-black text-slate-900 font-heading">S/. {{ cat.totalSales.toFixed(2) }}</span>
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{{ cat.itemCount }} artículos</span>
                    <span class="font-semibold text-indigo-600">{{ cat.percentageOfTotal.toFixed(1) }}%</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div class="bg-indigo-500 h-full rounded-full" :style="{ width: `${cat.percentageOfTotal}%` }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== PESTAÑA 3: AUDITORÍA DE CAJAS ==================== -->
        <div v-if="activeTab === 'cashier'" class="space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div>
              <h3 class="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                <Wallet class="w-4 h-4 text-indigo-600" />
                <span>Auditoría de Arqueos y Cierres de Caja</span>
              </h3>
              <p class="text-xs text-slate-400">Historial de sesiones, verificación de cuadre y control de discrepancias de dinero</p>
            </div>

            <div v-if="cashierSessions.length === 0" class="text-center py-12 text-slate-400 text-xs">
              No se registran sesiones de caja en este rango de fechas.
            </div>

            <!-- Vista Móvil: Lista de Tarjetas de Sesión de Caja -->
            <div class="md:hidden space-y-3">
              <div
                v-for="ses in cashierSessions"
                :key="ses.id"
                class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3"
              >
                <!-- Cabecera de la tarjeta -->
                <div class="flex items-start justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <div class="flex items-center gap-2">
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        :class="ses.status === 'Abierta' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'"
                      >
                        {{ ses.status }}
                      </span>
                      <span class="text-xs font-bold text-slate-900">{{ ses.userName }}</span>
                    </div>
                    <p class="text-[10px] text-slate-400 mt-1">
                      Apertura: {{ ses.openingTime }}
                    </p>
                    <p v-if="ses.closingTime" class="text-[10px] text-slate-400">
                      Cierre: {{ ses.closingTime }}
                    </p>
                  </div>

                  <div class="text-right">
                    <span class="text-[9px] uppercase font-bold text-slate-400 block">Descuadre</span>
                    <span
                      v-if="ses.status === 'Abierta'"
                      class="text-xs font-semibold text-slate-400"
                    >
                      En curso
                    </span>
                    <span
                      v-else-if="Math.abs(ses.difference) < 0.01"
                      class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold inline-block"
                    >
                      Exacto
                    </span>
                    <span
                      v-else-if="ses.difference > 0"
                      class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold inline-block"
                    >
                      +S/. {{ ses.difference.toFixed(2) }}
                    </span>
                    <span
                      v-else
                      class="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-xs font-bold inline-block"
                    >
                      -S/. {{ Math.abs(ses.difference).toFixed(2) }}
                    </span>
                  </div>
                </div>

                <!-- Grilla de Valores Financieros -->
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="bg-slate-50 p-2 rounded-xl">
                    <span class="text-[10px] text-slate-400 font-semibold block">Fondo Inicial</span>
                    <span class="font-bold text-slate-700">S/. {{ ses.initialCash.toFixed(2) }}</span>
                  </div>
                  <div class="bg-slate-50 p-2 rounded-xl">
                    <span class="text-[10px] text-slate-400 font-semibold block">Ventas Efectivo</span>
                    <span class="font-bold text-slate-800">S/. {{ ses.cashPayments.toFixed(2) }}</span>
                  </div>
                  <div class="bg-emerald-50/70 border border-emerald-100 p-2 rounded-xl">
                    <span class="text-[10px] text-emerald-700 font-semibold block">Ingresos (+)</span>
                    <span class="font-black text-emerald-700 font-heading">
                      {{ ses.manualIncomes > 0 ? `+S/. ${ses.manualIncomes.toFixed(2)}` : 'S/. 0.00' }}
                    </span>
                  </div>
                  <div class="bg-rose-50/70 border border-rose-100 p-2 rounded-xl">
                    <span class="text-[10px] text-rose-700 font-semibold block">Egresos (-)</span>
                    <span class="font-bold text-rose-700 font-heading">
                      {{ ses.manualExpenses > 0 ? `-S/. ${ses.manualExpenses.toFixed(2)}` : 'S/. 0.00' }}
                    </span>
                  </div>
                  <div class="bg-slate-50 p-2 rounded-xl">
                    <span class="text-[10px] text-slate-400 font-semibold block">Efectivo Esperado</span>
                    <span class="font-bold text-slate-800">S/. {{ ses.expectedCash.toFixed(2) }}</span>
                  </div>
                  <div class="bg-indigo-50/70 border border-indigo-100 p-2 rounded-xl">
                    <span class="text-[10px] text-indigo-700 font-semibold block">Efectivo Declarado</span>
                    <span class="font-black text-indigo-700 font-heading">S/. {{ ses.actualCash.toFixed(2) }}</span>
                  </div>
                </div>

                <!-- Movimientos Detallados -->
                <div v-if="ses.movements && ses.movements.length > 0" class="pt-1">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Movimientos:</span>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="(m, mIdx) in ses.movements"
                      :key="mIdx"
                      class="px-2 py-1 rounded-lg text-[11px] font-semibold"
                      :class="m.type.toLowerCase().includes('ingreso') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                    >
                      {{ m.type.toLowerCase().includes('ingreso') ? '+' : '-' }}S/.{{ m.amount.toFixed(2) }} <span class="font-normal opacity-80">({{ m.description }})</span>
                    </span>
                  </div>
                </div>

                <!-- Observaciones -->
                <p v-if="ses.notes" class="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-xl">
                  <strong>Nota:</strong> {{ ses.notes }}
                </p>
              </div>
            </div>

            <!-- Vista Desktop: Tabla Tradicional con Scroll Horizontal -->
            <div class="hidden md:block overflow-x-auto">
              <table class="w-full min-w-[850px] text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th class="py-2.5 px-3">Estado</th>
                    <th class="py-2.5 px-3">Apertura / Cierre</th>
                    <th class="py-2.5 px-3">Responsable</th>
                    <th class="py-2.5 px-3 text-right">Fondo Inic.</th>
                    <th class="py-2.5 px-3 text-right">Ventas Efectivo</th>
                    <th class="py-2.5 px-3 text-right">Ingresos (+)</th>
                    <th class="py-2.5 px-3 text-right">Egresos (-)</th>
                    <th class="py-2.5 px-3 text-right">Esperado</th>
                    <th class="py-2.5 px-3 text-right">Declarado</th>
                    <th class="py-2.5 px-3 text-right">Descuadre</th>
                    <th class="py-2.5 px-3">Observaciones / Movimientos</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="ses in cashierSessions" :key="ses.id" class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3 px-3">
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        :class="ses.status === 'Abierta' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'"
                      >
                        {{ ses.status }}
                      </span>
                    </td>
                    <td class="py-3 px-3">
                      <span class="font-bold text-slate-800 block">{{ ses.openingTime }}</span>
                      <span v-if="ses.closingTime" class="text-[10px] text-slate-400 block">{{ ses.closingTime }}</span>
                      <span v-else class="text-[10px] text-emerald-600 font-semibold block">En curso</span>
                    </td>
                    <td class="py-3 px-3 font-semibold text-slate-700">
                      {{ ses.userName }}
                    </td>
                    <td class="py-3 px-3 text-right font-medium text-slate-600">
                      S/. {{ ses.initialCash.toFixed(2) }}
                    </td>
                    <td class="py-3 px-3 text-right font-bold text-slate-800">
                      S/. {{ ses.cashPayments.toFixed(2) }}
                    </td>
                    <td class="py-3 px-3 text-right font-bold text-emerald-600">
                      {{ ses.manualIncomes > 0 ? `+S/. ${ses.manualIncomes.toFixed(2)}` : 'S/. 0.00' }}
                    </td>
                    <td class="py-3 px-3 text-right font-semibold text-rose-600">
                      {{ ses.manualExpenses > 0 ? `-S/. ${ses.manualExpenses.toFixed(2)}` : 'S/. 0.00' }}
                    </td>
                    <td class="py-3 px-3 text-right font-bold text-slate-800">
                      S/. {{ ses.expectedCash.toFixed(2) }}
                    </td>
                    <td class="py-3 px-3 text-right font-bold text-slate-900 font-heading">
                      S/. {{ ses.actualCash.toFixed(2) }}
                    </td>
                    <td class="py-3 px-3 text-right font-black font-heading">
                      <span
                        v-if="ses.status === 'Abierta'"
                        class="text-slate-400 font-normal text-[11px]"
                      >
                        En curso
                      </span>
                      <span
                        v-else-if="Math.abs(ses.difference) < 0.01"
                        class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px]"
                      >
                        Exacto
                      </span>
                      <span
                        v-else-if="ses.difference > 0"
                        class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px]"
                      >
                        +S/. {{ ses.difference.toFixed(2) }}
                      </span>
                      <span
                        v-else
                        class="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px]"
                      >
                        -S/. {{ Math.abs(ses.difference).toFixed(2) }}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-slate-500 text-[11px] max-w-xs">
                      <!-- Movimientos de caja detallados (ej: Ingreso de sencillo) -->
                      <div v-if="ses.movements && ses.movements.length > 0" class="mb-1 flex flex-wrap gap-1">
                        <span
                          v-for="(m, mIdx) in ses.movements"
                          :key="mIdx"
                          class="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          :class="m.type.toLowerCase().includes('ingreso') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
                          :title="`${m.type}: S/. ${m.amount.toFixed(2)} - ${m.description} (${m.timestamp})`"
                        >
                          {{ m.type.toLowerCase().includes('ingreso') ? '+' : '-' }}S/.{{ m.amount.toFixed(2) }} ({{ m.description }})
                        </span>
                      </div>
                      <span class="truncate block text-slate-600" :title="ses.notes || ''">
                        {{ ses.notes ? `Nota: ${ses.notes}` : (ses.movements && ses.movements.length > 0 ? '' : '—') }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ==================== PESTAÑA 4: PERSONAL & MOZOS ==================== -->
        <div v-if="activeTab === 'staff'" class="space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
            <div>
              <h3 class="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                <Users class="w-4 h-4 text-indigo-600" />
                <span>Rendimiento del Personal y Ventas</span>
              </h3>
              <p class="text-xs text-slate-400">Total de órdenes procesadas y volumen monetario por cada colaborador</p>
            </div>

            <div v-if="staffSales.length === 0" class="text-center py-12 text-slate-400 text-xs">
              No hay pedidos asociados al personal en este período.
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th class="py-2.5 px-3">Colaborador</th>
                    <th class="py-2.5 px-3">Rol</th>
                    <th class="py-2.5 px-3 text-right">Órdenes Atendidas</th>
                    <th class="py-2.5 px-3 text-right">Total Facturado</th>
                    <th class="py-2.5 px-3 text-right">Ticket Promedio</th>
                    <th class="py-2.5 px-3 w-40">Aporte a Ventas</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="staff in staffSales" :key="staff.userId" class="hover:bg-slate-50/80 transition-colors">
                    <td class="py-3 px-3 font-bold text-slate-800">
                      {{ staff.userName }}
                    </td>
                    <td class="py-3 px-3">
                      <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                        {{ staff.userRole }}
                      </span>
                    </td>
                    <td class="py-3 px-3 text-right font-semibold text-slate-700">
                      {{ staff.orderCount }}
                    </td>
                    <td class="py-3 px-3 text-right font-black text-indigo-600 font-heading">
                      S/. {{ staff.totalSales.toFixed(2) }}
                    </td>
                    <td class="py-3 px-3 text-right font-semibold text-slate-600">
                      S/. {{ staff.averageTicket.toFixed(2) }}
                    </td>
                    <td class="py-3 px-3">
                      <div class="flex items-center gap-2">
                        <div class="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            class="bg-indigo-600 h-full rounded-full"
                            :style="{ width: `${summary.totalSales > 0 ? (staff.totalSales / summary.totalSales) * 100 : 0}%` }"
                          ></div>
                        </div>
                        <span class="text-[10px] font-bold text-slate-500 w-9 text-right">
                          {{ summary.totalSales > 0 ? ((staff.totalSales / summary.totalSales) * 100).toFixed(1) : 0 }}%
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '@/stores/notificationStore'
import {
  BarChart3,
  TrendingUp,
  Package,
  Wallet,
  Users,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  ShoppingBag,
  DollarSign,
  Zap,
  CreditCard,
  Smartphone,
  PieChart
} from 'lucide-vue-next'
import { api } from '@/api'
import {
  SalesSummary,
  SalesTrendPoint,
  TopProductItem,
  CategorySaleItem,
  CashierSessionAudit,
  StaffSaleItem
} from '@shared/types/report'

// Estado General
const notificationStore = useNotificationStore()
const isLoading = ref(true)
const activeTab = ref<'overview' | 'products' | 'cashier' | 'staff'>('overview')
const selectedPeriod = ref<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today')
const customStartDate = ref('')
const customEndDate = ref('')
const trendGroupBy = ref<'hour' | 'day'>('hour')
const productCategoryFilter = ref('all')

// Datos de Reportes
const summary = ref<SalesSummary>({
  totalSales: 0,
  orderCount: 0,
  averageTicket: 0,
  cashPayments: 0,
  cardPayments: 0,
  yapePayments: 0,
  dineInSales: 0,
  takeoutSales: 0,
  dineInOrders: 0,
  takeoutOrders: 0
})

const trendData = ref<SalesTrendPoint[]>([])
const topProducts = ref<TopProductItem[]>([])
const categorySales = ref<CategorySaleItem[]>([])
const cashierSessions = ref<CashierSessionAudit[]>([])
const staffSales = ref<StaffSaleItem[]>([])

const periodButtons = [
  { id: 'today', label: 'Hoy' },
  { id: 'yesterday', label: 'Ayer' },
  { id: 'week', label: 'Últimos 7 Días' },
  { id: 'month', label: 'Este Mes' }
] as const

const tabs = [
  { id: 'overview', label: 'Ventas & Tendencias', icon: TrendingUp },
  { id: 'products', label: 'Top Productos & Categorías', icon: Package },
  { id: 'cashier', label: 'Auditoría de Cajas', icon: Wallet },
  { id: 'staff', label: 'Personal & Mozos', icon: Users }
] as const

let cleanupSync: (() => void) | null = null

onMounted(() => {
  selectPeriod('today')
  if (typeof window !== 'undefined' && window.api?.onSync) {
    cleanupSync = window.api.onSync((type) => {
      if (type === 'cashier' || type === 'orders') {
        loadAllReports()
      }
    })
  }
})

onUnmounted(() => {
  if (cleanupSync) {
    cleanupSync()
  }
})

function formatYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function selectPeriod(period: 'today' | 'yesterday' | 'week' | 'month' | 'custom') {
  selectedPeriod.value = period
  const now = new Date()

  if (period === 'today') {
    const todayStr = formatYMD(now)
    customStartDate.value = todayStr
    customEndDate.value = todayStr
    trendGroupBy.value = 'hour'
  } else if (period === 'yesterday') {
    const yest = new Date(now)
    yest.setDate(yest.getDate() - 1)
    const yestStr = formatYMD(yest)
    customStartDate.value = yestStr
    customEndDate.value = yestStr
    trendGroupBy.value = 'hour'
  } else if (period === 'week') {
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 6)
    customStartDate.value = formatYMD(weekAgo)
    customEndDate.value = formatYMD(now)
    trendGroupBy.value = 'day'
  } else if (period === 'month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    customStartDate.value = formatYMD(firstDay)
    customEndDate.value = formatYMD(now)
    trendGroupBy.value = 'day'
  }

  loadAllReports()
}

function applyCustomDateRange() {
  selectedPeriod.value = 'custom'
  loadAllReports()
}

async function loadAllReports() {
  isLoading.value = true
  try {
    const start = `${customStartDate.value} 00:00:00`
    const end = `${customEndDate.value} 23:59:59`

    const [sum, trend, top, cats, sessions, staff] = await Promise.all([
      api.getReportsSalesSummary({ startDate: start, endDate: end }),
      api.getReportsSalesTrend({ startDate: start, endDate: end, groupBy: trendGroupBy.value }),
      api.getReportsTopProducts({
        startDate: start,
        endDate: end,
        limit: 15,
        categoryId: productCategoryFilter.value !== 'all' ? productCategoryFilter.value : undefined
      }),
      api.getReportsCategorySales({ startDate: start, endDate: end }),
      api.getReportsCashierSessions({ startDate: start, endDate: end }),
      api.getReportsStaffSales({ startDate: start, endDate: end })
    ])

    summary.value = sum
    trendData.value = trend
    topProducts.value = top
    categorySales.value = cats
    cashierSessions.value = sessions
    staffSales.value = staff
  } catch (err) {
    console.error('Error al cargar reportes:', err)
  } finally {
    isLoading.value = false
  }
}

async function loadTopProducts() {
  try {
    const start = `${customStartDate.value} 00:00:00`
    const end = `${customEndDate.value} 23:59:59`
    topProducts.value = await api.getReportsTopProducts({
      startDate: start,
      endDate: end,
      limit: 15,
      categoryId: productCategoryFilter.value !== 'all' ? productCategoryFilter.value : undefined
    })
  } catch (err) {
    console.error('Error cargando top productos:', err)
  }
}

function changeTrendGroup(groupBy: 'hour' | 'day') {
  trendGroupBy.value = groupBy
  const start = `${customStartDate.value} 00:00:00`
  const end = `${customEndDate.value} 23:59:59`
  api.getReportsSalesTrend({ startDate: start, endDate: end, groupBy }).then(res => {
    trendData.value = res
  })
}

function getPercentage(part: number, total: number): number {
  if (!total || total <= 0) return 0
  return Math.round((part / total) * 100)
}

function getBarHeight(val: number): number {
  if (!trendData.value || trendData.value.length === 0) return 0
  const max = Math.max(...trendData.value.map(p => p.total), 1)
  return Math.round((val / max) * 100)
}

function handlePrint() {
  window.print()
}

async function exportToCSV() {
  try {
    const start = `${customStartDate.value} 00:00:00`
    const end = `${customEndDate.value} 23:59:59`
    const orders = await api.getReportsExportData({ startDate: start, endDate: end })

    if (!orders || orders.length === 0) {
      notificationStore.info('Sin registros', 'No hay órdenes registradas para exportar en el período seleccionado.')
      return
    }

    // Encabezados CSV
    const headers = [
      'Nro Orden',
      'Ubicacion/Mesa',
      'Fecha Creacion',
      'Fecha Cierre',
      'Estado',
      'Atendido Por',
      'Total (S/.)',
      'Metodos de Pago',
      'Cant. Items',
      'Detalle de Productos'
    ]

    // Filas CSV
    const rows = orders.map(ord => [
      `#${ord.orderNumber}`,
      `"${ord.tableNumber}"`,
      `"${ord.createdAt}"`,
      `"${ord.closedAt || ''}"`,
      `"${ord.status}"`,
      `"${ord.cashierName}"`,
      ord.totalAmount.toFixed(2),
      `"${ord.paymentMethods}"`,
      ord.itemCount,
      `"${ord.itemsSummary.replace(/"/g, '""')}"`
    ])

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `reporte_ventas_${customStartDate.value}_al_${customEndDate.value}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    notificationStore.success('Reporte exportado', 'El archivo CSV se descargó correctamente.')
  } catch (err) {
    console.error('Error al exportar reporte:', err)
    notificationStore.error('Error al exportar', 'Ocurrió un error al generar la exportación a Excel/CSV.')
  }
}
</script>

<style scoped>
@media print {
  body {
    background: white !important;
  }
}
</style>
