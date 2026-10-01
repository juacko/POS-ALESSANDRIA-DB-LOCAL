export interface Category {
  id: string
  name: string
  display_order: number
}

export interface ModifierOption {
  id: string
  group_id: string
  name: string
  price_adjustment: number
  is_default?: number
}

export interface ModifierGroup {
  id: string
  name: string
  selection_mode: 'single' | 'multiple_unlimited' | 'multiple_limited'
  selection_limit: number
  modifiers?: ModifierOption[]
  product_count?: number
  product_names?: string[]
  override_mode?: 'single' | 'multiple_unlimited' | 'multiple_limited' | null
  override_limit?: number | null
}

export interface ProductModifierGroupConfig {
  group_id: string
  override_mode?: 'single' | 'multiple_unlimited' | 'multiple_limited' | null
  override_limit?: number | null
}

export interface Product {
  id: string
  name: string
  category_id: string
  category_name?: string
  base_price: number
  active: number
  created_at?: string
  modifier_groups?: ModifierGroup[]
}
