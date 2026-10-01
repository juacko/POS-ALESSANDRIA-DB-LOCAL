const { app } = require('electron')
const path = require('path')
const Database = require('better-sqlite3')

app.whenReady().then(() => {
  const dbPath = path.join(process.env.APPDATA || '', 'pos-heladeria', 'pos_database.db')
  console.log(`[Seeder] Conectando a base de datos: ${dbPath}`)
  const db = new Database(dbPath)

  // Desactivar temporalmente foreign keys durante seed masivo para máxima velocidad y evitar desorden
  db.pragma('foreign_keys = OFF')

  // Obtener usuarios existentes
  const users = db.prepare('SELECT id, full_name, role FROM users').all()
  const adminUser = users.find(u => u.role === 'Administrador') || users[0]
  const cashierUser = users.find(u => u.role === 'Cajero') || users[0]
  const meseroUser = users.find(u => u.role === 'Atención') || users[0]

  // Obtener productos existentes
  const products = db.prepare('SELECT id, name, base_price, category_id FROM products WHERE active = 1').all()
  if (products.length === 0) {
    console.error('[Seeder Error] No hay productos en la base de datos.')
    app.quit()
    return
  }

  // Obtener mesas existentes
  const existingTables = db.prepare('SELECT id, name FROM tables').all()

  // Obtener último order_number
  const lastOrder = db.prepare('SELECT MAX(order_number) as max_num FROM orders').get()
  let orderNumberSequence = (lastOrder?.max_num || 0) + 1

  console.log(`[Seeder] Iniciando generación de 30 días de historial (correlativo inicial: #${orderNumberSequence})...`)

  const paymentMethods = ['Efectivo', 'Efectivo', 'Yape/Plin', 'Yape/Plin', 'Tarjeta']

  const insertSession = db.prepare(`
    INSERT INTO cashier_sessions (id, user_id, opening_time, closing_time, initial_cash, expected_cash, actual_cash, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMovement = db.prepare(`
    INSERT INTO cash_movements (id, session_id, type, amount, description, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, order_number, table_id, table_number, cashier_session_id, user_id, status, total_amount, created_at, closed_at)
    VALUES (?, ?, ?, ?, ?, ?, 'Pagada', ?, ?, ?)
  `)

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, final_price, modifiers_detail)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertPayment = db.prepare(`
    INSERT INTO payments (id, order_id, session_id, payment_method, amount, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const now = new Date()
  let totalOrdersInserted = 0
  let totalSessionsInserted = 0
  let totalMovementsInserted = 0

  const seedTransaction = db.transaction(() => {
    // Generar de hace 30 días hasta hoy (día 0)
    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() - dayOffset)
      const dateStr = targetDate.toISOString().split('T')[0]
      const dayOfWeek = targetDate.getDay() // 0 = Domingo, 5 = Viernes, 6 = Sábado
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6

      // Fines de semana: 26 a 40 pedidos. Días laborables: 14 a 22 pedidos.
      const baseOrders = isWeekend ? 26 : 14
      const ordersCount = baseOrders + Math.floor(Math.random() * (isWeekend ? 14 : 8))

      // Sesión de Caja del día
      const sessionId = `cs-seed-${dateStr}-1`
      const isToday = dayOffset === 0
      const sessionOpenTime = `${dateStr} 09:00:00`
      const sessionCloseTime = isToday ? null : `${dateStr} 22:30:00`
      const sessionStatus = isToday ? 'Abierta' : 'Cerrada'
      const initialCash = 100.00

      let sessionCashPayments = 0
      let sessionCardPayments = 0
      let sessionYapePayments = 0

      // Movimientos manuales de caja
      const manualIncomesList = [
        { amount: 10.00, desc: 'Sencillo inicial en monedas de S/. 1 y S/. 2' },
        { amount: 20.00, desc: 'Cambio de sencillo para caja' },
        { amount: 15.00, desc: 'Fondo de contingencia para cambio' }
      ]
      const manualExpensesList = [
        { amount: 12.00, desc: 'Compra de hielo de emergencia' },
        { amount: 8.50, desc: 'Servilletas y pajillas descartables' },
        { amount: 15.00, desc: 'Frutas frescas para jugos y milkshakes' }
      ]

      let manualIncomesTotal = 0
      let manualExpensesTotal = 0

      // Movimiento 1: Ingreso (sencillo)
      const incomeSample = manualIncomesList[dayOffset % manualIncomesList.length]
      const movIncId = `cm-seed-${dateStr}-inc`
      insertMovement.run(movIncId, sessionId, 'Ingreso', incomeSample.amount, incomeSample.desc, `${dateStr} 10:15:00`)
      manualIncomesTotal += incomeSample.amount
      totalMovementsInserted++

      // Movimiento 2: Egreso ocasional (cada 2 días)
      if (dayOffset % 2 === 0) {
        const expenseSample = manualExpensesList[dayOffset % manualExpensesList.length]
        const movExpId = `cm-seed-${dateStr}-exp`
        insertMovement.run(movExpId, sessionId, 'Egreso', expenseSample.amount, expenseSample.desc, `${dateStr} 16:45:00`)
        manualExpensesTotal += expenseSample.amount
        totalMovementsInserted++
      }

      // Generar órdenes a lo largo del día
      for (let i = 0; i < ordersCount; i++) {
        // Horas pico de heladería/cafetería (15:00 a 21:00)
        let hour = 9 + Math.floor(Math.random() * 13)
        if (Math.random() < 0.65) {
          hour = 15 + Math.floor(Math.random() * 6)
        }
        const min = Math.floor(Math.random() * 59)
        const sec = Math.floor(Math.random() * 59)
        const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
        const orderCreated = `${dateStr} ${timeStr}`

        const closeMin = (min + 15 + Math.floor(Math.random() * 20)) % 60
        const closeHour = hour + (min + 20 >= 60 ? 1 : 0)
        const orderClosed = `${dateStr} ${String(closeHour).padStart(2, '0')}:${String(closeMin).padStart(2, '0')}:${String(sec).padStart(2, '0')}`

        const orderId = `ord-seed-${dateStr}-${i + 1}`
        const currentOrderNum = orderNumberSequence++

        // Mesa o Rápido
        const isRapido = Math.random() < 0.35 || existingTables.length === 0
        let tableId = null
        let tableNumber = 'RAPIDO'

        if (!isRapido && existingTables.length > 0) {
          const selectedTable = existingTables[Math.floor(Math.random() * existingTables.length)]
          tableId = selectedTable.id
          tableNumber = selectedTable.name.replace('Mesa ', '')
        }

        // Atendido por
        const waiterRoll = Math.random()
        const orderUser = waiterRoll < 0.6 ? meseroUser : (waiterRoll < 0.85 ? cashierUser : adminUser)

        // Preparar ítems de la orden (1 a 3 productos)
        const itemsInOrder = 1 + Math.floor(Math.random() * 3)
        const itemsToInsert = []
        let orderTotalAmount = 0

        for (let it = 0; it < itemsInOrder; it++) {
          const prod = products[Math.floor(Math.random() * products.length)]
          const qty = Math.random() < 0.75 ? 1 : 2
          const unitPrice = prod.base_price
          const finalPrice = unitPrice * qty

          itemsToInsert.push({
            id: `item-seed-${orderId}-${it + 1}`,
            productId: prod.id,
            productName: prod.name,
            quantity: qty,
            unitPrice,
            finalPrice
          })

          orderTotalAmount += finalPrice
        }

        // 1. Insertar Orden principal
        insertOrder.run(
          orderId,
          currentOrderNum,
          tableId,
          tableNumber,
          sessionId,
          orderUser.id,
          orderTotalAmount,
          orderCreated,
          orderClosed
        )

        // 2. Insertar ítems
        for (const item of itemsToInsert) {
          insertOrderItem.run(
            item.id,
            orderId,
            item.productId,
            item.productName,
            item.quantity,
            item.unitPrice,
            item.finalPrice,
            '[]'
          )
        }

        // 3. Registrar Pago
        const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
        const paymentId = `pay-seed-${orderId}`
        insertPayment.run(paymentId, orderId, sessionId, method, orderTotalAmount, orderClosed)

        if (method === 'Efectivo') sessionCashPayments += orderTotalAmount
        else if (method === 'Tarjeta') sessionCardPayments += orderTotalAmount
        else if (method === 'Yape/Plin') sessionYapePayments += orderTotalAmount

        totalOrdersInserted++
      }

      // Calcular cierre de sesión de caja
      const expectedCash = initialCash + sessionCashPayments + manualIncomesTotal - manualExpensesTotal

      let actualCash = expectedCash
      let notes = 'Cierre de turno conforme.'

      // Simular un par de descuadres leves en días pasados para validar las alertas
      if (dayOffset === 7) {
        actualCash = expectedCash + 2.00
        notes = 'Sobrante de S/. 2.00 por redondeo de cambio.'
      } else if (dayOffset === 14) {
        actualCash = expectedCash - 1.50
        notes = 'Faltante de S/. 1.50 en sencillo.'
      }

      insertSession.run(
        sessionId,
        cashierUser.id,
        sessionOpenTime,
        sessionCloseTime,
        initialCash,
        expectedCash,
        isToday ? expectedCash : actualCash,
        notes,
        sessionStatus
      )

      totalSessionsInserted++
    }
  })

  seedTransaction()

  // Restaurar foreign keys
  db.pragma('foreign_keys = ON')

  console.log(`\n✅ [Seeder Exitoso] Resumen de datos generados:`)
  console.log(`   - Días generados: 30 días de historial`)
  console.log(`   - Sesiones de caja: ${totalSessionsInserted}`)
  console.log(`   - Movimientos de caja (Ingresos/Egresos): ${totalMovementsInserted}`)
  console.log(`   - Órdenes pagadas: ${totalOrdersInserted}`)
  console.log(`   - Próximo correlativo de orden: #${orderNumberSequence}`)

  app.quit()
})
