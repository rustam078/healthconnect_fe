import { useState } from 'react'
import { Layout, Menu, Avatar } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { BRAND } from '../../app/theme.js'

const { Header, Sider, Content } = Layout

// The sidebar is fixed, so the content beside it has to be pushed over by exactly the
// same amount. Keeping both numbers here means they cannot drift apart.
const SIDER_WIDTH = 244
const SIDER_COLLAPSED = 76

// The app is rendered at --ui-scale (see global.css) and zoom leaves viewport
// units alone, so a bare 100vh would stop short of the bottom of the screen.
const FULL_HEIGHT = 'calc(100vh / var(--ui-scale))'

const NAV = [
  { key: '/', title: 'Dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/patients', title: 'Patients', icon: <TeamOutlined />, label: 'Patients' },
  { key: '/doctors', title: 'Doctors', icon: <MedicineBoxOutlined />, label: 'Doctors' },
  { key: '/specialties', title: 'Specialties', icon: <ApartmentOutlined />, label: 'Specialties' },
  { key: '/appointments', title: 'Appointments', icon: <CalendarOutlined />, label: 'Appointments' },
]

const MENU_ITEMS = NAV.map(({ key, icon, label }) => ({
  key,
  icon,
  label: <Link to={key}>{label}</Link>,
}))

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const selectedKey =
    NAV.map((i) => i.key)
      .filter((k) => k !== '/' && location.pathname.startsWith(k))
      .sort((a, b) => b.length - a.length)[0] || '/'

  const currentTitle = NAV.find((n) => n.key === selectedKey)?.title || 'HealthConnect'

  return (
    <Layout style={{ minHeight: FULL_HEIGHT }}>
      <Sider
        width={SIDER_WIDTH}
        collapsedWidth={SIDER_COLLAPSED}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        // Pinned to the viewport: the nav used to scroll away with the page, leaving a
        // pale gap under it once the content was taller than the screen.
        style={{
          position: 'fixed',
          insetInlineStart: 0,
          top: 0,
          bottom: 0,
          height: FULL_HEIGHT,
          overflow: 'auto',
          zIndex: 20,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: collapsed ? 0 : '0 20px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${BRAND.primaryBright}, ${BRAND.primary})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 17,
              flex: '0 0 auto',
            }}
          >
            H
          </div>
          {!collapsed && (
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 17, letterSpacing: 0.3 }}>
              HealthConnect
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={MENU_ITEMS}
          style={{ borderInlineEnd: 'none', paddingTop: 8 }}
        />
      </Sider>

      <Layout
        style={{
          marginInlineStart: collapsed ? SIDER_COLLAPSED : SIDER_WIDTH,
          transition: 'margin-inline-start 0.2s',
          minHeight: FULL_HEIGHT,
        }}
      >
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${BRAND.border}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: BRAND.heading, lineHeight: 1.2 }}>
              {currentTitle}
            </div>
            <div style={{ fontSize: 12, color: '#7C8B87' }}>HealthConnect Admin</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar
              size={36}
              style={{ background: '#E6F4F1', color: BRAND.primary }}
              icon={<UserOutlined />}
            />
            <span style={{ color: '#33413E', fontWeight: 500 }}>Guest</span>
          </div>
        </Header>

        {/* minHeight keeps the tinted page background covering the full viewport on short
            pages, instead of stopping under the content and showing white below. */}
        <Content style={{ padding: '28px 32px', minHeight: `calc(${FULL_HEIGHT} - 64px)` }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
