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

    // Cargar datos por defecto
    seedInitialData(db)
  }
  return db
}
