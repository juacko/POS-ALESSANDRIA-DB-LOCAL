export const APP_NAME = 'Alessandria POS'
export const QUICK_ORDER_TABLE_NUMBER = 'RAPIDO'

export const PAYMENT_METHODS = [
  { id: 'Efectivo', label: 'Efectivo', icon: 'Banknote' },
  { id: 'Tarjeta', label: 'Tarjeta (Débito/Crédito)', icon: 'CreditCard' },
  { id: 'Yape/Plin', label: 'Yape / Plin', icon: 'QrCode' },
] as const
