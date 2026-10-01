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

  // 3. Categorías por defecto (Alessandria Heladería Artesanal)
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
  if (catCount.count === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (id, name, display_order) VALUES (?, ?, ?)
    `)
    insertCat.run('cat-helados', 'Heladería', 1)
    insertCat.run('cat-waffles', 'Waffles & Postres', 2)
    insertCat.run('cat-frappez', 'Frappez', 3)
    insertCat.run('cat-jugos', 'Jugos y Bebidas', 4)
    insertCat.run('cat-milkshakes', 'Milk Shake', 5)
    insertCat.run('cat-calentitos', 'Calentitos', 6)

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

    // Sabores de Helado
    const iceCreamFlavors = [
      'Vainilla Francesa',
      'Chocolate Fudgy',
      'Fresa Artesanal',
      'Lúcuma Criolla',
      'Menta Chip',
      'Maracuyá',
      'Mango',
      'Oreo Cream',
      'Capuchino Mocca'
    ]

    // Grupo: Sabor de Helado (1 Bola)
    insertGroup.run('mg-sabor-1', 'Sabor de Helado (1 Bola)', 'single', 1)
    iceCreamFlavors.forEach((flavor, idx) => {
      insertMod.run(`m-s1-${idx + 1}`, 'mg-sabor-1', flavor, 0.00)
    })

    // Grupo: Sabores de Helado (2 Bolas)
    insertGroup.run('mg-sabor-2', 'Sabores de Helado (2 Bolas)', 'multiple_limited', 2)
    iceCreamFlavors.forEach((flavor, idx) => {
      insertMod.run(`m-s2-${idx + 1}`, 'mg-sabor-2', flavor, 0.00)
    })

    // Grupo: Sabores de Helado (3 Bolas / Copa Especial / Banana Split)
    insertGroup.run('mg-sabor-3', 'Sabores de Helado (3 Bolas)', 'multiple_limited', 3)
    iceCreamFlavors.forEach((flavor, idx) => {
      insertMod.run(`m-s3-${idx + 1}`, 'mg-sabor-3', flavor, 0.00)
    })

    // Grupo: Presentación Helado
    insertGroup.run('mg-pres-helado', 'Presentación del Helado', 'single', 1)
    insertMod.run('m-p-vaso', 'mg-pres-helado', 'En Vaso / Tulipa', 0.00)
    insertMod.run('m-p-cono', 'mg-pres-helado', 'En Cono Artesanal', 0.00)
    insertMod.run('m-p-cono-esp', 'mg-pres-helado', 'Cono Bañado Especial', 1.50)

    // Grupo: Toppings y Salsas
    insertGroup.run('mg-toppings', 'Toppings y Adicionales', 'multiple_unlimited', 5)
    insertMod.run('m-top-fudge', 'mg-toppings', 'Fudge de Chocolate', 1.50)
    insertMod.run('m-top-fresa', 'mg-toppings', 'Jarabe de Fresa', 1.50)
    insertMod.run('m-top-chantilly', 'mg-toppings', 'Chantilly Cream', 2.00)
    insertMod.run('m-top-pecanas', 'mg-toppings', 'Pecanas Picadas', 2.50)
    insertMod.run('m-top-grageas', 'mg-toppings', 'Grageas de Colores', 1.00)
    insertMod.run('m-top-barquillo', 'mg-toppings', 'Barquillo Adicional', 1.00)

    // Grupo: Tamaños Frappe
    insertGroup.run('mg-tamano-frappe', 'Tamaño de Frappe', 'single', 1)
    insertMod.run('m-tf-10oz', 'mg-tamano-frappe', '10 oz (Mediano)', 0.00)
    insertMod.run('m-tf-12oz', 'mg-tamano-frappe', '12 oz (Grande)', 2.00)

    // Grupo: Tamaños Jugo con Leche
    insertGroup.run('mg-tamano-jugo-leche', 'Tamaño de Jugo', 'single', 1)
    insertMod.run('m-tjl-500', 'mg-tamano-jugo-leche', 'Vaso 500 ml', 0.00)
    insertMod.run('m-tjl-1000', 'mg-tamano-jugo-leche', 'Jarra 1 Litro', 5.00)

    // Grupo: Tamaños Jugo Simple
    insertGroup.run('mg-tamano-jugo-simple', 'Tamaño de Jugo', 'single', 1)
    insertMod.run('m-tjs-500', 'mg-tamano-jugo-simple', 'Vaso 500 ml', 0.00)
    insertMod.run('m-tjs-1000', 'mg-tamano-jugo-simple', 'Jarra 1 Litro', 4.00)

    // Grupo: Tamaño Ensalada de Frutas
    insertGroup.run('mg-tamano-ensalada', 'Tamaño de Ensalada', 'single', 1)
    insertMod.run('m-te-med', 'mg-tamano-ensalada', 'Mediana', 0.00)
    insertMod.run('m-te-grd', 'mg-tamano-ensalada', 'Grande', 5.00)

    // Grupo: Extras Ensalada de Frutas
    insertGroup.run('mg-extras-ensalada', 'Adicionales Ensalada', 'multiple_unlimited', 4)
    insertMod.run('m-ee-miel', 'mg-extras-ensalada', 'Miel de Abeja', 1.50)
    insertMod.run('m-ee-algarrobina', 'mg-extras-ensalada', 'Algarrobina', 1.50)
    insertMod.run('m-ee-yogurt', 'mg-extras-ensalada', 'Yogurt Natural', 2.00)
    insertMod.run('m-ee-helado', 'mg-extras-ensalada', 'Bola de Helado Artesanal', 4.00)

    // Grupo: Tipo de Leche
    insertGroup.run('mg-leche', 'Tipo de Leche', 'single', 1)
    insertMod.run('m-l-entera', 'mg-leche', 'Leche Entera', 0.00)
    insertMod.run('m-l-deslac', 'mg-leche', 'Leche Deslactosada', 1.00)
    insertMod.run('m-l-almen', 'mg-leche', 'Leche de Almendras', 2.50)

    // Grupo: Variedad de Infusión
    insertGroup.run('mg-infusiones', 'Variedad de Infusión', 'single', 1)
    insertMod.run('m-inf-manz', 'mg-infusiones', 'Manzanilla', 0.00)
    insertMod.run('m-inf-anis', 'mg-infusiones', 'Anís', 0.00)
    insertMod.run('m-inf-te', 'mg-infusiones', 'Té Negro', 0.00)
    insertMod.run('m-inf-hierba', 'mg-infusiones', 'Hierbaluisa', 0.00)

    // 5. Productos de la Carta
    const insertProd = db.prepare(`
      INSERT INTO products (id, name, category_id, base_price, active) VALUES (?, ?, ?, ?, 1)
    `)

    // HELADERÍA
    insertProd.run('p-h-1', 'Helado 1 Bola', 'cat-helados', 4.00)
    insertProdModGroup.run('p-h-1', 'mg-sabor-1')
    insertProdModGroup.run('p-h-1', 'mg-pres-helado')
    insertProdModGroup.run('p-h-1', 'mg-toppings')

    insertProd.run('p-h-2', 'Helado 2 Bolas', 'cat-helados', 7.00)
    insertProdModGroup.run('p-h-2', 'mg-sabor-2')
    insertProdModGroup.run('p-h-2', 'mg-pres-helado')
    insertProdModGroup.run('p-h-2', 'mg-toppings')

    insertProd.run('p-h-3', 'Helado 3 Bolas', 'cat-helados', 10.00)
    insertProdModGroup.run('p-h-3', 'mg-sabor-3')
    insertProdModGroup.run('p-h-3', 'mg-pres-helado')
    insertProdModGroup.run('p-h-3', 'mg-toppings')

    insertProd.run('p-h-copa', 'Copa Especial Alessandria', 'cat-helados', 13.00)
    insertProdModGroup.run('p-h-copa', 'mg-sabor-3')
    insertProdModGroup.run('p-h-copa', 'mg-toppings')

    // WAFLES & POSTRES
    insertProd.run('p-w-1', 'Wafle con Frutas', 'cat-waffles', 14.00)
    insertProdModGroup.run('p-w-1', 'mg-toppings')

    insertProd.run('p-w-2', 'Wafle con Frutas y Helado', 'cat-waffles', 17.00)
    insertProdModGroup.run('p-w-2', 'mg-sabor-1')
    insertProdModGroup.run('p-w-2', 'mg-toppings')

    insertProd.run('p-w-3', 'Wafle con Frutas y 2 Sabores de Helado', 'cat-waffles', 19.00)
    insertProdModGroup.run('p-w-3', 'mg-sabor-2')
    insertProdModGroup.run('p-w-3', 'mg-toppings')

    insertProd.run('p-p-banana', 'Banana Split Clásico', 'cat-waffles', 15.00)
    insertProdModGroup.run('p-p-banana', 'mg-sabor-3')
    insertProdModGroup.run('p-p-banana', 'mg-toppings')

    insertProd.run('p-p-ensalada', 'Ensalada de Frutas', 'cat-waffles', 10.00)
    insertProdModGroup.run('p-p-ensalada', 'mg-tamano-ensalada')
    insertProdModGroup.run('p-p-ensalada', 'mg-extras-ensalada')

    // FRAPPEZ
    insertProd.run('p-f-oreo', 'Frappe de Oreo', 'cat-frappez', 10.00)
    insertProdModGroup.run('p-f-oreo', 'mg-tamano-frappe')
    insertProdModGroup.run('p-f-oreo', 'mg-leche')
    insertProdModGroup.run('p-f-oreo', 'mg-toppings')

    insertProd.run('p-f-capuchino', 'Frappe de Capuchino', 'cat-frappez', 10.00)
    insertProdModGroup.run('p-f-capuchino', 'mg-tamano-frappe')
    insertProdModGroup.run('p-f-capuchino', 'mg-leche')
    insertProdModGroup.run('p-f-capuchino', 'mg-toppings')

    insertProd.run('p-f-mocca', 'Frappe de Mocca', 'cat-frappez', 10.00)
    insertProdModGroup.run('p-f-mocca', 'mg-tamano-frappe')
    insertProdModGroup.run('p-f-mocca', 'mg-leche')
    insertProdModGroup.run('p-f-mocca', 'mg-toppings')

    insertProd.run('p-f-capuoreo', 'Frappe de Capuoreo', 'cat-frappez', 10.00)
    insertProdModGroup.run('p-f-capuoreo', 'mg-tamano-frappe')
    insertProdModGroup.run('p-f-capuoreo', 'mg-leche')
    insertProdModGroup.run('p-f-capuoreo', 'mg-toppings')

    insertProd.run('p-f-maracuya', 'Frappe de Maracuyá', 'cat-frappez', 8.00)
    insertProdModGroup.run('p-f-maracuya', 'mg-tamano-frappe')
    insertProdModGroup.run('p-f-maracuya', 'mg-toppings')

    insertProd.run('p-f-mango', 'Frappe de Mango', 'cat-frappez', 8.00)
    insertProdModGroup.run('p-f-mango', 'mg-tamano-frappe')
    insertProdModGroup.run('p-f-mango', 'mg-toppings')

    // JUGOS Y BEBIDAS
    insertProd.run('p-j-platano', 'Plátano con Leche', 'cat-jugos', 10.00)
    insertProdModGroup.run('p-j-platano', 'mg-tamano-jugo-leche')
    insertProdModGroup.run('p-j-platano', 'mg-leche')

    insertProd.run('p-j-mango-leche', 'Mango con Leche', 'cat-jugos', 10.00)
    insertProdModGroup.run('p-j-mango-leche', 'mg-tamano-jugo-leche')
    insertProdModGroup.run('p-j-mango-leche', 'mg-leche')

    insertProd.run('p-j-fresa-leche', 'Fresa con Leche', 'cat-jugos', 10.00)
    insertProdModGroup.run('p-j-fresa-leche', 'mg-tamano-jugo-leche')
    insertProdModGroup.run('p-j-fresa-leche', 'mg-leche')

    insertProd.run('p-j-pina', 'Jugo de Piña', 'cat-jugos', 8.00)
    insertProdModGroup.run('p-j-pina', 'mg-tamano-jugo-simple')

    insertProd.run('p-j-maracuya', 'Jugo de Maracuyá', 'cat-jugos', 8.00)
    insertProdModGroup.run('p-j-maracuya', 'mg-tamano-jugo-simple')

    insertProd.run('p-j-limonada', 'Limonada Natural', 'cat-jugos', 8.00)
    insertProdModGroup.run('p-j-limonada', 'mg-tamano-jugo-simple')

    // MILK SHAKES
    insertProd.run('p-ms-chocolate', 'Milk Shake de Chocolate', 'cat-milkshakes', 15.00)
    insertProdModGroup.run('p-ms-chocolate', 'mg-toppings')

    insertProd.run('p-ms-fresa', 'Milk Shake de Fresa', 'cat-milkshakes', 15.00)
    insertProdModGroup.run('p-ms-fresa', 'mg-toppings')

    insertProd.run('p-ms-mango', 'Milk Shake de Mango', 'cat-milkshakes', 15.00)
    insertProdModGroup.run('p-ms-mango', 'mg-toppings')

    insertProd.run('p-ms-maracuya', 'Milk Shake de Maracuyá', 'cat-milkshakes', 15.00)
    insertProdModGroup.run('p-ms-maracuya', 'mg-toppings')

    insertProd.run('p-ms-personalizado', 'Milk Shake Personalizado (Elige Helado)', 'cat-milkshakes', 15.00)
    insertProdModGroup.run('p-ms-personalizado', 'mg-sabor-1')
    insertProdModGroup.run('p-ms-personalizado', 'mg-toppings')

    // CALENTITOS
    insertProd.run('p-c-emoliente', 'Emoliente Tradicional', 'cat-calentitos', 5.00)

    insertProd.run('p-c-cafe', 'Café Pasado / Tradicional', 'cat-calentitos', 5.00)
    insertProdModGroup.run('p-c-cafe', 'mg-leche')

    insertProd.run('p-c-infusiones', 'Infusiones Naturales', 'cat-calentitos', 3.00)
    insertProdModGroup.run('p-c-infusiones', 'mg-infusiones')
  }
}
