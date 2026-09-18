import http from 'http'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { app } from 'electron'
import { TableRepository } from '../repositories/TableRepository'
import { ProductRepository } from '../repositories/ProductRepository'
import { OrderRepository } from '../repositories/OrderRepository'
import { CashierRepository } from '../repositories/CashierRepository'
import { getDatabase } from '../database/connection'
import { registerSSEClient, notifySync } from '../events/syncBus'

const PORT = 3000

export function getLocalIPAddress(): string {
  const interfaces = os.networkInterfaces()
  const candidates: string[] = []

  for (const name of Object.keys(interfaces)) {
    const isVirtual = /virtual|wsl|vEthernet|hyper-v|loopback|bluetooth/i.test(name)
    const iface = interfaces[name]
    if (!iface) continue

    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal && !alias.address.startsWith('169.254.')) {
        // Prioridad máxima: red típica de router Wi-Fi 192.168.x.x en adaptador físico
        if (alias.address.startsWith('192.168.') && !isVirtual) {
          return alias.address
        }
        if (!isVirtual) {
          candidates.unshift(alias.address)
        } else {
          candidates.push(alias.address)
        }
      }
    }
  }

  return candidates[0] || '127.0.0.1'
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
          const ip = getLocalIPAddress()
          res.end(JSON.stringify({ ip, port: PORT, url: `http://${ip}:${PORT}` }))
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

        if (pathname === '/api/orders/history' && req.method === 'GET') {
          const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10)
          const orders = OrderRepository.getOrdersHistory(limit)
          res.end(JSON.stringify(orders))
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
