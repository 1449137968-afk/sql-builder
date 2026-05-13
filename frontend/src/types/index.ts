export interface FieldCategory {
  id: number
  name: string
  table_name: string
  created_at: string
}

export interface Field {
  id: number
  category_id: number
  field_name: string
  field_type: string
  description: string
  enum_values: string | null
  is_dimension: boolean
  is_measure: boolean
  created_at: string
}

export interface ParsedField {
  field_name: string
  field_type: string
  description: string
  enum_values: string | null
  is_dimension: boolean
  is_measure: boolean
}

export interface ParseResponse {
  category_name: string
  table_name: string
  fields: ParsedField[]
}

export interface Measure {
  field: string
  agg_func: string
}

export interface Filter {
  field: string
  operator: string
  value: string
}

export interface OrderBy {
  field: string
  direction: 'ASC' | 'DESC'
}

export interface GenerateRequest {
  dimensions: string[]
  measures: Measure[]
  filters: Filter[]
  order_by: OrderBy[]
  limit: number | null
  tables: string[]
  natural_prompt: string
}

export interface GenerateResponse {
  sql: string
}

export interface AppSettings {
  id: number
  api_base_url: string
  api_key: string
  model: string
}

export interface QueryHistoryItem {
  id: number
  selections: string
  generated_sql: string
  created_at: string
}
