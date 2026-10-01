import { getDatabase } from '../database/connection'
import { Product, Category, ModifierGroup, ModifierOption, ProductModifierGroupConfig } from '@shared/types/product'
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

    // Para cada producto, traer sus grupos de modificadores y opciones con overrides
    return products.map(product => {
      const groups = db.prepare(`
        SELECT mg.*, pmg.override_mode, pmg.override_limit
        FROM modifier_groups mg
        JOIN product_modifier_groups pmg ON mg.id = pmg.group_id
        WHERE pmg.product_id = ?
      `).all(product.id) as (ModifierGroup & { override_mode: any; override_limit: any })[]

      const modifierGroups = groups.map(group => {
        const modifiers = db.prepare(`
          SELECT * FROM modifiers WHERE group_id = ? ORDER BY is_default DESC, price_adjustment ASC, name ASC
        `).all(group.id) as ModifierOption[]

        const effectiveMode = group.override_mode || group.selection_mode
        const effectiveLimit = group.override_limit !== null && group.override_limit !== undefined
          ? group.override_limit
          : (effectiveMode === 'single' ? 1 : group.selection_limit)

        return {
          ...group,
          selection_mode: effectiveMode,
          selection_limit: effectiveLimit,
          override_mode: group.override_mode,
          override_limit: group.override_limit,
          modifiers
        }
      })

      return { ...product, modifier_groups: modifierGroups }
    })
  }

  static createProduct(product: Partial<Product>, modifierGroups: (string | ProductModifierGroupConfig)[] = []): Product {
    const db = getDatabase()
    const id = product.id || `p-${Date.now()}`
    
    const stmt = db.prepare(`
      INSERT INTO products (id, name, category_id, base_price, active)
      VALUES (?, ?, ?, ?, ?)
    `)
    stmt.run(id, product.name, product.category_id, product.base_price, product.active ?? 1)

    // Asociar grupos de modificadores con posibles overrides
    if (modifierGroups && modifierGroups.length > 0) {
      const linkStmt = db.prepare(`
        INSERT INTO product_modifier_groups (product_id, group_id, override_mode, override_limit)
        VALUES (?, ?, ?, ?)
      `)
      for (const item of modifierGroups) {
        const groupId = typeof item === 'string' ? item : item.group_id
        const overrideMode = typeof item === 'object' && item.override_mode ? item.override_mode : null
        const overrideLimit = typeof item === 'object' && item.override_limit !== undefined && item.override_limit !== null
          ? Number(item.override_limit)
          : null
        linkStmt.run(id, groupId, overrideMode, overrideLimit)
      }
    }

    return this.getProductById(id)!
  }

  static updateProduct(id: string, product: Partial<Product>, modifierGroups?: (string | ProductModifierGroupConfig)[]): Product {
    const db = getDatabase()
    
    const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, category_id = ?, base_price = ?, active = ?
      WHERE id = ?
    `)
    stmt.run(product.name, product.category_id, product.base_price, product.active ?? 1, id)

    if (modifierGroups !== undefined) {
      // Borrar asociaciones previas y reinsertar con overrides
      db.prepare('DELETE FROM product_modifier_groups WHERE product_id = ?').run(id)
      const linkStmt = db.prepare(`
        INSERT INTO product_modifier_groups (product_id, group_id, override_mode, override_limit)
        VALUES (?, ?, ?, ?)
      `)
      for (const item of modifierGroups) {
        const groupId = typeof item === 'string' ? item : item.group_id
        const overrideMode = typeof item === 'object' && item.override_mode ? item.override_mode : null
        const overrideLimit = typeof item === 'object' && item.override_limit !== undefined && item.override_limit !== null
          ? Number(item.override_limit)
          : null
        linkStmt.run(id, groupId, overrideMode, overrideLimit)
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
      SELECT mg.*, pmg.override_mode, pmg.override_limit
      FROM modifier_groups mg
      JOIN product_modifier_groups pmg ON mg.id = pmg.group_id
      WHERE pmg.product_id = ?
    `).all(product.id) as (ModifierGroup & { override_mode: any; override_limit: any })[]

    const modifierGroups = groups.map(group => {
      const modifiers = db.prepare(`
        SELECT * FROM modifiers WHERE group_id = ? ORDER BY is_default DESC, price_adjustment ASC, name ASC
      `).all(group.id) as ModifierOption[]

      const effectiveMode = group.override_mode || group.selection_mode
      const effectiveLimit = group.override_limit !== null && group.override_limit !== undefined
        ? group.override_limit
        : (effectiveMode === 'single' ? 1 : group.selection_limit)

      return {
        ...group,
        selection_mode: effectiveMode,
        selection_limit: effectiveLimit,
        override_mode: group.override_mode,
        override_limit: group.override_limit,
        modifiers
      }
    })

    return { ...product, modifier_groups: modifierGroups }
  }

  static getModifierGroups(): ModifierGroup[] {
    const db = getDatabase()
    const groups = db.prepare('SELECT * FROM modifier_groups ORDER BY name ASC').all() as ModifierGroup[]
    return groups.map(group => {
      const modifiers = db.prepare('SELECT * FROM modifiers WHERE group_id = ? ORDER BY is_default DESC, price_adjustment ASC, name ASC').all(group.id) as ModifierOption[]

      const linkedProducts = db.prepare(`
        SELECT p.name 
        FROM products p
        JOIN product_modifier_groups pmg ON p.id = pmg.product_id
        WHERE pmg.group_id = ?
        ORDER BY p.name ASC
      `).all(group.id) as { name: string }[]

      return {
        ...group,
        modifiers,
        product_count: linkedProducts.length,
        product_names: linkedProducts.map(p => p.name)
      }
    })
  }

  static createModifierGroup(data: { name: string; selection_mode: 'single' | 'multiple_unlimited' | 'multiple_limited'; selection_limit?: number }): ModifierGroup {
    const db = getDatabase()
    const id = `mg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const limit = data.selection_mode === 'single' ? 1 : (Number(data.selection_limit) || 1)
    
    db.prepare(`
      INSERT INTO modifier_groups (id, name, selection_mode, selection_limit)
      VALUES (?, ?, ?, ?)
    `).run(id, data.name.trim(), data.selection_mode, limit)

    return {
      id,
      name: data.name.trim(),
      selection_mode: data.selection_mode,
      selection_limit: limit,
      modifiers: [],
      product_count: 0,
      product_names: []
    }
  }

  static updateModifierGroup(id: string, data: { name: string; selection_mode: 'single' | 'multiple_unlimited' | 'multiple_limited'; selection_limit?: number }): ModifierGroup {
    const db = getDatabase()
    const limit = data.selection_mode === 'single' ? 1 : (Number(data.selection_limit) || 1)

    db.prepare(`
      UPDATE modifier_groups
      SET name = ?, selection_mode = ?, selection_limit = ?
      WHERE id = ?
    `).run(data.name.trim(), data.selection_mode, limit, id)

    const modifiers = db.prepare('SELECT * FROM modifiers WHERE group_id = ? ORDER BY is_default DESC, price_adjustment ASC, name ASC').all(id) as ModifierOption[]
    const linkedProducts = db.prepare(`
      SELECT p.name 
      FROM products p
      JOIN product_modifier_groups pmg ON p.id = pmg.product_id
      WHERE pmg.group_id = ?
      ORDER BY p.name ASC
    `).all(id) as { name: string }[]

    return {
      id,
      name: data.name.trim(),
      selection_mode: data.selection_mode,
      selection_limit: limit,
      modifiers,
      product_count: linkedProducts.length,
      product_names: linkedProducts.map(p => p.name)
    }
  }

  static deleteModifierGroup(id: string): boolean {
    const db = getDatabase()
    db.prepare('DELETE FROM product_modifier_groups WHERE group_id = ?').run(id)
    db.prepare('DELETE FROM modifiers WHERE group_id = ?').run(id)
    const res = db.prepare('DELETE FROM modifier_groups WHERE id = ?').run(id)
    return res.changes > 0
  }

  static createModifierOption(data: { group_id: string; name: string; price_adjustment: number; is_default?: number }): ModifierOption {
    const db = getDatabase()
    const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const priceAdj = Number(data.price_adjustment) || 0
    const isDefault = data.is_default ? 1 : 0

    if (isDefault === 1) {
      db.prepare('UPDATE modifiers SET is_default = 0 WHERE group_id = ?').run(data.group_id)
    }

    db.prepare(`
      INSERT INTO modifiers (id, group_id, name, price_adjustment, is_default)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.group_id, data.name.trim(), priceAdj, isDefault)

    return {
      id,
      group_id: data.group_id,
      name: data.name.trim(),
      price_adjustment: priceAdj,
      is_default: isDefault
    }
  }

  static updateModifierOption(id: string, data: { name: string; price_adjustment: number; is_default?: number }): ModifierOption {
    const db = getDatabase()
    const current = db.prepare('SELECT * FROM modifiers WHERE id = ?').get(id) as ModifierOption | undefined
    const priceAdj = Number(data.price_adjustment) || 0
    const isDefault = data.is_default !== undefined ? (data.is_default ? 1 : 0) : (current?.is_default || 0)

    if (isDefault === 1 && current) {
      db.prepare('UPDATE modifiers SET is_default = 0 WHERE group_id = ?').run(current.group_id)
    }

    db.prepare(`
      UPDATE modifiers
      SET name = ?, price_adjustment = ?, is_default = ?
      WHERE id = ?
    `).run(data.name.trim(), priceAdj, isDefault, id)

    const updated = db.prepare('SELECT * FROM modifiers WHERE id = ?').get(id) as ModifierOption
    return updated
  }

  static setDefaultModifierOption(groupId: string, optionId: string): boolean {
    const db = getDatabase()
    db.prepare('UPDATE modifiers SET is_default = 0 WHERE group_id = ?').run(groupId)
    const res = db.prepare('UPDATE modifiers SET is_default = 1 WHERE id = ? AND group_id = ?').run(optionId, groupId)
    return res.changes > 0
  }

  static deleteModifierOption(id: string): boolean {
    const db = getDatabase()
    const res = db.prepare('DELETE FROM modifiers WHERE id = ?').run(id)
    return res.changes > 0
  }

  static duplicateModifierGroup(id: string, newName?: string): ModifierGroup {
    const db = getDatabase()
    const original = db.prepare('SELECT * FROM modifier_groups WHERE id = ?').get(id) as ModifierGroup | undefined
    if (!original) throw new Error('Grupo no encontrado')

    const newId = `mg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const targetName = newName?.trim() || `${original.name} (Copia)`

    db.prepare(`
      INSERT INTO modifier_groups (id, name, selection_mode, selection_limit)
      VALUES (?, ?, ?, ?)
    `).run(newId, targetName, original.selection_mode, original.selection_limit)

    // Clonar opciones
    const originalModifiers = db.prepare('SELECT * FROM modifiers WHERE group_id = ?').all(id) as ModifierOption[]
    const insertMod = db.prepare(`
      INSERT INTO modifiers (id, group_id, name, price_adjustment, is_default)
      VALUES (?, ?, ?, ?, ?)
    `)

    const clonedModifiers: ModifierOption[] = []
    for (const mod of originalModifiers) {
      const modId = `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const isDef = mod.is_default || 0
      insertMod.run(modId, newId, mod.name, mod.price_adjustment, isDef)
      clonedModifiers.push({
        id: modId,
        group_id: newId,
        name: mod.name,
        price_adjustment: mod.price_adjustment,
        is_default: isDef
      })
    }

    return {
      id: newId,
      name: targetName,
      selection_mode: original.selection_mode,
      selection_limit: original.selection_limit,
      modifiers: clonedModifiers,
      product_count: 0,
      product_names: []
    }
  }
}
