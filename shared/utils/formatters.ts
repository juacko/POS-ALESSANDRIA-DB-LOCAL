/**
 * Formatea de manera limpia y consistente el nombre de una mesa o pedido rápido,
 * evitando duplicaciones como "Mesa Mesa 3" o prefijos incorrectos como "Mesa Barra 1".
 */
export function formatTableDisplay(tableNumber?: string | null): string {
  if (!tableNumber) return 'Sin mesa'
  
  const clean = tableNumber.trim()
  if (clean.toUpperCase() === 'RAPIDO') {
    return 'Pedido Rápido'
  }

  // Elimina cualquier repetición redundante de "Mesa Mesa ..." al inicio
  const normalized = clean.replace(/^(?:mesa\s*)+/i, 'Mesa ')

  // Si ya comienza con "Mesa ", respetarlo (ej: "Mesa 3", "Mesa Terraza 1")
  if (/^mesa\b/i.test(normalized)) {
    return normalized
  }

  // Si es un número puro (ej: "3" o "12"), anteponer "Mesa "
  if (/^\d+$/.test(normalized)) {
    return `Mesa ${normalized}`
  }

  // Nombres personalizados como "Barra 1", "Terraza A", etc. se mantienen limpios
  return normalized
}
