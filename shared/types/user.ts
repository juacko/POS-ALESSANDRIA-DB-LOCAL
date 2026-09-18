export type UserRole = 'Administrador' | 'Atención' | 'Cajero'

export interface User {
  id: string
  username: string
  full_name: string
  role: UserRole
  active: number
}
