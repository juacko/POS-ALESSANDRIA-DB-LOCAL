import http from 'http'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { app } from 'electron'
import { TableRepository } from '../repositories/TableRepository'
import { ProductRepository } from '../repositories/ProductRepository'
import { OrderRepository } from '../repositories/OrderRepository'
import { CashierRepository } from '../repositories/CashierRepository'
import { ReportRepository } from '../repositories/ReportRepository'
import { getDatabase } from '../database/connection'
import { registerSSEClient, notifySync } from '../events/syncBus'

const PORT = 3000

export interface NetworkInterfaceItem {
  name: string
  ip: string
  isDefault: boolean
}

export function getAvailableNetworkInterfaces(): NetworkInterfaceItem[] {
  const interfaces = os.networkInterfaces()
  const physicalItems: { name: string; ip: string; priority: number }[] = []
  const virtualItems: { name: string; ip: string; priority: number }[] = []

  // Filtro estricto contra adaptadores virtuales de máquinas virtuales, contenedores y VPNs
  const virtualRegex = /vmware|vmnet|virtual|vbox|docker|wsl|vethernet|hyper-v|loopback|bluetooth|tailscale|zerotier|tap|tun/i

  for (const name of Object.keys(interfaces)) {
    const isVirtual = virtualRegex.test(name)
    const iface = interfaces[name]
    if (!iface) continue

    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal && !alias.address.startsWith('169.254.')) {
        let priority = 5
        const isWiFi = /wi-?fi|wlan|inalámbric/i.test(name)
        const isEthernet = /ethernet|lan|en\d/i.test(name)

        if (isWiFi) priority = 10
        else if (isEthernet) priority = 8
        else if (alias.address.startsWith('192.168.')) priority = 7
        else if (alias.address.startsWith('10.') || alias.address.startsWith('172.')) priority = 6

        if (!isVirtual) {
          physicalItems.push({ name, ip: alias.address, priority })
        } else {
          virtualItems.push({ name: `${name} (Virtual)`, ip: alias.address, priority: 1 })
        }
      }
    }
  }

  // Ordenar adaptadores físicos por prioridad (Wi-Fi real primero)
  physicalItems.sort((a, b) => b.priority - a.priority)

  const all = [...physicalItems, ...virtualItems]
  if (all.length === 0) {
    return [{ name: 'Localhost', ip: '127.0.0.1', isDefault: true }]
  }

  return all.map((item, index) => ({
    name: item.name,
    ip: item.ip,
    isDefault: index === 0
  }))
}

export function getLocalIPAddress(): string {
  const list = getAvailableNetworkInterfaces()
  return list[0]?.ip || '127.0.0.1'
}

function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

