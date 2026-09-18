import { ipcMain } from 'electron'
import { ProductRepository } from '../repositories/ProductRepository'
import { Product } from '@shared/types/product'

export function registerProductIPC() {
  ipcMain.handle('products:getCategories', () => {
    return ProductRepository.getCategories()
  })

  ipcMain.handle('products:getProducts', (_, activeOnly = true) => {
    return ProductRepository.getProducts(activeOnly)
  })

  ipcMain.handle('products:getModifierGroups', () => {
    return ProductRepository.getModifierGroups()
  })

  ipcMain.handle('products:createProduct', (_, data: { product: Partial<Product>; modifierGroupIds: string[] }) => {
    return ProductRepository.createProduct(data.product, data.modifierGroupIds)
  })

  ipcMain.handle('products:updateProduct', (_, data: { id: string; product: Partial<Product>; modifierGroupIds?: string[] }) => {
    return ProductRepository.updateProduct(data.id, data.product, data.modifierGroupIds)
  })

  ipcMain.handle('products:toggleActive', (_, data: { id: string; active: number }) => {
    return ProductRepository.toggleProductActive(data.id, data.active)
  })
}
