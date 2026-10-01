# Alessandria POS - Sistema Local para Heladerías, Cafeterías y Bares 🍦☕

Sistema POS de arquitectura **Local / Offline-First** diseñado para operar sin conexión a Internet en la computadora principal y sincronizarse en tiempo real con celulares y tablets de los meseros vía Wi-Fi local mediante Código QR.

---

## 🚀 Requisitos Previos

- **Node.js**: versión LTS recomendada (`v20.x` o `v22.x`).
- **Git** configurado en ambas máquinas.

---

## 💻 Configuración Inicial (Windows y macOS)

Para clonar o configurar el proyecto en una máquina nueva (sea Mac o Windows):

```bash
# 1. Clonar el repositorio (si aún no lo tienes)
git clone https://github.com/juacko/POS-ALESSANDRIA-DB-LOCAL.git
cd POS-ALESSANDRIA-DB-LOCAL

# 2. Instalar dependencias
npm install --ignore-scripts

# 3. Compilar / enlazar dependencias nativas (better-sqlite3) para Electron
npm run rebuild
```

> **Nota importante sobre módulos nativos (`better-sqlite3`)**:
> Al cambiar entre arquitecturas (Windows x64 vs Mac Apple Silicon / Intel), ejecuta siempre `npm run rebuild` para que `electron-builder` descargue el binario correcto para el runtime de Electron de tu sistema operativo.

---

## 🛠️ Comandos de Desarrollo

```bash
# Iniciar la aplicación en modo desarrollo (Hot Reload + Electron)
npm run dev

# Comprobar tipos de TypeScript en Vue y componentes
npx vue-tsc --noEmit

# Compilar los bundles de producción (Vite + Electron)
npm run build

# Empaquetar instalador para Windows (.exe con NSIS)
npm run build:win

# Empaquetar instalador para macOS (.dmg / .zip)
npm run build:mac
```

---

## 🔄 Flujo de Trabajo Fluido entre Mac y Windows

Para evitar conflictos y trabajar fluidamente alternando entre ambas máquinas:

### Antes de dejar tu máquina actual:
```bash
git status
git add .
git commit -m "feat/fix: descripción de tu avance"
git push origin main
```

### Al llegar a la otra máquina:
```bash
git pull --rebase origin main

# Si hubo cambios en dependencias (package.json):
npm install --ignore-scripts
npm run rebuild

# Iniciar desarrollo:
npm run dev
```

---

## 📱 Acceso Móvil (Comandera para Meseros)

1. En la ventana principal de la aplicación en la computadora de caja, haz clic en el botón de **Dispositivo Móvil / Conectar Celular** en la barra superior.
2. Se desplegará un **Código QR** y la dirección IP local (ej. `http://192.168.1.50:3000`).
3. El mesero escanea el QR desde cualquier smartphone o tablet conectado a la **misma red Wi-Fi**.
4. La interfaz web móvil se cargará automáticamente con sincronización bidireccional en tiempo real.

---

## 🔑 Credenciales por Defecto (Base de Datos Local)

Al iniciar por primera vez, SQLite genera automáticamente los siguientes usuarios de demostración:

| Rol | Usuario | PIN / Clave |
| :--- | :--- | :--- |
| **Administrador** | `admin` | `admin123` |
| **Cajero** | `cajero` | `cajero123` |
| **Atención (Mesero)** | `atencion` | `atencion123` |

---

## 🍦 Configuración y Operación en la PC de la Heladería

En la carpeta `scripts/` dispones de herramientas de automatización con 1 clic:

1. **`scripts/abrir-firewall-puerto-3000.bat`**: Ejecútalo como Administrador una sola vez para permitir que los teléfonos en la red Wi-Fi de la heladería se conecten a la comandera sin bloqueos de firewall.
2. **`scripts/iniciar-pos.bat`**: Hace `git pull` automático de tus últimos cambios de GitHub y arranca la aplicación. Puedes crear un acceso directo a este archivo en el Escritorio.
3. **`scripts/subir-cambios-a-github.bat`**: Si realizas cambios en el código o configuración directamente desde la heladería, haz doble clic en este archivo para empaquetar y subir los cambios a GitHub, permitiéndote continuar trabajando en tu laptop sin fricciones.

