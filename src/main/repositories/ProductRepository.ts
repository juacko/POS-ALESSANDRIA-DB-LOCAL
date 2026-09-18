import { getDatabase } from '../database/connection'
import { Product, Category, ModifierGroup, ModifierOption } from '@shared/types/product'
import { randomUUID } from 'crypto'

export class ProductRepository {
  static getCategories(): Category[] {
    const db = getDatabase()
    return db.prepare('SELECT * FROM categories ORDER BY display_order ASC, name ASC').all() as Category[]
  }

  static getProducts(activeOnly = true): Product[] {
    const db = getDatabase()
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `
    if (activeOnly) {
      query += ' WHERE p.active = 1'
    }
    query += ' ORDER BY p.name ASC'

    const products = db.prepare(query).all() as Product[]

    // Para cada producto, traer sus grupos de modificadores y opciones
    return products.map(product => {
      const groups = db.prepare(`
        SELECT mg.* 
        FROM modifier_groups mg
        JOIN product_modifier_groups pmg ON mg.id = pmg.group_id
        WHERE pmg.product_id = ?
      `).all(product.id) as ModifierGroup[]

      const modifierGroups = groups.map(group => {
        const modifiers = db.prepare(`
          SELECT * FROM modifiers WHERE group_id = ?
        `).all(group.id) as ModifierOption[]
        return { ...group, modifiers }
      })

      return { ...product, modifier_groups: modifierGroups }
    })
  }

  static createProduct(product: Partial<Product>, modifierGroupIds: string[] = []): Product {
    const db = getDatabase()
    const id = product.id || `p-${Date.now()}`
    
    const stmt = db.prepare(`
      INSERT INTO products (id, name, category_id, base_price, active)
      VALUES (?, ?, ?, ?, ?)
    `)
    stmt.run(id, product.name, product.category_id, product.base_price, product.active ?? 1)

    // Asociar grupos de modificadores
    if (modifierGroupIds.length > 0) {
      const linkStmt = db.prepare(`
        INSERT INTO product_modifier_groups (product_id, group_id) VALUES (?, ?)
      `)
      for (const groupId of modifierGroupIds) {
        linkStmt.run(id, groupId)
      }
    }

    return this.getProductById(id)!
  }

  static updateProduct(id: string, product: Partial<Product>, modifierGroupIds?: string[]): Product {
    const db = getDatabase()
    
    const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, category_id = ?, base_price = ?, active = ?
      WHERE id = ?
    `)
    stmt.run(product.name, product.category_id, product.base_price, product.active ?? 1, id)

    if (modifierGroupIds !== undefined) {
      // Borrar asociaciones previas y reinsertar
      db.prepare('DELETE FROM product_modifier_groups WHERE product_id = ?').run(id)
      const linkStmt = db.prepare('INSERT INTO product_modifier_groups (product_id, group_id) VALUES (?, ?)')
      for (const groupId of modifierGroupIds) {
        linkStmt.run(id, groupId)
      }
    }

    return this.getProductById(id)!
  }

  static toggleProductActive(id: string, active: number): boolean {
    const db = getDatabase()
    const res = db.prepare('UPDATE products SET active = ? WHERE id = ?').run(active, id)
    return res.changes > 0
  }

  static getProductById(id: string): Product | null {
    const db = getDatabase()
    const product = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id) as Product | undefined

    if (!product) return null

    const groups = db.prepare(`
      SELECT mg.* 
      FROM modifier_groups mg
      JOIN product_modifier_groups pmg ON mg.id = pmg.group_id
      WHERE pmg.product_id = ?
    `).all(product.id) as ModifierGroup[]

    const modifierGroups = groups.map(group => {
      const modifiers = db.prepare(`
        SELECT * FROM modifiers WHERE group_id = ?
      `).all(group.id) as ModifierOption[]
      return { ...group, modifiers }
    })

    return { ...product, modifier_groups: modifierGroups }
  }

  static getModifierGroups(): ModifierGroup[] {
    const db = getDatabase()
    const groups = db.prepare('SELECT * FROM modifier_groups ORDER BY name ASC').all() as ModifierGroup[]
    return groups.map(group => {
      const modifiers = db.prepare('SELECT * FROM modifiers WHERE group_id = ?').all(group.id) as ModifierOption[]
      return { ...group, modifiers }
    })
  }
}
