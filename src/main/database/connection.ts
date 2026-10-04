import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { INITIAL_SCHEMA } from './schema'
import { seedInitialData } from './seeders/initial_seed'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    // Si la app está empaquetada o en dev, guardar en userData o directorio de trabajo
    const dbPath = app
      ? path.join(app.getPath('userData'), 'pos_database.db')
      : path.join(__dirname, '../../../pos_database.db')

    // Asegurar que la carpeta exista en Windows/macOS
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    console.log(`[Database] Conectando a SQLite en: ${dbPath}`)
    db = new Database(dbPath)

    // Modos de optimización SQLite
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    // Ejecutar esquemas iniciales
    db.exec(INITIAL_SCHEMA)

    // Migraciones seguras para esquemas existentes
    runMigrations(db)

    // Cargar datos por defecto
    seedInitialData(db)
  }
  return db
}

function runMigrations(db: Database.Database) {
  try {
    const tableInfo = db.prepare("PRAGMA table_info(product_modifier_groups)").all() as { name: string }[]
    const colNames = tableInfo.map(c => c.name)
    if (!colNames.includes('override_mode')) {
      db.exec("ALTER TABLE product_modifier_groups ADD COLUMN override_mode TEXT")
    }
    if (!colNames.includes('override_limit')) {
      db.exec("ALTER TABLE product_modifier_groups ADD COLUMN override_limit INTEGER")
    }

    const modTableInfo = db.prepare("PRAGMA table_info(modifiers)").all() as { name: string }[]
    const modColNames = modTableInfo.map(c => c.name)
    if (!modColNames.includes('is_default')) {
      db.exec("ALTER TABLE modifiers ADD COLUMN is_default INTEGER DEFAULT 0")
    }

    const orderItemsInfo = db.prepare("PRAGMA table_info(order_items)").all() as { name: string }[]
    const itemColNames = orderItemsInfo.map(c => c.name)
    if (!itemColNames.includes('is_served')) {
      db.exec("ALTER TABLE order_items ADD COLUMN is_served INTEGER DEFAULT 0")
    }

    // Columnas para cancelación y anulación de órdenes
    const ordersInfo = db.prepare("PRAGMA table_info(orders)").all() as { name: string }[]
    const orderColNames = ordersInfo.map(c => c.name)
    if (!orderColNames.includes('cancellation_reason')) {
      db.exec("ALTER TABLE orders ADD COLUMN cancellation_reason TEXT")
    }
    if (!orderColNames.includes('cancelled_at')) {
      db.exec("ALTER TABLE orders ADD COLUMN cancelled_at DATETIME")
    }
    if (!orderColNames.includes('cancelled_by')) {
      db.exec("ALTER TABLE orders ADD COLUMN cancelled_by TEXT")
    }

    // Tabla de auditoría para trazabilidad de cancelaciones y cambios de método de pago
    db.exec(`
      CREATE TABLE IF NOT EXISTS order_audit_logs (
        id TEXT PRIMARY KEY,
        order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        reason TEXT NOT NULL,
        user_id TEXT,
        user_name TEXT,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Limpieza preventiva de duplicaciones históricas en nombres de mesas
    try {
      db.exec(`
        UPDATE orders SET table_number = REPLACE(table_number, 'Mesa Mesa ', 'Mesa ') WHERE table_number LIKE '%Mesa Mesa %';
        UPDATE tables SET name = REPLACE(name, 'Mesa Mesa ', 'Mesa ') WHERE name LIKE '%Mesa Mesa %';
      `)
    } catch {
      // Ignorar si no aplica
    }
  } catch (err) {
    console.error('[Database Migration Error]', err)
  }
}