export function startLocalServer() {
  const distPath = app && app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar/dist')
    : path.join(__dirname, '../../dist')

  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    const pathname = urlObj.pathname

    try {
      // 1. API Endpoints
      if (pathname.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')

        if (pathname === '/api/events' && req.method === 'GET') {
          registerSSEClient(req, res)
          return
        }

        if (pathname === '/api/network-info' && req.method === 'GET') {
          const interfaces = getAvailableNetworkInterfaces()
          const ip = interfaces[0]?.ip || '127.0.0.1'
          res.end(JSON.stringify({ ip, port: PORT, url: `http://${ip}:${PORT}`, interfaces }))
          return
        }

        if (pathname === '/api/tables' && req.method === 'GET') {
          const tables = TableRepository.getTables()
          res.end(JSON.stringify(tables))
          return
        }

        if (pathname === '/api/categories' && req.method === 'GET') {
          const categories = ProductRepository.getCategories()
          res.end(JSON.stringify(categories))
          return
        }

        if (pathname === '/api/categories/create' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const cat = ProductRepository.createCategory(data)
          notifySync('products')
          res.end(JSON.stringify(cat))
          return
        }

        if (pathname === '/api/categories/update' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const cat = ProductRepository.updateCategory(data.id, data)
          notifySync('products')
          res.end(JSON.stringify(cat))
          return
        }

        if (pathname === '/api/categories/delete' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const success = ProductRepository.deleteCategory(data.id)
          notifySync('products')
          res.end(JSON.stringify({ success }))
          return
        }

        if (pathname === '/api/products' && req.method === 'GET') {
          const products = ProductRepository.getProducts(true)
          res.end(JSON.stringify(products))
          return
        }

        if (pathname === '/api/modifier-groups' && req.method === 'GET') {
          const groups = ProductRepository.getModifierGroups()
          res.end(JSON.stringify(groups))
          return
        }

        if (pathname === '/api/modifier-groups/create' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const group = ProductRepository.createModifierGroup(data)
          notifySync('products')
          res.end(JSON.stringify(group))
          return
        }

        if (pathname === '/api/modifier-groups/update' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const group = ProductRepository.updateModifierGroup(data.id, data)
          notifySync('products')
          res.end(JSON.stringify(group))
          return
        }

        if (pathname === '/api/modifier-groups/delete' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const success = ProductRepository.deleteModifierGroup(data.id)
          notifySync('products')
          res.end(JSON.stringify({ success }))
          return
        }

        if (pathname === '/api/modifier-groups/duplicate' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const group = ProductRepository.duplicateModifierGroup(data.id, data.name)
          notifySync('products')
          res.end(JSON.stringify(group))
          return
        }

        if (pathname === '/api/modifiers/create' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const mod = ProductRepository.createModifierOption(data)
          notifySync('products')
          res.end(JSON.stringify(mod))
          return
        }

        if (pathname === '/api/modifiers/update' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const mod = ProductRepository.updateModifierOption(data.id, data)
          notifySync('products')
          res.end(JSON.stringify(mod))
          return
        }

        if (pathname === '/api/modifiers/set-default' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const success = ProductRepository.setDefaultModifierOption(data.groupId, data.optionId)
          notifySync('products')
          res.end(JSON.stringify({ success }))
          return
        }

        if (pathname === '/api/modifiers/delete' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const success = ProductRepository.deleteModifierOption(data.id)
          notifySync('products')
          res.end(JSON.stringify({ success }))
          return
        }

        if (pathname.startsWith('/api/orders/table/') && req.method === 'GET') {
          const tableId = pathname.replace('/api/orders/table/', '')
          const order = OrderRepository.getActiveOrderByTable(tableId)
          res.end(JSON.stringify(order))
          return
        }

        if (pathname === '/api/orders/create' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const order = OrderRepository.createOrder(
            data.tableId,
            data.tableNumber,
            data.userId,
            data.sessionId,
            data.items
          )
          // Notificar de inmediato actualización de mesas y órdenes a desktop y demás móviles
          notifySync('tables')
          notifySync('orders')
          res.end(JSON.stringify(order))
          return
        }

        if (pathname === '/api/orders/save-items' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          OrderRepository.saveOrderItems(data.orderId, data.items)
          const order = OrderRepository.getOrderById(data.orderId)
          // Notificar actualización de mesas y órdenes
          notifySync('tables')
          notifySync('orders')
          res.end(JSON.stringify(order))
          return
        }

        if (pathname === '/api/orders/pay' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const order = OrderRepository.registerPaymentsAndClose(
            data.orderId,
            data.sessionId,
            data.payments
          )
          // Notificar de inmediato a todas las pantallas (desktop y móviles)
          notifySync('tables')
          notifySync('orders')
          notifySync('cashier')
          res.end(JSON.stringify(order))
          return
        }

        if (pathname === '/api/orders/active' && req.method === 'GET') {
          const orders = OrderRepository.getActiveOrders()
          res.end(JSON.stringify(orders))
          return
        }

        if (pathname === '/api/orders/toggle-item-served' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const success = OrderRepository.toggleItemServed(data.itemId)
          notifySync('orders')
          res.end(JSON.stringify({ success }))
          return
        }

        if (pathname === '/api/orders/mark-all-served' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const success = OrderRepository.markAllOrderItemsServed(data.orderId)
          notifySync('orders')
          res.end(JSON.stringify({ success }))
          return
        }

        if (pathname === '/api/orders/history' && req.method === 'GET') {
          const limit = parseInt(urlObj.searchParams.get('limit') || '100', 10)
          const orders = OrderRepository.getOrdersHistory(limit)
          res.end(JSON.stringify(orders))
          return
        }

        if (pathname === '/api/orders/cancel' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const order = OrderRepository.cancelActiveOrder(data.orderId, data.reason, data.userId, data.userName)
          notifySync('tables')
          notifySync('orders')
          res.end(JSON.stringify(order))
          return
        }

        if (pathname === '/api/orders/delete-payment' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const order = OrderRepository.deleteOrderPayments(
            data.orderId,
            data.reason,
            data.destinationStatus,
            data.userId,
            data.userName
          )
          notifySync('tables')
          notifySync('orders')
          notifySync('cashier')
          res.end(JSON.stringify(order))
          return
        }

        if (pathname === '/api/orders/change-payment-method' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const order = OrderRepository.changeOrderPaymentMethod(
            data.orderId,
            data.newPayments,
            data.reason,
            data.userId,
            data.userName
          )
          notifySync('tables')
          notifySync('orders')
          notifySync('cashier')
          res.end(JSON.stringify(order))
          return
        }

        if (pathname === '/api/cashier/active-session' && req.method === 'GET') {
          const session = CashierRepository.getActiveSession()
          res.end(JSON.stringify(session))
          return
        }

        if (pathname === '/api/cashier/open' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const session = CashierRepository.openSession(data.userId, data.initialCash)
          notifySync('cashier')
          res.end(JSON.stringify(session))
          return
        }

        if (pathname === '/api/cashier/close' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const session = CashierRepository.closeSession(data.sessionId, data.actualCash, data.notes)
          notifySync('cashier')
          res.end(JSON.stringify(session))
          return
        }

        if (pathname === '/api/cashier/movements' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const movement = CashierRepository.addMovement(data.sessionId, data.type, data.amount, data.description)
          notifySync('cashier')
          res.end(JSON.stringify(movement))
          return
        }

        if (pathname === '/api/cashier/movements' && req.method === 'GET') {
          const sessionId = urlObj.searchParams.get('sessionId') || ''
          const movements = CashierRepository.getMovements(sessionId)
          res.end(JSON.stringify(movements))
          return
        }

        if (pathname === '/api/cashier/session-totals' && req.method === 'GET') {
          const sessionId = urlObj.searchParams.get('sessionId') || ''
          const initialCash = parseFloat(urlObj.searchParams.get('initialCash') || '0')
          const totals = CashierRepository.calculateSessionTotals(sessionId, initialCash)
          res.end(JSON.stringify(totals))
          return
        }

        if (pathname === '/api/users' && req.method === 'GET') {
          const db = getDatabase()
          const users = db.prepare('SELECT id, username, full_name, role, active FROM users WHERE active = 1').all()
          res.end(JSON.stringify(users))
          return
        }

        if (pathname === '/api/users/login' && req.method === 'POST') {
          const data = await parseJsonBody(req)
          const db = getDatabase()
          const user = db.prepare('SELECT id, username, full_name, role, active FROM users WHERE username = ? AND password_hash = ? AND active = 1')
            .get(data.username, data.pin)
          if (!user) {
            res.writeHead(401)
            res.end(JSON.stringify({ error: 'Credenciales inválidas' }))
            return
          }
          res.end(JSON.stringify(user))
          return
        }

        if (pathname === '/api/reports/sales-summary' && req.method === 'GET') {
          const startDate = urlObj.searchParams.get('startDate') || ''
          const endDate = urlObj.searchParams.get('endDate') || ''
          const summary = ReportRepository.getSalesSummary(startDate, endDate)
          res.end(JSON.stringify(summary))
          return
        }

        if (pathname === '/api/reports/sales-trend' && req.method === 'GET') {
          const startDate = urlObj.searchParams.get('startDate') || ''
          const endDate = urlObj.searchParams.get('endDate') || ''
          const groupBy = (urlObj.searchParams.get('groupBy') as 'hour' | 'day') || 'hour'
          const trend = ReportRepository.getSalesTrend(startDate, endDate, groupBy)
          res.end(JSON.stringify(trend))
          return
        }

        if (pathname === '/api/reports/top-products' && req.method === 'GET') {
          const startDate = urlObj.searchParams.get('startDate') || ''
          const endDate = urlObj.searchParams.get('endDate') || ''
          const limit = parseInt(urlObj.searchParams.get('limit') || '15')
          const categoryId = urlObj.searchParams.get('categoryId') || undefined
          const top = ReportRepository.getTopProducts(startDate, endDate, limit, categoryId)
          res.end(JSON.stringify(top))
          return
        }

        if (pathname === '/api/reports/category-sales' && req.method === 'GET') {
          const startDate = urlObj.searchParams.get('startDate') || ''
          const endDate = urlObj.searchParams.get('endDate') || ''
          const cats = ReportRepository.getCategorySales(startDate, endDate)
          res.end(JSON.stringify(cats))
          return
        }

        if (pathname === '/api/reports/cashier-sessions' && req.method === 'GET') {
          const startDate = urlObj.searchParams.get('startDate') || ''
          const endDate = urlObj.searchParams.get('endDate') || ''
          const sessions = ReportRepository.getCashierSessionsHistory(startDate, endDate)
          res.end(JSON.stringify(sessions))
          return
        }

        if (pathname === '/api/reports/staff-sales' && req.method === 'GET') {
          const startDate = urlObj.searchParams.get('startDate') || ''
          const endDate = urlObj.searchParams.get('endDate') || ''
          const staff = ReportRepository.getStaffSales(startDate, endDate)
          res.end(JSON.stringify(staff))
          return
        }

        if (pathname === '/api/reports/export-data' && req.method === 'GET') {
          const startDate = urlObj.searchParams.get('startDate') || ''
          const endDate = urlObj.searchParams.get('endDate') || ''
          const exportData = ReportRepository.getDetailedOrdersForExport(startDate, endDate)
          res.end(JSON.stringify(exportData))
          return
        }

        res.writeHead(404)
        res.end(JSON.stringify({ error: 'Endpoint no encontrado' }))
        return
      }

      // 2. Servir Archivos Estáticos del Frontend Web (Para celulares/tablets en Wi-Fi)
      let filePath = path.join(distPath, pathname)
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html')
      }

      if (!fs.existsSync(filePath)) {
        // Fallback a index.html para Vue SPA History Mode
        filePath = path.join(distPath, 'index.html')
      }

      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase()
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream'
        res.writeHead(200, { 'Content-Type': mimeType })
        fs.createReadStream(filePath).pipe(res)
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(`
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"><title>Alessandria POS - Comandera</title></head>
            <body style="font-family:sans-serif;text-align:center;padding:40px;">
              <h2>Alessandria POS Móvil 📱</h2>
              <p>Servidor local activo en el puerto ${PORT}.</p>
              <p style="color:#666;">Ejecuta <code>npm run build</code> para generar los archivos estáticos de la interfaz móvil.</p>
            </body>
          </html>
        `)
      }
    } catch (err: any) {
      console.error('[LocalServer Error]', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message || 'Error interno del servidor' }))
    }
  })

  server.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIPAddress()
    console.log(`[LocalServer] Servidor Móvil activo en: http://${ip}:${PORT}`)
  })

  return server
}
