import { useState, useEffect, useCallback } from 'react'
import {
  Card, Table, Button, Input, Modal, Form, Select,
  Space, message, Popconfirm, Tag, Empty,
} from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import type { Field, FieldCategory, ParsedField } from '../types'
import {
  getCategories, getFields, parseFields, updateField, deleteField,
} from '../api'

const { TextArea } = Input

export default function FieldsPage() {
  const [categories, setCategories] = useState<FieldCategory[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [activeCategory, setActiveCategory] = useState<number | undefined>()
  const [loading, setLoading] = useState(false)

  // 解析相关
  const [parseModalOpen, setParseModalOpen] = useState(false)
  const [parseText, setParseText] = useState('')
  const [parseCategoryName, setParseCategoryName] = useState('')
  const [parseTableName, setParseTableName] = useState('')
  const [parsedFields, setParsedFields] = useState<ParsedField[]>([])
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)

  // 编辑相关
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<Field | null>(null)
  const [editForm] = Form.useForm()

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch { /* ignore */ }
  }, [])

  const loadFields = useCallback(async (catId?: number) => {
    setLoading(true)
    try {
      const data = await getFields({ category_id: catId })
      setFields(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    if (activeCategory) loadFields(activeCategory)
    else loadFields()
  }, [activeCategory, loadFields])

  const handleParse = async () => {
    if (!parseText.trim()) return
    setParsing(true)
    try {
      const result = await parseFields({
        text: parseText,
        category_name: parseCategoryName || '新分类',
        table_name: parseTableName,
      })
      setParsedFields(result.fields)
      message.success(`解析出 ${result.fields.length} 个字段`)
    } catch {
      message.error('解析失败')
    } finally {
      setParsing(false)
    }
  }

  const handleSaveParsed = async () => {
    setSaving(true)
    try {
      await loadCategories()
      await loadFields()
      setParseModalOpen(false)
      setParseText('')
      setParseCategoryName('')
      setParseTableName('')
      setParsedFields([])
      message.success('保存成功')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleEditField = (field: Field) => {
    setEditingField(field)
    editForm.setFieldsValue({
      field_name: field.field_name,
      field_type: field.field_type,
      description: field.description,
      enum_values: field.enum_values || '',
      is_dimension: field.is_dimension,
      is_measure: field.is_measure,
      category_id: field.category_id,
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingField) return
    try {
      const values = editForm.getFieldsValue()
      await updateField(editingField.id, {
        ...values,
        enum_values: values.enum_values || null,
      })
      message.success('更新成功')
      setEditModalOpen(false)
      loadFields(activeCategory)
    } catch {
      message.error('更新失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteField(id)
      message.success('删除成功')
      loadFields(activeCategory)
    } catch {
      message.error('删除失败')
    }
  }

  const columns = [
    { title: '字段名', dataIndex: 'field_name', key: 'field_name', width: 180 },
    { title: '类型', dataIndex: 'field_type', key: 'field_type', width: 120 },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '枚举值', dataIndex: 'enum_values', key: 'enum_values', width: 200,
      render: (v: string | null) => v ? (
        <div className="flex gap-1 flex-wrap">
          {JSON.parse(v).map((e: string) => (
            <Tag key={e} color="blue">{e}</Tag>
          ))}
        </div>
      ) : '-'
    },
    {
      title: '分类', key: 'tags', width: 140,
      render: (_: any, record: Field) => (
        <Space size={4}>
          {record.is_dimension && <Tag color="green">维度</Tag>}
          {record.is_measure && <Tag color="orange">指标</Tag>}
        </Space>
      ),
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: any, record: Field) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => handleEditField(record)} />
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold m-0">字段管理</h2>
        <Space>
          <Select
            placeholder="按分类筛选"
            allowClear
            style={{ width: 200 }}
            value={activeCategory}
            onChange={setActiveCategory}
            options={categories.map(c => ({ label: c.name, value: c.id }))}
          />
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => setParseModalOpen(true)}>
            导入字段
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          dataSource={fields}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="middle"
          locale={{ emptyText: <Empty description="暂无字段，点击「导入字段」粘贴表结构" /> }}
        />
      </Card>

      {/* 导入字段 Modal */}
      <Modal
        title="导入字段"
        open={parseModalOpen}
        onCancel={() => {
          setParseModalOpen(false)
          setParsedFields([])
        }}
        width={700}
        footer={
          parsedFields.length > 0
            ? [
                <Button key="cancel" onClick={() => {
                  setParseModalOpen(false)
                  setParsedFields([])
                }}>取消</Button>,
                <Button key="save" type="primary" loading={saving}
                  onClick={handleSaveParsed}>确认保存 ({parsedFields.length} 个字段)</Button>,
              ]
            : [
                <Button key="cancel" onClick={() => setParseModalOpen(false)}>取消</Button>,
                <Button key="parse" type="primary" loading={parsing}
                  onClick={handleParse}>解析</Button>,
              ]
        }
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input placeholder="分类名称" value={parseCategoryName}
              onChange={e => setParseCategoryName(e.target.value)} className="flex-1" />
            <Input placeholder="表名（可选）" value={parseTableName}
              onChange={e => setParseTableName(e.target.value)} className="flex-1" />
          </div>
          <TextArea
            rows={10}
            placeholder={`粘贴字段定义，支持格式：
1. DDL: user_id int(11) NOT NULL COMMENT '用户ID'
2. 制表符分隔: user_id\tint\t用户ID
3. 简单列表: user_id - 用户ID`}
            value={parseText}
            onChange={e => setParseText(e.target.value)}
          />
          {parsedFields.length > 0 && (
            <Table
              dataSource={parsedFields}
              rowKey="field_name"
              columns={[
                { title: '字段名', dataIndex: 'field_name', width: 160 },
                { title: '类型', dataIndex: 'field_type', width: 120 },
                { title: '描述', dataIndex: 'description' },
                {
                  title: '枚举', dataIndex: 'enum_values', width: 180,
                  render: (v: string | null) => v ? JSON.stringify(JSON.parse(v)) : '-',
                },
              ]}
              size="small"
              pagination={false}
              scroll={{ y: 240 }}
            />
          )}
        </div>
      </Modal>

      {/* 编辑字段 Modal */}
      <Modal
        title="编辑字段"
        open={editModalOpen}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalOpen(false)}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="字段名" name="field_name">
            <Input />
          </Form.Item>
          <Form.Item label="类型" name="field_type">
            <Input />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input />
          </Form.Item>
          <Form.Item label="枚举值（每行一个，或 JSON 数组）" name="enum_values">
            <TextArea rows={3} />
          </Form.Item>
          <div className="flex gap-4">
            <Form.Item label="维度" name="is_dimension" valuePropName="checked">
              <Select options={[{ label: '是', value: true }, { label: '否', value: false }]} />
            </Form.Item>
            <Form.Item label="指标" name="is_measure" valuePropName="checked">
              <Select options={[{ label: '是', value: true }, { label: '否', value: false }]} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
