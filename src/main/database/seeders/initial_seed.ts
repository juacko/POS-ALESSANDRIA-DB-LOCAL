import Database from 'better-sqlite3'

export function seedInitialData(db: Database.Database) {
  // 1. Usuarios por defecto
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, username, password_hash, full_name, role, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `)
    insertUser.run('u-admin', 'admin', 'admin123', 'Administrador General', 'Administrador')
    insertUser.run('u-cajero', 'cajero', 'cajero123', 'Cajero Principal', 'Cajero')
    insertUser.run('u-mesero', 'atencion', 'atencion123', 'Atención al Cliente', 'Atención')
  }

  // 2. Mesas por defecto
  const tableCount = db.prepare('SELECT COUNT(*) as count FROM tables').get() as { count: number }
  if (tableCount.count === 0) {
    const insertTable = db.prepare(`
      INSERT INTO tables (id, name, zone, status) VALUES (?, ?, ?, 'Disponible')
    `)
    // Salón
    insertTable.run('t-1', 'Mesa 1', 'Salón')
    insertTable.run('t-2', 'Mesa 2', 'Salón')
    insertTable.run('t-3', 'Mesa 3', 'Salón')
    insertTable.run('t-4', 'Mesa 4', 'Salón')
    // Terraza
    insertTable.run('t-5', 'Mesa 5', 'Terraza')
    insertTable.run('t-6', 'Mesa 6', 'Terraza')
    insertTable.run('t-7', 'Mesa 7', 'Terraza')
    // Barra
    insertTable.run('t-8', 'Barra 1', 'Barra')
  }

  // 3. Categorías por defecto
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
  if (catCount.count === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (id, name, display_order) VALUES (?, ?, ?)
    `)
    insertCat.run('cat-1', 'Cafetería', 1)
    insertCat.run('cat-2', 'Heladería', 2)
    insertCat.run('cat-3', 'Bar & Coctelería', 3)
    insertCat.run('cat-4', 'Postres & Waffles', 4)

    // 4. Modificadores
    const insertGroup = db.prepare(`
      INSERT INTO modifier_groups (id, name, selection_mode, selection_limit) VALUES (?, ?, ?, ?)
    `)
    const insertMod = db.prepare(`
      INSERT INTO modifiers (id, group_id, name, price_adjustment) VALUES (?, ?, ?, ?)
    `)
    const insertProdModGroup = db.prepare(`
      INSERT INTO product_modifier_groups (product_id, group_id) VALUES (?, ?)
    `)

    // Grupo 1: Tipo de Leche (Café)
    insertGroup.run('mg-leche', 'Tipo de Leche', 'single', 1)
    insertMod.run('m-l1', 'mg-leche', 'Leche Entera', 0.00)
    insertMod.run('m-l2', 'mg-leche', 'Leche Deslactosada', 1.00)
    insertMod.run('m-l3', 'mg-leche', 'Leche de Almendras', 2.50)

    // Grupo 2: Sabores de Helado (Heladería)
    insertGroup.run('mg-helado', 'Sabores de Helado', 'multiple_limited', 2)
    insertMod.run('m-h1', 'mg-helado', 'Bola de Vainilla', 0.00)
    insertMod.run('m-h2', 'mg-helado', 'Bola de Chocolate Fudgy', 0.00)
    insertMod.run('m-h3', 'mg-helado', 'Bola de Lucuma Criolla', 0.00)
    insertMod.run('m-h4', 'mg-helado', 'Bola de Menta Chip', 0.00)

    // Grupo 3: Toppings Adicionales
    insertGroup.run('mg-toppings', 'Toppings Adicionales', 'multiple_unlimited', 5)
    insertMod.run('m-t1', 'mg-toppings', 'Fudge de Chocolate', 1.50)
    insertMod.run('m-t2', 'mg-toppings', 'Chantilly Cream', 2.00)
    insertMod.run('m-t3', 'mg-toppings', 'Pecanas Picadas', 2.50)

    // 5. Productos
    const insertProd = db.prepare(`
      INSERT INTO products (id, name, category_id, base_price, active) VALUES (?, ?, ?, ?, 1)
    `)
    // Café
    insertProd.run('p-1', 'Espresso Doble', 'cat-1', 7.50)
    insertProd.run('p-2', 'Cappuccino Italiano', 'cat-1', 10.00)
    insertProd.run('p-3', 'Latte Caramelo', 'cat-1', 12.00)

    // Helados
    insertProd.run('p-4', 'Copa de Helado (2 Bolas)', 'cat-2', 14.00)
    insertProd.run('p-5', 'Milkshake de Lucuma', 'cat-2', 16.00)
    insertProd.run('p-6', 'Sundae Especial Min Min', 'cat-2', 18.50)

    // Coctelería
    insertProd.run('p-7', 'Pisco Sour Tradicional', 'cat-3', 22.00)
    insertProd.run('p-8', 'Mojito Clásico', 'cat-3', 20.00)

    // Postres
    insertProd.run('p-9', 'Waffle Nutella & Plátano', 'cat-4', 19.00)
    insertProd.run('p-10', 'Cheesecake de Frutos Rojos', 'cat-4', 15.00)

    // Vincular productos con grupos de modificadores
    insertProdModGroup.run('p-2', 'mg-leche')
    insertProdModGroup.run('p-3', 'mg-leche')
    insertProdModGroup.run('p-4', 'mg-helado')
    insertProdModGroup.run('p-4', 'mg-toppings')
    insertProdModGroup.run('p-6', 'mg-helado')
    insertProdModGroup.run('p-6', 'mg-toppings')
  }
}
