import { ipcMain } from 'electron'
import { ProductRepository } from '../repositories/ProductRepository'
import { Product } from '@shared/types/product'
import { notifySync } from '../events/syncBus'

export function registerProductIPC() {
  ipcMain.handle('products:getCategories', () => {
    return ProductRepository.getCategories()
  })

  ipcMain.handle('products:createCategory', (_, data: { name: string; display_order?: number }) => {
    const cat = ProductRepository.createCategory(data)
    notifySync('products')
    return cat
  })

  ipcMain.handle('products:updateCategory', (_, data: { id: string; name: string; display_order?: number }) => {
    const cat = ProductRepository.updateCategory(data.id, data)
    notifySync('products')
    return cat
  })

  ipcMain.handle('products:deleteCategory', (_, data: { id: string }) => {
    const success = ProductRepository.deleteCategory(data.id)
    notifySync('products')
    return success
  })

  ipcMain.handle('products:getProducts', (_, activeOnly = true) => {
    return ProductRepository.getProducts(activeOnly)
  })

  ipcMain.handle('products:getModifierGroups', () => {
    return ProductRepository.getModifierGroups()
  })

  ipcMain.handle('products:createProduct', (_, data: { product: Partial<Product>; modifierGroups: (string | any)[] }) => {
    return ProductRepository.createProduct(data.product, data.modifierGroups)
  })

  ipcMain.handle('products:updateProduct', (_, data: { id: string; product: Partial<Product>; modifierGroups?: (string | any)[] }) => {
    return ProductRepository.updateProduct(data.id, data.product, data.modifierGroups)
  })

  ipcMain.handle('products:toggleActive', (_, data: { id: string; active: number }) => {
    return ProductRepository.toggleProductActive(data.id, data.active)
  })

  // Modificadores y Variantes
  ipcMain.handle('products:createModifierGroup', (_, data: { name: string; selection_mode: 'single' | 'multiple_unlimited' | 'multiple_limited'; selection_limit?: number }) => {
    return ProductRepository.createModifierGroup(data)
  })

  ipcMain.handle('products:updateModifierGroup', (_, data: { id: string; name: string; selection_mode: 'single' | 'multiple_unlimited' | 'multiple_limited'; selection_limit?: number }) => {
    return ProductRepository.updateModifierGroup(data.id, data)
  })

  ipcMain.handle('products:deleteModifierGroup', (_, data: { id: string }) => {
    return ProductRepository.deleteModifierGroup(data.id)
  })

  ipcMain.handle('products:duplicateModifierGroup', (_, data: { id: string; name?: string }) => {
    return ProductRepository.duplicateModifierGroup(data.id, data.name)
  })

  ipcMain.handle('products:createModifierOption', (_, data: { group_id: string; name: string; price_adjustment: number; is_default?: number }) => {
    return ProductRepository.createModifierOption(data)
  })

  ipcMain.handle('products:updateModifierOption', (_, data: { id: string; name: string; price_adjustment: number; is_default?: number }) => {
    return ProductRepository.updateModifierOption(data.id, data)
  })

  ipcMain.handle('products:setDefaultModifierOption', (_, data: { groupId: string; optionId: string }) => {
    return ProductRepository.setDefaultModifierOption(data.groupId, data.optionId)
  })

  ipcMain.handle('products:deleteModifierOption', (_, data: { id: string }) => {
    return ProductRepository.deleteModifierOption(data.id)
  })
}
