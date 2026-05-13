import { useMemo } from 'react'
import { Button, Select, Input, Card } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Filter, Field } from '../types'

interface Props {
  filters: Filter[]
  fields: Field[]
  onChange: (filters: Filter[]) => void
}

const OPERATORS = [
  { label: '等于 (=)', value: '=' },
  { label: '不等于 (!=)', value: '!=' },
  { label: '大于 (>)', value: '>' },
  { label: '小于 (<)', value: '<' },
  { label: '大于等于 (>=)', value: '>=' },
  { label: '小于等于 (<=)', value: '<=' },
  { label: '包含 (LIKE)', value: 'LIKE' },
  { label: '在列表中 (IN)', value: 'IN' },
  { label: '为空', value: 'IS NULL' },
  { label: '不为空', value: 'IS NOT NULL' },
]

export default function FilterBuilder({ filters, fields, onChange }: Props) {
  // Build a map of field_name -> enum values for lookup
  const enumMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    fields.forEach(f => {
      if (f.enum_values) {
        try {
          map[f.field_name] = JSON.parse(f.enum_values)
        } catch { /* ignore */ }
      }
    })
    return map
  }, [fields])

  const addFilter = () => {
    onChange([...filters, { field: '', operator: '=', value: '' }])
  }

  const updateFilter = (index: number, update: Partial<Filter>) => {
    const updated = filters.map((f, i) => (i === index ? { ...f, ...update } : f))
    onChange(updated)
  }

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index))
  }

  const getValueInput = (filter: Filter, index: number) => {
    const enumValues = enumMap[filter.field]

    if (['IN'].includes(filter.operator) && enumValues) {
      return (
        <Select
          mode="multiple"
          placeholder="选择枚举值"
          value={filter.value ? filter.value.split(',').filter(Boolean) : []}
          onChange={(vals: string[]) => updateFilter(index, { value: vals.join(',') })}
          options={enumValues.map(v => ({ label: v, value: v }))}
          className="flex-1"
          style={{ minWidth: 160 }}
        />
      )
    }

    if (enumValues) {
      return (
        <Select
          placeholder="选择值"
          value={filter.value || undefined}
          onChange={v => updateFilter(index, { value: v })}
          options={enumValues.map(v => ({ label: v, value: v }))}
          allowClear
          className="flex-1"
          style={{ minWidth: 160 }}
        />
      )
    }

    return (
      <Input
        placeholder="值"
        value={filter.value}
        onChange={e => updateFilter(index, { value: e.target.value })}
        className="flex-1"
        style={{ minWidth: 100 }}
      />
    )
  }

  return (
    <Card size="small" title="筛选条件" extra={
      <Button type="link" icon={<PlusOutlined />} onClick={addFilter} size="small">
        添加
      </Button>
    }>
      {filters.length === 0 ? (
        <div className="text-gray-400 text-center py-4 text-sm">
          暂未添加筛选条件
        </div>
      ) : (
        <div className="space-y-2">
          {filters.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select
                placeholder="字段"
                value={f.field || undefined}
                onChange={v => updateFilter(i, { field: v, value: '' })}
                options={fields.map(f => ({
                  label: `${f.field_name}${f.description ? ` (${f.description})` : ''}`,
                  value: f.field_name,
                }))}
                showSearch
                optionFilterProp="label"
                className="flex-1"
                style={{ minWidth: 140 }}
              />
              <Select
                value={f.operator}
                onChange={v => updateFilter(i, { operator: v })}
                options={OPERATORS}
                style={{ width: 150 }}
              />
              {!['IS NULL', 'IS NOT NULL'].includes(f.operator) &&
                getValueInput(f, i)}
              <Button
                type="text" danger size="small" icon={<DeleteOutlined />}
                onClick={() => removeFilter(i)}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
