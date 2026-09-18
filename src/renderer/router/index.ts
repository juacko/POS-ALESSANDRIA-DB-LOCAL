import { createRouter, createWebHashHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import TablesView from '../views/TablesView.vue'
import PosView from '../views/PosView.vue'
import OrdersView from '../views/OrdersView.vue'
import CashierView from '../views/CashierView.vue'
import SettingsView from '../views/SettingsView.vue'
import { useAuthStore } from '../stores/authStore'

const routes = [
  { path: '/', redirect: '/tables' },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/tables', name: 'tables', component: TablesView },
  { path: '/pos', name: 'pos', component: PosView },
  { path: '/quick-order', name: 'quick-order', component: PosView },
  { path: '/orders', name: 'orders', component: OrdersView },
  {
    path: '/cashier',
    name: 'cashier',
    component: CashierView,
    meta: { roles: ['Administrador', 'Cajero'] }
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { roles: ['Administrador'] }
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, _, next) => {
  const authStore = useAuthStore()

  // 1. Redirigir a login si no hay sesión activa
  if (to.name !== 'login' && !authStore.currentUser) {
    next({ name: 'login' })
    return
  }

  // 2. Control de acceso por roles (RBAC)
  const allowedRoles = to.meta.roles as string[] | undefined
  if (allowedRoles && authStore.currentUser) {
    if (!allowedRoles.includes(authStore.currentUser.role)) {
      alert(`Acceso restringido: Esta sección está reservada para personal con perfil ${allowedRoles.join(' o ')}.`)
      next({ name: 'tables' })
      return
    }
  }

  next()
})
