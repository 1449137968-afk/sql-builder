import { useState, useEffect, useMemo } from 'react'
import { Input, Tree, Tag, Card, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { getCategories, getFields } from '../api'
import type { FieldCategory, Field } from '../types'

interface Props {
  onSelectField: (field: Field) => void
}

export default function FieldSelector({ onSelectField }: Props) {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<FieldCategory[]>([])
  const [allFields, setAllFields] = useState<Field[]>([])

  useEffect(() => {
    setLoading(true)
    Promise.all([getCategories(), getFields()]).then(([cats, fields]) => {
      setCategories(cats)
      setAllFields(fields)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filteredFields = useMemo(() => {
    if (!search.trim()) return allFields
    const kw = search.toLowerCase()
    return allFields.filter(f =>
      f.field_name.toLowerCase().includes(kw) ||
      f.description.toLowerCase().includes(kw)
    )
  }, [search, allFields])

  const treeData = useMemo(() => {
    if (search.trim()) {
      return filteredFields.map(f => ({
        key: `field-${f.id}`,
        title: (
          <span
            className="cursor-pointer hover:text-blue-500"
            onClick={() => onSelectField(f)}
          >
            <span className="font-mono text-sm">{f.field_name}</span>
            {f.description && (
              <span className="text-gray-400 ml-2 text-xs">{f.description}</span>
            )}
            <span className="float-right">
              {f.is_dimension && <Tag color="green" className="text-xs">维度</Tag>}
              {f.is_measure && <Tag color="orange" className="text-xs">指标</Tag>}
            </span>
          </span>
        ),
        isLeaf: true,
      }))
    }

    return categories.map(cat => {
      const catFields = allFields.filter(f => f.category_id === cat.id)
      return {
        key: `cat-${cat.id}`,
        title: (
          <span className="font-medium">
            {cat.name}
            {cat.table_name && <span className="text-gray-400 ml-1">({cat.table_name})</span>}
          </span>
        ),
        children: catFields.map(f => ({
          key: `field-${f.id}`,
          title: (
            <span
              className="cursor-pointer hover:text-blue-500"
              onClick={() => onSelectField(f)}
            >
              <span className="font-mono text-sm">{f.field_name}</span>
              {f.description && (
                <span className="text-gray-400 ml-2 text-xs">{f.description}</span>
              )}
              <span className="float-right">
                {f.is_dimension && <Tag color="green" className="text-xs">维度</Tag>}
                {f.is_measure && <Tag color="orange" className="text-xs">指标</Tag>}
              </span>
            </span>
          ),
          isLeaf: true,
        })),
      }
    })
  }, [categories, allFields, search, filteredFields, onSelectField])

  return (
    <Card size="small" title="字段列表" className="h-full">
      <Input
        prefix={<SearchOutlined />}
        placeholder="搜索字段..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        allowClear
        className="mb-3"
      />
      {loading ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : (
        <Tree
          showIcon={false}
          treeData={treeData}
          defaultExpandAll
          className="max-h-[calc(100vh-280px)] overflow-auto"
        />
      )}
    </Card>
  )
}
