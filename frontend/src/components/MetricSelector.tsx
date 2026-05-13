import { Button, Select, Card, Tag } from 'antd'
import { PlusOutlined, CloseOutlined } from '@ant-design/icons'
import type { Measure, Field, OrderBy } from '../types'

interface Props {
  measures: Measure[]
  dimensions: string[]
  orderBy: OrderBy[]
  fields: Field[]
  onMeasuresChange: (measures: Measure[]) => void
  onDimensionsChange: (dimensions: string[]) => void
  onOrderByChange: (orderBy: OrderBy[]) => void
}

const AGG_FUNCS = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'COUNT DISTINCT']

export default function MetricSelector({
  measures, dimensions, orderBy, fields,
  onMeasuresChange, onDimensionsChange, onOrderByChange,
}: Props) {
  const measureFields = fields.filter(f => f.is_measure)
  const dimensionFields = fields.filter(f => f.is_dimension)

  return (
    <div className="space-y-3">
      {/* 维度 */}
      <Card size="small" title="维度 (GROUP BY)">
        <Select
          mode="multiple"
          placeholder="选择维度字段..."
          value={dimensions}
          onChange={onDimensionsChange}
          options={dimensionFields.map(f => ({
            label: `${f.field_name}${f.description ? ` (${f.description})` : ''}`,
            value: f.field_name,
          }))}
          className="w-full"
          showSearch
          optionFilterProp="label"
          tagRender={(props) => {
            const { label, closable, onClose } = props
            return (
              <Tag color="green" closable={closable} onClose={onClose} className="text-xs">
                {label}
              </Tag>
            )
          }}
        />
      </Card>

      {/* 指标 */}
      <Card size="small" title="指标 (聚合)" extra={
        <Button type="link" size="small" icon={<PlusOutlined />}
          onClick={() => onMeasuresChange([...measures, { field: '', agg_func: 'COUNT' }])}>
          添加
        </Button>
      }>
        {measures.length === 0 ? (
          <div className="text-gray-400 text-center py-4 text-sm">暂未添加指标</div>
        ) : (
          <div className="space-y-2">
            {measures.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={m.agg_func}
                  onChange={v => {
                    const updated = [...measures]
                    updated[i] = { ...updated[i], agg_func: v }
                    onMeasuresChange(updated)
                  }}
                  options={AGG_FUNCS.map(f => ({ label: f, value: f }))}
                  style={{ width: 160 }}
                />
                <Select
                  placeholder="字段"
                  value={m.field || undefined}
                  onChange={v => {
                    const updated = [...measures]
                    updated[i] = { ...updated[i], field: v }
                    onMeasuresChange(updated)
                  }}
                  options={measureFields.map(f => ({
                    label: `${f.field_name}${f.description ? ` (${f.description})` : ''}`,
                    value: f.field_name,
                  }))}
                  showSearch
                  optionFilterProp="label"
                  className="flex-1"
                />
                <Button type="text" danger size="small" icon={<CloseOutlined />}
                  onClick={() => onMeasuresChange(measures.filter((_, idx) => idx !== i))} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 排序 */}
      <Card size="small" title="排序 (ORDER BY)" extra={
        <Button type="link" size="small" icon={<PlusOutlined />}
          onClick={() => onOrderByChange([...orderBy, { field: dimensions[0] || '', direction: 'ASC' }])}>
          添加
        </Button>
      }>
        {orderBy.length === 0 ? (
          <div className="text-gray-400 text-center py-4 text-sm">暂未添加排序</div>
        ) : (
          <div className="space-y-2">
            {orderBy.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  placeholder="字段"
                  value={o.field || undefined}
                  onChange={v => {
                    const updated = [...orderBy]
                    updated[i] = { ...updated[i], field: v }
                    onOrderByChange(updated)
                  }}
                  options={fields.map(f => ({
                    label: `${f.field_name}${f.description ? ` (${f.description})` : ''}`,
                    value: f.field_name,
                  }))}
                  showSearch
                  optionFilterProp="label"
                  className="flex-1"
                />
                <Select
                  value={o.direction}
                  onChange={v => {
                    const updated = [...orderBy]
                    updated[i] = { ...updated[i], direction: v as 'ASC' | 'DESC' }
                    onOrderByChange(updated)
                  }}
                  options={[
                    { label: '升序 (ASC)', value: 'ASC' },
                    { label: '降序 (DESC)', value: 'DESC' },
                  ]}
                  style={{ width: 160 }}
                />
                <Button type="text" danger size="small" icon={<CloseOutlined />}
                  onClick={() => onOrderByChange(orderBy.filter((_, idx) => idx !== i))} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
