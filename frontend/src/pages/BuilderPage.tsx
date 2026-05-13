import { useState, useEffect, useCallback } from 'react'
import { Button, Input, InputNumber, message } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import type { Field, Measure, Filter, OrderBy } from '../types'
import { getFields, generateSQL } from '../api'
import FieldSelector from '../components/FieldSelector'
import MetricSelector from '../components/MetricSelector'
import FilterBuilder from '../components/FilterBuilder'
import SQLPreview from '../components/SQLPreview'

export default function BuilderPage() {
  const [allFields, setAllFields] = useState<Field[]>([])
  const [dimensions, setDimensions] = useState<string[]>([])
  const [measures, setMeasures] = useState<Measure[]>([])
  const [filters, setFilters] = useState<Filter[]>([])
  const [orderBy, setOrderBy] = useState<OrderBy[]>([])
  const [limit, setLimit] = useState<number | null>(null)
  const [naturalPrompt, setNaturalPrompt] = useState('')
  const [sql, setSql] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    getFields().then(setAllFields).catch(() => {})
  }, [])

  const handleSelectField = useCallback((field: Field) => {
    if (field.is_dimension && !dimensions.includes(field.field_name)) {
      setDimensions(prev => [...prev, field.field_name])
    }
  }, [dimensions])

  const handleGenerate = async () => {
    if (dimensions.length === 0 && measures.length === 0) {
      message.warning('请至少选择一个维度或指标')
      return
    }

    setGenerating(true)
    try {
      const result = await generateSQL({
        dimensions,
        measures: measures.filter(m => m.field),
        filters: filters.filter(f => f.field),
        order_by: orderBy.filter(o => o.field),
        limit,
        tables: [],
        natural_prompt: naturalPrompt,
      })
      setSql(result.sql)
      message.success('SQL 生成成功')
    } catch (err: any) {
      const detail = err?.response?.data?.detail || '生成失败，请检查配置和字段'
      message.error(detail)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="w-72 flex-shrink-0 overflow-auto">
        <FieldSelector onSelectField={handleSelectField} />
      </div>

      <div className="flex-1 overflow-auto space-y-3">
        <MetricSelector
          measures={measures}
          dimensions={dimensions}
          orderBy={orderBy}
          fields={allFields}
          onMeasuresChange={setMeasures}
          onDimensionsChange={setDimensions}
          onOrderByChange={setOrderBy}
        />

        <FilterBuilder
          filters={filters}
          fields={allFields}
          onChange={setFilters}
        />

        <div className="flex gap-3 items-center bg-white p-3 rounded-lg border">
          <span className="text-sm text-gray-500 whitespace-nowrap">限制行数:</span>
          <InputNumber
            value={limit}
            onChange={v => setLimit(v)}
            placeholder="不限"
            min={1}
            style={{ width: 120 }}
          />
          <span className="text-sm text-gray-500 whitespace-nowrap ml-4">额外说明:</span>
          <Input
            value={naturalPrompt}
            onChange={e => setNaturalPrompt(e.target.value)}
            placeholder="用自然语言补充查询需求..."
            className="flex-1"
          />
        </div>

        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          onClick={handleGenerate}
          loading={generating}
          block
        >
          生成 SQL
        </Button>
      </div>

      <div className="w-96 flex-shrink-0 overflow-auto">
        <SQLPreview sql={sql} loading={generating} />
      </div>
    </div>
  )
}
