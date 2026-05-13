import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu } from 'antd'
import { BuildOutlined, DatabaseOutlined, SettingOutlined } from '@ant-design/icons'

const { Header, Content } = AntLayout

const menuItems = [
  { key: '/', icon: <BuildOutlined />, label: 'SQL 构建器' },
  { key: '/fields', icon: <DatabaseOutlined />, label: '字段管理' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <AntLayout className="min-h-screen">
      <Header className="flex items-center bg-white border-b border-gray-200 px-6">
        <h1 className="text-lg font-bold mr-8 mb-0 whitespace-nowrap">
          SQL 点选式生成器
        </h1>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="flex-1 border-0"
        />
      </Header>
      <Content className="p-6 bg-gray-50">
        <Outlet />
      </Content>
    </AntLayout>
  )
}
