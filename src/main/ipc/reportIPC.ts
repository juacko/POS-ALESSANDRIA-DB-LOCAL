import { ipcMain } from 'electron'
import { ReportRepository } from '../repositories/ReportRepository'

export function registerReportIPC() {
  ipcMain.handle('reports:getSalesSummary', (_, data: { startDate: string; endDate: string }) => {
    return ReportRepository.getSalesSummary(data.startDate, data.endDate)
  })

  ipcMain.handle('reports:getSalesTrend', (_, data: { startDate: string; endDate: string; groupBy?: 'hour' | 'day' }) => {
    return ReportRepository.getSalesTrend(data.startDate, data.endDate, data.groupBy || 'hour')
  })

  ipcMain.handle('reports:getTopProducts', (_, data: { startDate: string; endDate: string; limit?: number; categoryId?: string }) => {
    return ReportRepository.getTopProducts(data.startDate, data.endDate, data.limit ?? 15, data.categoryId)
  })

  ipcMain.handle('reports:getCategorySales', (_, data: { startDate: string; endDate: string }) => {
    return ReportRepository.getCategorySales(data.startDate, data.endDate)
  })

  ipcMain.handle('reports:getCashierSessions', (_, data: { startDate: string; endDate: string }) => {
    return ReportRepository.getCashierSessionsHistory(data.startDate, data.endDate)
  })

  ipcMain.handle('reports:getStaffSales', (_, data: { startDate: string; endDate: string }) => {
    return ReportRepository.getStaffSales(data.startDate, data.endDate)
  })

  ipcMain.handle('reports:getExportData', (_, data: { startDate: string; endDate: string }) => {
    return ReportRepository.getDetailedOrdersForExport(data.startDate, data.endDate)
  })
}
