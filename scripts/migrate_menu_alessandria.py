import os
import sqlite3

def run_migration():
    appdata = os.environ.get('APPDATA', '')
    db_path = os.path.join(appdata, 'pos-heladeria', 'pos_database.db')
    
    if not os.path.exists(db_path):
        print(f"Base de datos no encontrada en: {db_path}")
        return

    print(f"Conectando a SQLite: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")

    # 1. Desactivar productos demo anteriores
    cursor.execute("UPDATE products SET active = 0 WHERE id IN ('p-1','p-2','p-3','p-4','p-5','p-6','p-7','p-8','p-9','p-10')")

    # 2. Manejo dinámico e idempotente de categorías
    existing_cats = dict(cursor.execute("SELECT name, id FROM categories").fetchall())
    
    desired_cats = [
        ('Heladería', 1, 'cat-helados'),
        ('Waffles & Postres', 2, 'cat-waffles'),
        ('Frappez', 3, 'cat-frappez'),
        ('Jugos y Bebidas', 4, 'cat-jugos'),
        ('Milk Shake', 5, 'cat-milkshakes'),
        ('Calentitos', 6, 'cat-calentitos')
    ]

    cat_map = {}
    for name, order, default_id in desired_cats:
        if name in existing_cats:
            cat_id = existing_cats[name]
            cursor.execute("UPDATE categories SET display_order = ? WHERE id = ?", (order, cat_id))
            cat_map[default_id] = cat_id
        elif default_id == 'cat-calentitos' and 'Cafetería' in existing_cats:
            cat_id = existing_cats['Cafetería']
            cursor.execute("UPDATE categories SET name = 'Calentitos', display_order = ? WHERE id = ?", (order, cat_id))
            cat_map[default_id] = cat_id
        elif default_id == 'cat-waffles' and 'Postres & Waffles' in existing_cats:
            cat_id = existing_cats['Postres & Waffles']
            cursor.execute("UPDATE categories SET name = 'Waffles & Postres', display_order = ? WHERE id = ?", (order, cat_id))
            cat_map[default_id] = cat_id
        else:
            cursor.execute("INSERT INTO categories (id, name, display_order) VALUES (?, ?, ?)", (default_id, name, order))
            cat_map[default_id] = default_id

    # Si existe 'Bar & Coctelería', moverla al final
    if 'Bar & Coctelería' in existing_cats:
        cursor.execute("UPDATE categories SET display_order = 99 WHERE name = 'Bar & Coctelería'")

    # 3. Grupos de Modificadores
    modifier_groups = [
        ('mg-sabor-1', 'Sabor de Helado (1 Bola)', 'single', 1),
        ('mg-sabor-2', 'Sabores de Helado (2 Bolas)', 'multiple_limited', 2),
        ('mg-sabor-3', 'Sabores de Helado (3 Bolas)', 'multiple_limited', 3),
        ('mg-pres-helado', 'Presentación del Helado', 'single', 1),
        ('mg-toppings', 'Toppings y Adicionales', 'multiple_unlimited', 5),
        ('mg-tamano-frappe', 'Tamaño de Frappe', 'single', 1),
        ('mg-tamano-jugo-leche', 'Tamaño de Jugo', 'single', 1),
        ('mg-tamano-jugo-simple', 'Tamaño de Jugo', 'single', 1),
        ('mg-tamano-ensalada', 'Tamaño de Ensalada', 'single', 1),
        ('mg-extras-ensalada', 'Adicionales Ensalada', 'multiple_unlimited', 4),
        ('mg-leche', 'Tipo de Leche', 'single', 1),
        ('mg-infusiones', 'Variedad de Infusión', 'single', 1)
    ]
    cursor.executemany("""
        INSERT INTO modifier_groups (id, name, selection_mode, selection_limit)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            selection_mode = excluded.selection_mode,
            selection_limit = excluded.selection_limit
    """, modifier_groups)

    # 4. Modificadores
    ice_cream_flavors = [
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

    modifiers = []
    # mg-sabor-1
    for idx, flavor in enumerate(ice_cream_flavors, 1):
        modifiers.append((f'm-s1-{idx}', 'mg-sabor-1', flavor, 0.00))
    # mg-sabor-2
    for idx, flavor in enumerate(ice_cream_flavors, 1):
        modifiers.append((f'm-s2-{idx}', 'mg-sabor-2', flavor, 0.00))
    # mg-sabor-3
    for idx, flavor in enumerate(ice_cream_flavors, 1):
        modifiers.append((f'm-s3-{idx}', 'mg-sabor-3', flavor, 0.00))

    # Presentación Helado
    modifiers.extend([
        ('m-p-vaso', 'mg-pres-helado', 'En Vaso / Tulipa', 0.00),
        ('m-p-cono', 'mg-pres-helado', 'En Cono Artesanal', 0.00),
        ('m-p-cono-esp', 'mg-pres-helado', 'Cono Bañado Especial', 1.50)
    ])

    # Toppings
    modifiers.extend([
        ('m-top-fudge', 'mg-toppings', 'Fudge de Chocolate', 1.50),
        ('m-top-fresa', 'mg-toppings', 'Jarabe de Fresa', 1.50),
        ('m-top-chantilly', 'mg-toppings', 'Chantilly Cream', 2.00),
        ('m-top-pecanas', 'mg-toppings', 'Pecanas Picadas', 2.50),
        ('m-top-grageas', 'mg-toppings', 'Grageas de Colores', 1.00),
        ('m-top-barquillo', 'mg-toppings', 'Barquillo Adicional', 1.00)
    ])

    # Tamaños Frappe
    modifiers.extend([
        ('m-tf-10oz', 'mg-tamano-frappe', '10 oz (Mediano)', 0.00),
        ('m-tf-12oz', 'mg-tamano-frappe', '12 oz (Grande)', 2.00)
    ])

    # Tamaños Jugos
    modifiers.extend([
        ('m-tjl-500', 'mg-tamano-jugo-leche', 'Vaso 500 ml', 0.00),
        ('m-tjl-1000', 'mg-tamano-jugo-leche', 'Jarra 1 Litro', 5.00),
        ('m-tjs-500', 'mg-tamano-jugo-simple', 'Vaso 500 ml', 0.00),
        ('m-tjs-1000', 'mg-tamano-jugo-simple', 'Jarra 1 Litro', 4.00)
    ])

    # Tamaño Ensalada
    modifiers.extend([
        ('m-te-med', 'mg-tamano-ensalada', 'Mediana', 0.00),
        ('m-te-grd', 'mg-tamano-ensalada', 'Grande', 5.00)
    ])

    # Extras Ensalada
    modifiers.extend([
        ('m-ee-miel', 'mg-extras-ensalada', 'Miel de Abeja', 1.50),
        ('m-ee-algarrobina', 'mg-extras-ensalada', 'Algarrobina', 1.50),
        ('m-ee-yogurt', 'mg-extras-ensalada', 'Yogurt Natural', 2.00),
        ('m-ee-helado', 'mg-extras-ensalada', 'Bola de Helado Artesanal', 4.00)
    ])

    # Tipo de Leche
    modifiers.extend([
        ('m-l-entera', 'mg-leche', 'Leche Entera', 0.00),
        ('m-l-deslac', 'mg-leche', 'Leche Deslactosada', 1.00),
        ('m-l-almen', 'mg-leche', 'Leche de Almendras', 2.50)
    ])

    # Infusiones
    modifiers.extend([
        ('m-inf-manz', 'mg-infusiones', 'Manzanilla', 0.00),
        ('m-inf-anis', 'mg-infusiones', 'Anís', 0.00),
        ('m-inf-te', 'mg-infusiones', 'Té Negro', 0.00),
        ('m-inf-hierba', 'mg-infusiones', 'Hierbaluisa', 0.00)
    ])

    cursor.executemany("""
        INSERT INTO modifiers (id, group_id, name, price_adjustment)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            group_id = excluded.group_id,
            name = excluded.name,
            price_adjustment = excluded.price_adjustment
    """, modifiers)

    # 5. Productos
    products = [
        # Heladería
        ('p-h-1', 'Helado 1 Bola', cat_map['cat-helados'], 4.00, 1),
        ('p-h-2', 'Helado 2 Bolas', cat_map['cat-helados'], 7.00, 1),
        ('p-h-3', 'Helado 3 Bolas', cat_map['cat-helados'], 10.00, 1),
        ('p-h-copa', 'Copa Especial Alessandria', cat_map['cat-helados'], 13.00, 1),

        # Wafles & Postres
        ('p-w-1', 'Wafle con Frutas', cat_map['cat-waffles'], 14.00, 1),
        ('p-w-2', 'Wafle con Frutas y Helado', cat_map['cat-waffles'], 17.00, 1),
        ('p-w-3', 'Wafle con Frutas y 2 Sabores de Helado', cat_map['cat-waffles'], 19.00, 1),
        ('p-p-banana', 'Banana Split Clásico', cat_map['cat-waffles'], 15.00, 1),
        ('p-p-ensalada', 'Ensalada de Frutas', cat_map['cat-waffles'], 10.00, 1),

        # Frappez
        ('p-f-oreo', 'Frappe de Oreo', cat_map['cat-frappez'], 10.00, 1),
        ('p-f-capuchino', 'Frappe de Capuchino', cat_map['cat-frappez'], 10.00, 1),
        ('p-f-mocca', 'Frappe de Mocca', cat_map['cat-frappez'], 10.00, 1),
        ('p-f-capuoreo', 'Frappe de Capuoreo', cat_map['cat-frappez'], 10.00, 1),
        ('p-f-maracuya', 'Frappe de Maracuyá', cat_map['cat-frappez'], 8.00, 1),
        ('p-f-mango', 'Frappe de Mango', cat_map['cat-frappez'], 8.00, 1),

        # Jugos y Bebidas
        ('p-j-platano', 'Plátano con Leche', cat_map['cat-jugos'], 10.00, 1),
        ('p-j-mango-leche', 'Mango con Leche', cat_map['cat-jugos'], 10.00, 1),
        ('p-j-fresa-leche', 'Fresa con Leche', cat_map['cat-jugos'], 10.00, 1),
        ('p-j-pina', 'Jugo de Piña', cat_map['cat-jugos'], 8.00, 1),
        ('p-j-maracuya', 'Jugo de Maracuyá', cat_map['cat-jugos'], 8.00, 1),
        ('p-j-limonada', 'Limonada Natural', cat_map['cat-jugos'], 8.00, 1),

        # Milk Shakes
        ('p-ms-chocolate', 'Milk Shake de Chocolate', cat_map['cat-milkshakes'], 15.00, 1),
        ('p-ms-fresa', 'Milk Shake de Fresa', cat_map['cat-milkshakes'], 15.00, 1),
        ('p-ms-mango', 'Milk Shake de Mango', cat_map['cat-milkshakes'], 15.00, 1),
        ('p-ms-maracuya', 'Milk Shake de Maracuyá', cat_map['cat-milkshakes'], 15.00, 1),
        ('p-ms-personalizado', 'Milk Shake Personalizado (Elige Helado)', cat_map['cat-milkshakes'], 15.00, 1),

        # Calentitos
        ('p-c-emoliente', 'Emoliente Tradicional', cat_map['cat-calentitos'], 5.00, 1),
        ('p-c-cafe', 'Café Pasado / Tradicional', cat_map['cat-calentitos'], 5.00, 1),
        ('p-c-infusiones', 'Infusiones Naturales', cat_map['cat-calentitos'], 3.00, 1),
    ]

    cursor.executemany("""
        INSERT INTO products (id, name, category_id, base_price, active)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            category_id = excluded.category_id,
            base_price = excluded.base_price,
            active = excluded.active
    """, products)

    # 6. Relaciones Producto <-> Grupos de Modificadores
    prod_mod_relations = [
        # Helados
        ('p-h-1', 'mg-sabor-1'),
        ('p-h-1', 'mg-pres-helado'),
        ('p-h-1', 'mg-toppings'),
        ('p-h-2', 'mg-sabor-2'),
        ('p-h-2', 'mg-pres-helado'),
        ('p-h-2', 'mg-toppings'),
        ('p-h-3', 'mg-sabor-3'),
        ('p-h-3', 'mg-pres-helado'),
        ('p-h-3', 'mg-toppings'),
        ('p-h-copa', 'mg-sabor-3'),
        ('p-h-copa', 'mg-toppings'),

        # Wafles & Postres
        ('p-w-1', 'mg-toppings'),
        ('p-w-2', 'mg-sabor-1'),
        ('p-w-2', 'mg-toppings'),
        ('p-w-3', 'mg-sabor-2'),
        ('p-w-3', 'mg-toppings'),
        ('p-p-banana', 'mg-sabor-3'),
        ('p-p-banana', 'mg-toppings'),
        ('p-p-ensalada', 'mg-tamano-ensalada'),
        ('p-p-ensalada', 'mg-extras-ensalada'),

        # Frappez
        ('p-f-oreo', 'mg-tamano-frappe'),
        ('p-f-oreo', 'mg-leche'),
        ('p-f-oreo', 'mg-toppings'),
        ('p-f-capuchino', 'mg-tamano-frappe'),
        ('p-f-capuchino', 'mg-leche'),
        ('p-f-capuchino', 'mg-toppings'),
        ('p-f-mocca', 'mg-tamano-frappe'),
        ('p-f-mocca', 'mg-leche'),
        ('p-f-mocca', 'mg-toppings'),
        ('p-f-capuoreo', 'mg-tamano-frappe'),
        ('p-f-capuoreo', 'mg-leche'),
        ('p-f-capuoreo', 'mg-toppings'),
        ('p-f-maracuya', 'mg-tamano-frappe'),
        ('p-f-maracuya', 'mg-toppings'),
        ('p-f-mango', 'mg-tamano-frappe'),
        ('p-f-mango', 'mg-toppings'),

        # Jugos y Bebidas
        ('p-j-platano', 'mg-tamano-jugo-leche'),
        ('p-j-platano', 'mg-leche'),
        ('p-j-mango-leche', 'mg-tamano-jugo-leche'),
        ('p-j-mango-leche', 'mg-leche'),
        ('p-j-fresa-leche', 'mg-tamano-jugo-leche'),
        ('p-j-fresa-leche', 'mg-leche'),
        ('p-j-pina', 'mg-tamano-jugo-simple'),
        ('p-j-maracuya', 'mg-tamano-jugo-simple'),
        ('p-j-limonada', 'mg-tamano-jugo-simple'),

        # Milk Shakes
        ('p-ms-chocolate', 'mg-toppings'),
        ('p-ms-fresa', 'mg-toppings'),
        ('p-ms-mango', 'mg-toppings'),
        ('p-ms-maracuya', 'mg-toppings'),
        ('p-ms-personalizado', 'mg-sabor-1'),
        ('p-ms-personalizado', 'mg-toppings'),

        # Calentitos
        ('p-c-cafe', 'mg-leche'),
        ('p-c-infusiones', 'mg-infusiones'),
    ]

    # Limpiar solo las relaciones de los productos de la carta para reinsertar limpiamente
    product_ids = [p[0] for p in products]
    cursor.execute(f"DELETE FROM product_modifier_groups WHERE product_id IN ({','.join(['?']*len(product_ids))})", product_ids)

    cursor.executemany("""
        INSERT OR IGNORE INTO product_modifier_groups (product_id, group_id)
        VALUES (?, ?)
    """, prod_mod_relations)

    conn.commit()
    print("Migración completada exitosamente.")

    # Resumen
    c_count = cursor.execute("SELECT count(*) FROM categories").fetchone()[0]
    p_count = cursor.execute("SELECT count(*) FROM products WHERE active = 1").fetchone()[0]
    mg_count = cursor.execute("SELECT count(*) FROM modifier_groups").fetchone()[0]
    m_count = cursor.execute("SELECT count(*) FROM modifiers").fetchone()[0]
    pmg_count = cursor.execute("SELECT count(*) FROM product_modifier_groups").fetchone()[0]

    print(f"Resumen DB:")
    print(f" - Categorías: {c_count}")
    print(f" - Productos Activos: {p_count}")
    print(f" - Grupos de Modificadores: {mg_count}")
    print(f" - Modificadores: {m_count}")
    print(f" - Relaciones Producto-Modificador: {pmg_count}")

    conn.close()

if __name__ == '__main__':
    run_migration()
