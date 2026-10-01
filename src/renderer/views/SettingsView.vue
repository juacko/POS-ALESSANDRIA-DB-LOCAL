<template>
  <div class="h-full flex flex-col bg-slate-50 overflow-hidden select-none">
    <!-- Header Principal con Selector de Pestañas -->
    <div class="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
      <div>
        <h2 class="text-lg sm:text-xl font-bold text-slate-900 font-heading flex items-center gap-2">
          <Settings class="w-5 h-5 text-indigo-600" />
          <span>Configuración del Sistema</span>
        </h2>
        <p class="text-xs text-slate-400">Administración de catálogo, precios y equipo de trabajo</p>
      </div>

      <!-- Selector de Pestañas (Catálogo vs Modificadores vs Personal) -->
      <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto overflow-x-auto max-w-full">
        <button
          @click="activeTab = 'catalog'"
          class="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
          :class="activeTab === 'catalog'
            ? 'bg-white text-indigo-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'"
        >
          <Package class="w-4 h-4" />
          <span>Productos</span>
        </button>

        <button
          @click="activeTab = 'modifiers'"
          class="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
          :class="activeTab === 'modifiers'
            ? 'bg-white text-indigo-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'"
        >
          <SlidersHorizontal class="w-4 h-4" />
          <span>Modificadores y Variantes</span>
        </button>

        <button
          @click="activeTab = 'users'"
          class="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
          :class="activeTab === 'users'
            ? 'bg-white text-indigo-700 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'"
        >
          <Users class="w-4 h-4" />
          <span>Personal</span>
        </button>
      </div>
    </div>

    <!-- ==================== PESTAÑA 1: CATÁLOGO DE PRODUCTOS ==================== -->
    <template v-if="activeTab === 'catalog'">
      <!-- Buscador y Filtros de Productos -->
      <div class="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
        <div class="flex items-center gap-3 flex-1 max-w-lg">
          <div class="relative flex-1">
            <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar producto..."
              class="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <select
            v-model="selectedCategory"
            class="px-3 py-2 bg-slate-100 border border-transparent rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Todas las Categorías</option>
            <option v-for="cat in productStore.categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <button
          @click="openCreateModal"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus class="w-4 h-4" />
          <span>NUEVO PRODUCTO</span>
        </button>
      </div>

      <!-- Tabla CRUD de Productos -->
      <div class="flex-1 p-4 sm:p-6 overflow-y-auto pb-20 md:pb-16">
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase font-extrabold text-slate-400">
                <th class="py-3 px-4">Producto</th>
                <th class="py-3 px-4">Categoría</th>
                <th class="py-3 px-4">Precio Base</th>
                <th class="py-3 px-4">Modificadores</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              <tr v-for="p in filteredProducts" :key="p.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-4 font-bold text-slate-900 font-heading">
                  {{ p.name }}
                </td>
                <td class="py-3 px-4">
                  <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold">
                    {{ p.category_name }}
                  </span>
                </td>
                <td class="py-3 px-4 font-extrabold text-slate-900 font-heading">
                  S/. {{ p.base_price.toFixed(2) }}
                </td>
                <td class="py-3 px-4 text-xs text-slate-500">
                  <template v-if="p.modifier_groups && p.modifier_groups.length > 0">
                    <span
                      v-for="g in p.modifier_groups"
                      :key="g.id"
                      class="inline-block bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-md mr-1"
                    >
                      {{ g.name }}
                    </span>
                  </template>
                  <span v-else class="text-slate-300">Ninguno</span>
                </td>
                <td class="py-3 px-4">
                  <button
                    @click="toggleActive(p)"
                    class="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    :class="p.active ? 'bg-emerald-500' : 'bg-slate-300'"
                    :title="p.active ? 'Desactivar producto' : 'Activar producto'"
                  >
                    <span
                      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="p.active ? 'translate-x-5' : 'translate-x-0'"
                    />
                  </button>
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    @click="openEditModal(p)"
                    class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar Producto"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ==================== PESTAÑA 2: MODIFICADORES Y VARIANTES ==================== -->
    <template v-else-if="activeTab === 'modifiers'">
      <!-- Buscador y Acciones -->
      <div class="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div class="flex items-center gap-3 flex-1 max-w-xl">
          <div class="relative flex-1">
            <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchModifierQuery"
              type="text"
              placeholder="Buscar grupo, variante u opción..."
              class="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <select
            v-model="selectedModifierMode"
            class="px-3 py-2 bg-slate-100 border border-transparent rounded-xl text-xs font-semibold text-slate-700 outline-none shrink-0"
          >
            <option value="all">Todos los Tipos</option>
            <option value="single">Solo Variantes (Selección Única)</option>
            <option value="multiple_limited">Múltiple con Límite</option>
            <option value="multiple_unlimited">Múltiple Libre / Toppings</option>
          </select>
        </div>

        <button
          @click="openCreateGroupModal"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
        >
          <Plus class="w-4 h-4" />
          <span>NUEVO GRUPO</span>
        </button>
      </div>

      <!-- Listado de Grupos de Modificadores -->
      <div class="flex-1 p-4 sm:p-6 overflow-y-auto pb-20 md:pb-16 space-y-4">
        <!-- Banner Explicativo -->
        <div class="bg-gradient-to-r from-indigo-50/80 to-purple-50/60 p-4 rounded-2xl border border-indigo-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-start gap-3">
            <div class="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 shadow-sm shadow-indigo-200">
              <SlidersHorizontal class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-xs sm:text-sm font-bold text-slate-900 font-heading">
                Configuración de Variantes y Modificadores
              </h3>
              <p class="text-[11px] text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                Define presentaciones obligatorias como <strong>tamaños</strong> y <strong>sabores</strong> (variantes de 1 opción), así como adicionales o <strong>toppings</strong> con o sin costo extra. Luego podrás asignarlos a cualquier producto en el catálogo.
              </p>
            </div>
          </div>
        </div>

        <!-- Estado Vacío -->
        <div
          v-if="filteredModifierGroups.length === 0"
          class="bg-white rounded-2xl border border-slate-200 p-8 text-center"
        >
          <SlidersHorizontal class="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p class="text-sm font-bold text-slate-700">No se encontraron grupos de modificadores</p>
          <p class="text-xs text-slate-400 mt-1">Crea tu primer grupo para definir tamaños, sabores o adicionales.</p>
          <button
            @click="openCreateGroupModal"
            class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-1.5 transition-all"
          >
            <Plus class="w-4 h-4" />
            <span>Crear Primer Grupo</span>
          </button>
        </div>

        <!-- Tarjetas de Grupos -->
        <div v-else class="space-y-4">
          <div
            v-for="group in filteredModifierGroups"
            :key="group.id"
            class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all hover:border-slate-300"
          >
            <!-- Cabecera de la Tarjeta del Grupo -->
            <div class="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                  :class="group.selection_mode === 'single'
                    ? 'bg-emerald-100 text-emerald-800'
                    : (group.selection_mode === 'multiple_limited' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800')"
                >
                  <Layers v-if="group.selection_mode === 'single'" class="w-5 h-5" />
                  <Sparkles v-else class="w-5 h-5" />
                </div>

                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h4 class="text-sm font-bold text-slate-900 font-heading">{{ group.name }}</h4>

                    <!-- Badge Modo -->
                    <span
                      v-if="group.selection_mode === 'single'"
                      class="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold"
                    >
                      Variante (1 sola opción)
                    </span>
                    <span
                      v-else-if="group.selection_mode === 'multiple_limited'"
                      class="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold"
                    >
                      Múltiple (Máx. {{ group.selection_limit }} selecciones)
                    </span>
                    <span
                      v-else
                      class="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-bold"
                    >
                      Múltiple Libre (Adicionales)
                    </span>

                    <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold">
                      {{ group.modifiers?.length || 0 }} {{ (group.modifiers?.length === 1) ? 'opción' : 'opciones' }}
                    </span>
                  </div>

                  <!-- Productos vinculados -->
                  <p class="text-[11px] text-slate-400 mt-0.5">
                    <template v-if="group.product_count && group.product_count > 0">
                      Asignado a <span class="font-semibold text-slate-600">{{ group.product_count }} {{ group.product_count === 1 ? 'producto' : 'productos' }}</span>:
                      <span class="text-slate-500 italic">{{ group.product_names?.slice(0, 4).join(', ') }}{{ (group.product_names?.length || 0) > 4 ? '...' : '' }}</span>
                    </template>
                    <template v-else>
                      Sin productos asignados actualmente
                    </template>
                  </p>
                </div>
              </div>

              <!-- Acciones del Grupo -->
              <div class="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  @click="openAddOptionModal(group)"
                  class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 active:scale-95"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>Agregar Opción</span>
                </button>

                <button
                  @click="handleDuplicateGroup(group)"
                  class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Duplicar Grupo"
                >
                  <Copy class="w-4 h-4" />
                </button>

                <button
                  @click="openEditGroupModal(group)"
                  class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Editar Grupo"
                >
                  <Pencil class="w-4 h-4" />
                </button>

                <button
                  @click="handleDeleteGroup(group)"
                  class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Eliminar Grupo"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Tabla de Opciones del Grupo -->
            <div class="p-3 sm:p-4">
              <div v-if="!group.modifiers || group.modifiers.length === 0" class="text-center py-4 text-slate-400 text-xs">
                No hay opciones registradas en este grupo todavía. Haz clic en "Agregar Opción" para registrar la primera.
              </div>

              <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <div
                  v-for="mod in group.modifiers"
                  :key="mod.id"
                  class="flex items-center justify-between p-2.5 rounded-xl border transition-all"
                  :class="mod.is_default === 1 ? 'border-amber-300 bg-amber-50/50 shadow-xs' : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100/70'"
                >
                  <div class="flex-1 min-w-0 pr-2">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <p class="text-xs font-bold text-slate-800 truncate">{{ mod.name }}</p>
                      <span
                        v-if="mod.is_default === 1"
                        class="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300"
                        title="Opción predeterminada al vender"
                      >
                        📌 Default
                      </span>
                    </div>
                    <p class="text-[11px] font-semibold mt-0.5" :class="mod.price_adjustment > 0 ? 'text-indigo-600 font-extrabold' : 'text-slate-400'">
                      {{ mod.price_adjustment > 0 ? `+ S/. ${mod.price_adjustment.toFixed(2)}` : 'Incluido (+S/. 0.00)' }}
                    </p>
                  </div>

                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      @click="handleSetDefaultOption(group.id, mod.id)"
                      class="p-1 rounded transition-colors"
                      :class="mod.is_default === 1 ? 'text-amber-600 bg-amber-100 hover:bg-amber-200' : 'text-slate-300 hover:text-amber-500 hover:bg-white'"
                      :title="mod.is_default === 1 ? 'Opción predeterminada activa' : 'Marcar como opción predeterminada al vender'"
                    >
                      <Pin class="w-3.5 h-3.5" :class="mod.is_default === 1 ? 'fill-amber-500' : ''" />
                    </button>
                    <button
                      @click="openEditOptionModal(group, mod)"
                      class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                      title="Editar Opción"
                    >
                      <Pencil class="w-3.5 h-3.5" />
                    </button>
                    <button
                      @click="handleDeleteOption(mod)"
                      class="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                      title="Eliminar Opción"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ==================== PESTAÑA 3: PERSONAL Y PERMISOS ==================== -->
    <template v-else-if="activeTab === 'users'">
      <!-- Subheader Personal -->
      <div class="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Equipo de Trabajo y Permisos</h3>
          <p class="text-[11px] text-slate-400">Control de colaboradores autorizados para acceder a caja, comandas o ajustes</p>
        </div>

        <button
          @click="openCreateUserModal"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 shrink-0"
        >
          <UserPlus class="w-4 h-4" />
          <span>NUEVO COLABORADOR</span>
        </button>
      </div>

      <!-- Lista de Colaboradores -->
      <div class="flex-1 p-4 sm:p-6 overflow-y-auto pb-20 md:pb-16 space-y-4">
        <!-- Guía Rápida de Roles para la Cafetería -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-sm flex items-start gap-3">
            <div class="p-2 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
              <ShieldCheck class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-900 font-heading">Administrador</h4>
              <p class="text-[11px] text-slate-500 mt-0.5">Control total, edición de productos/precios, usuarios y arqueos.</p>
            </div>
          </div>

          <div class="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-sm flex items-start gap-3">
            <div class="p-2 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
              <Wallet class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-900 font-heading">Cajero</h4>
              <p class="text-[11px] text-slate-500 mt-0.5">Apertura y cierre de caja, cobros y ventas directas.</p>
            </div>
          </div>

          <div class="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-sm flex items-start gap-3">
            <div class="p-2 rounded-xl bg-amber-50 text-amber-700 shrink-0">
              <UtensilsCrossed class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-900 font-heading">Atención / Mozo</h4>
              <p class="text-[11px] text-slate-500 mt-0.5">Toma comandas en salón desde móvil o PC. No puede cobrar ni abrir caja.</p>
            </div>
          </div>
        </div>

        <!-- Tabla de Usuarios -->
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase font-extrabold text-slate-400">
                <th class="py-3 px-4">Colaborador</th>
                <th class="py-3 px-4">Usuario (Login)</th>
                <th class="py-3 px-4">Rol Asignado</th>
                <th class="py-3 px-4">Acceso a Caja</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              <tr v-for="user in authStore.allUsersList" :key="user.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3.5 px-4 font-bold text-slate-900">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                      :class="user.role === 'Administrador'
                        ? 'bg-indigo-100 text-indigo-700'
                        : (user.role === 'Cajero' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')"
                    >
                      {{ user.full_name.charAt(0) }}
                    </div>
                    <div>
                      <span class="block text-xs sm:text-sm font-bold text-slate-900">{{ user.full_name }}</span>
                      <span v-if="user.id === authStore.currentUser?.id" class="text-[10px] text-indigo-600 font-semibold">(Sesión actual)</span>
                    </div>
                  </div>
                </td>

                <td class="py-3.5 px-4 text-xs font-semibold text-slate-600">
                  <code class="px-2 py-1 bg-slate-100 rounded-md text-slate-800">@{{ user.username }}</code>
                </td>

                <td class="py-3.5 px-4">
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                    :class="user.role === 'Administrador'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : (user.role === 'Cajero'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200')"
                  >
                    <ShieldCheck v-if="user.role === 'Administrador'" class="w-3.5 h-3.5 text-indigo-600" />
                    <Wallet v-else-if="user.role === 'Cajero'" class="w-3.5 h-3.5 text-emerald-600" />
                    <UtensilsCrossed v-else class="w-3.5 h-3.5 text-amber-600" />
                    <span>{{ user.role }}</span>
                  </span>
                </td>

                <td class="py-3.5 px-4 text-xs">
                  <span v-if="user.role === 'Administrador' || user.role === 'Cajero'" class="text-emerald-600 font-semibold flex items-center gap-1">
                    <Check class="w-3.5 h-3.5" /> Autorizado
                  </span>
                  <span v-else class="text-slate-400 font-medium flex items-center gap-1">
                    <X class="w-3.5 h-3.5" /> Bloqueado
                  </span>
                </td>

                <td class="py-3.5 px-4">
                  <button
                    @click="handleToggleUser(user)"
                    :disabled="user.id === authStore.currentUser?.id"
                    class="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                    :class="user.active ? 'bg-emerald-500' : 'bg-slate-300'"
                    :title="user.id === authStore.currentUser?.id ? 'No puedes desactivar tu propia sesión' : (user.active ? 'Desactivar acceso' : 'Activar acceso')"
                  >
                    <span
                      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="user.active ? 'translate-x-5' : 'translate-x-0'"
                    />
                  </button>
                </td>

                <td class="py-3.5 px-4 text-right">
                  <button
                    @click="openEditUserModal(user)"
                    class="px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1"
                    title="Editar datos o cambiar PIN"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                    <span>Editar / PIN</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modal Formulario de Producto -->
    <ProductFormModal
      :is-open="isFormModalOpen"
      :product-to-edit="productToEdit"
      @close="isFormModalOpen = false"
    />

    <!-- Modal Formulario de Usuario -->
    <UserFormModal
      :is-open="isUserModalOpen"
      :user-to-edit="userToEdit"
      @close="isUserModalOpen = false"
      @saved="handleUserSaved"
    />

    <!-- Modal Grupo de Modificadores / Variantes -->
    <ModifierGroupModal
      :is-open="isGroupModalOpen"
      :group-to-edit="groupToEdit"
      @close="isGroupModalOpen = false"
      @saved="handleGroupSaved"
    />

    <!-- Modal Opción de Modificador -->
    <ModifierOptionModal
      :is-open="isOptionModalOpen"
      :group-id="activeGroupIdForOption"
      :group-name="activeGroupNameForOption"
      :option-to-edit="optionToEdit"
      @close="isOptionModalOpen = false"
      @saved="handleOptionSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/productStore'
import { useAuthStore } from '@/stores/authStore'
import { Product, ModifierGroup, ModifierOption } from '@shared/types/product'
import { User } from '@shared/types/user'
import ProductFormModal from '@/components/products/ProductFormModal.vue'
import UserFormModal from '@/components/users/UserFormModal.vue'
import ModifierGroupModal from '@/components/products/ModifierGroupModal.vue'
import ModifierOptionModal from '@/components/products/ModifierOptionModal.vue'
import {
  Settings,
  Plus,
  Search,
  Pencil,
  Package,
  Users,
  UserPlus,
  ShieldCheck,
  Wallet,
  UtensilsCrossed,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Trash2,
  Copy,
  Check,
  X,
  Pin
} from 'lucide-vue-next'

const productStore = useProductStore()
const authStore = useAuthStore()

const activeTab = ref<'catalog' | 'modifiers' | 'users'>('catalog')

// Estado Catálogo
const searchQuery = ref('')
const selectedCategory = ref('all')
const isFormModalOpen = ref(false)
const productToEdit = ref<Product | null>(null)

// Estado Modificadores y Variantes
const searchModifierQuery = ref('')
const selectedModifierMode = ref('all')
const isGroupModalOpen = ref(false)
const groupToEdit = ref<ModifierGroup | null>(null)

const isOptionModalOpen = ref(false)
const activeGroupIdForOption = ref('')
const activeGroupNameForOption = ref('')
const optionToEdit = ref<ModifierOption | null>(null)

// Estado Usuarios
const isUserModalOpen = ref(false)
const userToEdit = ref<User | null>(null)

onMounted(async () => {
  await Promise.all([
    productStore.loadCatalog(),
    authStore.loadAllUsers()
  ])
})

const filteredProducts = computed(() => {
  return productStore.products.filter(p => {
    const matchCat = selectedCategory.value === 'all' || p.category_id === selectedCategory.value
    const matchSearch = !searchQuery.value.trim() || p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchCat && matchSearch
  })
})

const filteredModifierGroups = computed(() => {
  return productStore.modifierGroups.filter(g => {
    if (selectedModifierMode.value !== 'all' && g.selection_mode !== selectedModifierMode.value) {
      return false
    }
    if (!searchModifierQuery.value.trim()) return true
    const q = searchModifierQuery.value.toLowerCase()
    const matchGroupName = g.name.toLowerCase().includes(q)
    const matchOptions = g.modifiers?.some(m => m.name.toLowerCase().includes(q))
    return matchGroupName || matchOptions
  })
})

function openCreateModal() {
  productToEdit.value = null
  isFormModalOpen.value = true
}

function openEditModal(product: Product) {
  productToEdit.value = product
  isFormModalOpen.value = true
}

async function toggleActive(product: Product) {
  const nextState = product.active === 1 ? 0 : 1
  await productStore.toggleProductActive(product.id, nextState)
}

// Métodos de Modificadores y Variantes
function openCreateGroupModal() {
  groupToEdit.value = null
  isGroupModalOpen.value = true
}

function openEditGroupModal(group: ModifierGroup) {
  groupToEdit.value = group
  isGroupModalOpen.value = true
}

async function handleDuplicateGroup(group: ModifierGroup) {
  const newName = prompt(`Ingresa el nombre para la copia de "${group.name}":`, `${group.name} (Copia)`)
  if (!newName || !newName.trim()) return

  try {
    await productStore.duplicateModifierGroup(group.id, newName.trim())
  } catch (e: any) {
    alert(e.message || 'Error al duplicar el grupo')
  }
}

async function handleDeleteGroup(group: ModifierGroup) {
  const confirmMsg = group.product_count && group.product_count > 0
    ? `El grupo "${group.name}" está asignado a ${group.product_count} producto(s). ¿Estás seguro de que deseas eliminarlo? Se desvinculará automáticamente de dichos productos.`
    : `¿Estás seguro de eliminar el grupo "${group.name}"?`

  if (!confirm(confirmMsg)) return

  try {
    await productStore.deleteModifierGroup(group.id)
  } catch (e: any) {
    alert(e.message || 'Error al eliminar el grupo')
  }
}

function openAddOptionModal(group: ModifierGroup) {
  activeGroupIdForOption.value = group.id
  activeGroupNameForOption.value = group.name
  optionToEdit.value = null
  isOptionModalOpen.value = true
}

function openEditOptionModal(group: ModifierGroup, option: ModifierOption) {
  activeGroupIdForOption.value = group.id
  activeGroupNameForOption.value = group.name
  optionToEdit.value = option
  isOptionModalOpen.value = true
}

async function handleSetDefaultOption(groupId: string, optionId: string) {
  try {
    await productStore.setDefaultModifierOption(groupId, optionId)
  } catch (e: any) {
    alert(e.message || 'Error al fijar opción predeterminada')
  }
}

async function handleDeleteOption(option: ModifierOption) {
  if (!confirm(`¿Estás seguro de eliminar la opción "${option.name}"?`)) return

  try {
    await productStore.deleteModifierOption(option.id)
  } catch (e: any) {
    alert(e.message || 'Error al eliminar la opción')
  }
}

async function handleGroupSaved() {
  await productStore.loadCatalog()
}

async function handleOptionSaved() {
  await productStore.loadCatalog()
}

// Métodos de Usuarios
function openCreateUserModal() {
  userToEdit.value = null
  isUserModalOpen.value = true
}

function openEditUserModal(user: User) {
  userToEdit.value = user
  isUserModalOpen.value = true
}

async function handleToggleUser(user: User) {
  try {
    const nextState = user.active === 1 ? 0 : 1
    await authStore.toggleUserActive(user.id, nextState)
  } catch (err: any) {
    alert(err.message || 'Error al cambiar estado del colaborador')
  }
}

async function handleUserSaved() {
  await authStore.loadAllUsers()
}
</script>
