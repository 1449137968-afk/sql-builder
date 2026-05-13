import axios from 'axios'
import type {
  FieldCategory, Field, FieldUpdate, ParseResponse,
  GenerateRequest, GenerateResponse, AppSettings,
} from '../types'

const api = axios.create({ baseURL: '/api' })

// ---- 分类 ----
export const getCategories = () => api.get<FieldCategory[]>('/fields/categories').then(r => r.data)
export const createCategory = (data: { name: string; table_name?: string }) =>
  api.post<FieldCategory>('/fields/categories', data).then(r => r.data)
export const deleteCategory = (id: number) =>
  api.delete(`/fields/categories/${id}`).then(r => r.data)

// ---- 字段 ----
export const getFields = (params?: { category_id?: number; search?: string }) =>
  api.get<Field[]>('/fields', { params }).then(r => r.data)

export const parseFields = (data: { text: string; category_name: string; table_name?: string }) =>
  api.post<ParseResponse>('/fields/parse', data).then(r => r.data)

export const createField = (data: any) =>
  api.post<Field>('/fields', data).then(r => r.data)

export const updateField = (id: number, data: any) =>
  api.put<Field>(`/fields/${id}`, data).then(r => r.data)

export const deleteField = (id: number) =>
  api.delete(`/fields/${id}`).then(r => r.data)

// ---- SQL 生成 ----
export const generateSQL = (data: GenerateRequest) =>
  api.post<GenerateResponse>('/query/generate', data).then(r => r.data)

export const getQueryHistory = (page = 1, pageSize = 20) =>
  api.get('/query/history', { params: { page, page_size: pageSize } }).then(r => r.data)

// ---- 设置 ----
export const getSettings = () =>
  api.get<AppSettings>('/settings').then(r => r.data)

export const updateSettings = (data: Partial<AppSettings>) =>
  api.put<AppSettings>('/settings', data).then(r => r.data)

export const testConnection = () =>
  api.post<{ message: string }>('/settings/test').then(r => r.data)
