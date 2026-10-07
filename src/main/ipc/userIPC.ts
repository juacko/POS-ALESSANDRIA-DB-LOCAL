import { ipcMain } from 'electron'
import { getDatabase } from '../database/connection'
import { User, UserRole } from '@shared/types/user'

export function registerUserIPC() {
  // Obtener solo usuarios activos (para login / selectores de cajero)
  ipcMain.handle('users:getUsers', () => {
    const db = getDatabase()
    return db.prepare('SELECT id, username, full_name, role, active FROM users WHERE active = 1 ORDER BY full_name ASC').all() as User[]
  })

  // Obtener todos los usuarios (para panel de configuración y administración)
  ipcMain.handle('users:getAll', () => {
    const db = getDatabase()
    return db.prepare('SELECT id, username, full_name, role, active FROM users ORDER BY active DESC, full_name ASC').all() as User[]
  })

  // Login con usuario y PIN
  ipcMain.handle('users:login', (_, data: { username: string; pin: string }) => {
    const db = getDatabase()
    const user = db.prepare('SELECT id, username, full_name, role, active FROM users WHERE username = ? AND password_hash = ? AND active = 1')
      .get(data.username, data.pin) as User | undefined

    if (!user) {
      throw new Error('Credenciales incorrectas o usuario inactivo.')
    }
    return user
  })

  // Validar PIN de Administrador (para autorizaciones de supervisor en acciones sensibles)
  ipcMain.handle('users:verifyAdminPin', (_, data: { pin: string }) => {
    const db = getDatabase()
    const pin = data.pin?.trim()
    if (!pin) throw new Error('El PIN es requerido.')

    const admin = db.prepare("SELECT id, username, full_name, role, active FROM users WHERE password_hash = ? AND role = 'Administrador' AND active = 1")
      .get(pin) as User | undefined

    if (!admin) {
      throw new Error('PIN incorrecto o el usuario no cuenta con privilegios de Administrador.')
    }
    return admin
  })

  // Crear nuevo colaborador
  ipcMain.handle('users:create', (_, data: {
    username: string
    fullName: string
    role: UserRole
    pin: string
  }) => {
    const db = getDatabase()

    const cleanUsername = data.username.trim().toLowerCase()
    const cleanFullName = data.fullName.trim()
    const pin = data.pin.trim()

    if (!cleanUsername || !cleanFullName || !pin) {
      throw new Error('Todos los campos son obligatorios.')
    }

    // Verificar si el username ya existe
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername)
    if (existing) {
      throw new Error(`El usuario "${cleanUsername}" ya está registrado. Elige otro nombre de usuario.`)
    }

    const userId = `u-${Date.now()}`
    db.prepare(`
      INSERT INTO users (id, username, password_hash, full_name, role, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(userId, cleanUsername, pin, cleanFullName, data.role)

    return db.prepare('SELECT id, username, full_name, role, active FROM users WHERE id = ?').get(userId) as User
  })

  // Actualizar datos de un colaborador (y PIN si se especifica)
  ipcMain.handle('users:update', (_, data: {
    id: string
    fullName: string
    role: UserRole
    pin?: string
  }) => {
    const db = getDatabase()
    const cleanFullName = data.fullName.trim()

    if (!cleanFullName) {
      throw new Error('El nombre completo es obligatorio.')
    }

    if (data.pin && data.pin.trim().length > 0) {
      // Actualizar con nuevo PIN
      db.prepare(`
        UPDATE users
        SET full_name = ?, role = ?, password_hash = ?
        WHERE id = ?
      `).run(cleanFullName, data.role, data.pin.trim(), data.id)
    } else {
      // Actualizar sin cambiar PIN
      db.prepare(`
        UPDATE users
        SET full_name = ?, role = ?
        WHERE id = ?
      `).run(cleanFullName, data.role, data.id)
    }

    return db.prepare('SELECT id, username, full_name, role, active FROM users WHERE id = ?').get(data.id) as User
  })

  // Alternar estado activo / inactivo
  ipcMain.handle('users:toggleActive', (_, data: { id: string; active: number }) => {
    const db = getDatabase()

    // Regla de seguridad: Debe existir al menos un Administrador activo en el sistema
    if (data.active === 0) {
      const user = db.prepare('SELECT role FROM users WHERE id = ?').get(data.id) as { role: string } | undefined
      if (user?.role === 'Administrador') {
        const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Administrador' AND active = 1").get() as { count: number }
        if (adminCount.count <= 1) {
          throw new Error('No se puede desactivar al único Administrador activo del sistema.')
        }
      }
    }

    db.prepare('UPDATE users SET active = ? WHERE id = ?').run(data.active, data.id)
    return true
  })
}
