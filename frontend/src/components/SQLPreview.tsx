import { Card, Button, message, Input } from 'antd'
import { CopyOutlined } from '@ant-design/icons'

interface Props {
  sql: string
  loading?: boolean
}

export default function SQLPreview({ sql, loading }: Props) {
  const handleCopy = () => {
    if (!sql) return
    navigator.clipboard.writeText(sql).then(() => {
      message.success('已复制到剪贴板')
    }).catch(() => {
      message.error('复制失败')
    })
  }

  return (
    <Card
      title="生成的 SQL"
      extra={
        <Button
          size="small"
          icon={<CopyOutlined />}
          onClick={handleCopy}
          disabled={!sql}
        >
          复制
        </Button>
      }
      className="h-full"
    >
      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">
          正在生成 SQL...
        </div>
      ) : sql ? (
        <Input.TextArea
          value={sql}
          readOnly
          rows={20}
          className="font-mono text-sm"
          style={{ resize: 'none' }}
        />
      ) : (
        <div className="flex items-center justify-center h-40 text-gray-400 text-center">
          <div>
            <p>选择维度和指标后</p>
            <p>点击「生成 SQL」按钮</p>
          </div>
        </div>
      )}
    </Card>
  )
}
