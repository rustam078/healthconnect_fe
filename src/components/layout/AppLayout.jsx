import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd'
import { useQuery } from '@tanstack/react-query'
import {
  DashboardOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  IdcardOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
  UsergroupAddOutlined,
  FileTextOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { BRAND } from '../../app/theme.js'
import { usePermission } from '../../features/auth/permissions.js'
import { listMyCommunities } from '../../features/community/communityApi.js'
import { loggedOut, selectUser } from '../../store/authSlice.js'

const { Header, Sider, Content } = Layout

// The sidebar is fixed, so the content beside it has to be pushed over by exactly the
// same amount. Keeping both numbers here means they cannot drift apart.
const SIDER_WIDTH = 244
const SIDER_COLLAPSED = 76

// The app is rendered at --ui-scale (see global.css) and zoom leaves viewport
// units alone, so a bare 100vh would stop short of the bottom of the screen.
const FULL_HEIGHT = 'calc(100vh / var(--ui-scale))'

// The sidebar grouped by audience; each item is shown only if the user can view its module.
const NAV_GROUPS = [
  {
    key: 'admin',
    label: 'Administration',
    items: [
      { key: '/', title: 'Dashboard', icon: <DashboardOutlined />, module: 'DASHBOARD' },
      { key: '/patients', title: 'Patients', icon: <TeamOutlined />, module: 'PATIENTS' },
      { key: '/doctors', title: 'Doctors', icon: <MedicineBoxOutlined />, module: 'DOCTORS' },
      { key: '/specialties', title: 'Specialties', icon: <ApartmentOutlined />, module: 'SPECIALTIES' },
      { key: '/appointments', title: 'Appointments', icon: <CalendarOutlined />, module: 'APPOINTMENTS' },
      { key: '/reports', title: 'Reports', icon: <FileTextOutlined />, module: 'REPORTS' },
      { key: '/roles', title: 'Roles', icon: <SafetyCertificateOutlined />, module: 'ROLES' },
      { key: '/users', title: 'Users', icon: <UsergroupAddOutlined />, module: 'USERS' },
      { key: '/settings', title: 'Settings', icon: <SettingOutlined />, module: 'SETTINGS' },
    ],
  },
  {
    key: 'doctor',
    label: 'Doctor',
    items: [
      { key: '/doctor/schedule', title: 'My Schedule', icon: <CalendarOutlined />, module: 'DOCTOR_PORTAL' },
      { key: '/doctor/patients', title: 'My Patients', icon: <TeamOutlined />, module: 'DOCTOR_PORTAL' },
    ],
  },
  {
    key: 'me',
    label: 'My Health',
    items: [
      { key: '/me/book', title: 'Book Appointment', icon: <CalendarOutlined />, module: 'CUSTOMER_PORTAL' },
      { key: '/me/appointments', title: 'My Appointments', icon: <SolutionOutlined />, module: 'CUSTOMER_PORTAL' },
      { key: '/me/prescriptions', title: 'My Prescriptions', icon: <MedicineBoxOutlined />, module: 'CUSTOMER_PORTAL' },
      { key: '/me/reports', title: 'My Reports', icon: <FileTextOutlined />, module: 'CUSTOMER_PORTAL' },
      { key: '/me/profile', title: 'My Profile', icon: <IdcardOutlined />, module: 'CUSTOMER_PORTAL' },
    ],
  },
  {
    key: 'community',
    label: 'Community',
    items: [
      { key: '/community', title: 'Community Chat', icon: <MessageOutlined />, module: 'COMMUNITIES' },
    ],
  },
]

// Flattened for selected-key matching and the header title.
const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items)

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const { canView } = usePermission()

  // Live-ish unread total for the Community nav badge: refetch only while the tab is focused
  // (no background polling, no persistent connection). On the chat page SSE keeps it instant.
  const { data: myCommunities } = useQuery({
    queryKey: ['communities'],
    queryFn: listMyCommunities,
    enabled: canView('COMMUNITIES'),
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true, // app-wide default is false; badge needs the focus refetch
    staleTime: 0,
  })
  const unreadTotal = (myCommunities ?? []).reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  // Build grouped menu items, keeping only viewable entries and dropping any empty group.
  const menuItems = NAV_GROUPS.map((group) => {
    const children = group.items
      .filter((n) => canView(n.module))
      .map(({ key, icon, title }) => ({
        key,
        icon,
        label: key === '/community' ? (
          <Link to={key}>
            {title}
            {unreadTotal > 0 && (
              <Badge count={unreadTotal} size="small" style={{ marginInlineStart: 8, boxShadow: 'none' }} />
            )}
          </Link>
        ) : (
          <Link to={key}>{title}</Link>
        ),
      }))
    return children.length ? { key: group.key, type: 'group', label: group.label, children } : null
  }).filter(Boolean)

  const handleLogout = () => {
    dispatch(loggedOut())
    navigate('/login', { replace: true })
  }

  const selectedKey =
    ALL_NAV.map((i) => i.key)
      .filter((k) => k !== '/' && location.pathname.startsWith(k))
      .sort((a, b) => b.length - a.length)[0] || '/'

  const currentTitle = ALL_NAV.find((n) => n.key === selectedKey)?.title || 'HealthConnect'

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
          items={menuItems}
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
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'logout', icon: <LogoutOutlined />, label: 'Log out', onClick: handleLogout },
              ],
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <Avatar
                size={36}
                style={{ background: '#E6F4F1', color: BRAND.primary }}
                icon={<UserOutlined />}
              />
              <span style={{ color: '#33413E', fontWeight: 500 }}>{user?.username || 'Guest'}</span>
            </div>
          </Dropdown>
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
