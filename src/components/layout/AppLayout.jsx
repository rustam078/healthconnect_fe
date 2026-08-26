import { useState } from 'react'
import { Layout, Menu, theme } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  ApartmentOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { Link, Outlet, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const MENU_ITEMS = [
  { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Dashboard</Link> },
  { key: '/patients', icon: <TeamOutlined />, label: <Link to="/patients">Patients</Link> },
  { key: '/doctors', icon: <MedicineBoxOutlined />, label: <Link to="/doctors">Doctors</Link> },
  { key: '/specialties', icon: <ApartmentOutlined />, label: <Link to="/specialties">Specialties</Link> },
  { key: '/appointments', icon: <CalendarOutlined />, label: <Link to="/appointments">Appointments</Link> },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { token } = theme.useToken()

  const selectedKey =
    MENU_ITEMS.map((i) => i.key)
      .filter((k) => k !== '/' && location.pathname.startsWith(k))
      .sort((a, b) => b.length - a.length)[0] || '/'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 48,
            margin: 16,
            color: '#fff',
            fontWeight: 700,
            fontSize: collapsed ? 14 : 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {collapsed ? 'HC' : 'HealthConnect'}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={MENU_ITEMS} />
      </Sider>
      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600 }}>Admin Console</span>
          <span style={{ color: token.colorTextSecondary }}>Guest</span>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
