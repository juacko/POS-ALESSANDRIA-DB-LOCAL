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
  } catch (err) {
    console.error('[Database Migration Error]', err)
  }
}
