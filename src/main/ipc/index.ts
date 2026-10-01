import { registerProductIPC } from './productIPC'
import { registerTableIPC } from './tableIPC'
import { registerCashierIPC } from './cashierIPC'
import { registerOrderIPC } from './orderIPC'
import { registerUserIPC } from './userIPC'
import { registerServerIPC } from './serverIPC'
import { registerReportIPC } from './reportIPC'

export function registerAllIPCHandlers() {
  registerProductIPC()
  registerTableIPC()
  registerCashierIPC()
  registerOrderIPC()
  registerUserIPC()
  registerServerIPC()
  registerReportIPC()
}
