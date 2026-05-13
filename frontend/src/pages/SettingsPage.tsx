import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, message } from 'antd'
import { getSettings, updateSettings, testConnection } from '../api'

export default function SettingsPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    getSettings().then((data) => {
      form.setFieldsValue(data)
    }).catch(() => {})
  }, [form])

  const handleSave = async (values: any) => {
    setLoading(true)
    try {
      await updateSettings(values)
      message.success('保存成功')
    } catch {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const res = await testConnection()
      if (res.message.includes('成功')) {
        message.success(res.message)
      } else {
        message.warning(res.message)
      }
    } catch {
      message.error('测试请求失败')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card title="API 配置">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            api_base_url: 'https://api.openai.com/v1',
            model: 'gpt-3.5-turbo',
          }}
        >
          <Form.Item
            label="API Base URL"
            name="api_base_url"
            rules={[{ required: true, message: '请输入 API Base URL' }]}
          >
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item
            label="API Key"
            name="api_key"
            rules={[{ required: true, message: '请输入 API Key' }]}
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>

          <Form.Item
            label="Model"
            name="model"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="gpt-3.5-turbo" />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex gap-3">
              <Button type="primary" htmlType="submit" loading={loading}>
                保存配置
              </Button>
              <Button onClick={handleTest} loading={testing}>
                测试连接
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
