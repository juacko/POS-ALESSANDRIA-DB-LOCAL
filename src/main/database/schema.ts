export const INITIAL_SCHEMA = `
-- Usuarios y Autenticación
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Administrador', 'Atención', 'Cajero')),
    active INTEGER DEFAULT 1
);

-- Categorías
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- Productos
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id),
    base_price REAL NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Grupos de Modificadores
CREATE TABLE IF NOT EXISTS modifier_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    selection_mode TEXT CHECK(selection_mode IN ('single', 'multiple_unlimited', 'multiple_limited')),
    selection_limit INTEGER DEFAULT 1
);

-- Opciones de Modificadores
CREATE TABLE IF NOT EXISTS modifiers (
    id TEXT PRIMARY KEY,
    group_id TEXT REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_adjustment REAL DEFAULT 0.00,
    is_default INTEGER DEFAULT 0
);

-- Relación Productos <-> Grupos de Modificadores
CREATE TABLE IF NOT EXISTS product_modifier_groups (
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    group_id TEXT REFERENCES modifier_groups(id) ON DELETE CASCADE,
    override_mode TEXT CHECK(override_mode IN ('single', 'multiple_unlimited', 'multiple_limited')),
    override_limit INTEGER,
    PRIMARY KEY (product_id, group_id)
);

-- Mesas y Zonas
CREATE TABLE IF NOT EXISTS tables (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    zone TEXT DEFAULT 'Salón',
    status TEXT DEFAULT 'Disponible' CHECK(status IN ('Disponible', 'Ocupada'))
);

-- Sesiones de Caja
CREATE TABLE IF NOT EXISTS cashier_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    opening_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    closing_time DATETIME,
    initial_cash REAL NOT NULL,
    expected_cash REAL DEFAULT 0,
    actual_cash REAL DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'Abierta' CHECK(status IN ('Abierta', 'Cerrada'))
);

-- Movimientos de Caja
CREATE TABLE IF NOT EXISTS cash_movements (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES cashier_sessions(id),
    type TEXT CHECK(type IN ('Ingreso', 'Egreso')),
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Órdenes
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number INTEGER,
    table_id TEXT REFERENCES tables(id),
    table_number TEXT NOT NULL,
    cashier_session_id TEXT REFERENCES cashier_sessions(id),
    user_id TEXT REFERENCES users(id),
    status TEXT DEFAULT 'Abierta' CHECK(status IN ('Abierta', 'Pagada', 'Cancelada')),
    total_amount REAL DEFAULT 0.00,
    cancellation_reason TEXT,
    cancelled_at DATETIME,
    cancelled_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME
);

-- Ítems de la Orden
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    final_price REAL NOT NULL,
    modifiers_detail TEXT,
    is_served INTEGER DEFAULT 0
);

-- Pagos Registrados
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES orders(id),
    session_id TEXT REFERENCES cashier_sessions(id),
    payment_method TEXT NOT NULL CHECK(payment_method IN ('Efectivo', 'Tarjeta', 'Yape/Plin')),
    amount REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Registro de Auditoría de Órdenes y Pagos
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
`;
