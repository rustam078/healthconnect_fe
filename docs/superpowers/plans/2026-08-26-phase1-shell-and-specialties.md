# HealthConnect Frontend — Phase 1 (App Shell + Specialties) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the HealthConnect React admin app (Vite + Ant Design + TanStack Query + Axios + React Router) with a working app shell, then deliver the Specialties module as a full CRUD vertical slice.

**Architecture:** Feature-based folder structure. A single Axios client unwraps the backend `ApiResponse` envelope and has an auth-header stub for future JWT. TanStack Query owns all server state. Ant Design provides layout, tables, forms, and feedback. The Vite dev server proxies `/api` to the Spring backend on `:8080` so no backend CORS work is needed.

**Tech Stack:** Vite, React 18 (JavaScript), Ant Design 5, `@ant-design/icons`, `@tanstack/react-query`, axios, react-router-dom 6.

## Global Constraints

- Project root: `D:\HMS\healtconnectfe` (its own git repo, already initialized).
- Language: JavaScript only (no TypeScript). File extensions `.jsx` / `.js`.
- Backend base path: `/api/v1`; backend origin in dev: `http://localhost:8080`.
- All server calls go through the shared Axios client in `src/api/axiosClient.js`.
- All server state goes through TanStack Query hooks — no ad-hoc `useEffect` fetching in components.
- Backend response envelope: `{ success, message, data, errors }`. Feature code receives the unwrapped `data`.
- Paged endpoints return Spring `Page`: `{ content, totalElements, number, size, ... }`. Ant `Table` pagination is 1-based; Spring `page` is 0-based — convert at the hook boundary.
- Commit after each task with the exact message shown.

---

### Task 1: Scaffold Vite React app + dependencies + dev proxy

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `.gitignore`, `src/main.jsx`, `src/app/App.jsx`
- Create (temporary): `src/app/App.jsx` renders a placeholder to prove the toolchain.

**Interfaces:**
- Produces: a running dev server on `:5173`; `vite.config.js` exporting a `/api` proxy to `http://localhost:8080`.

- [ ] **Step 1: Scaffold the Vite project**

Run from `D:\HMS`:
```bash
npm create vite@latest healtconnectfe -- --template react
```
(The folder already exists with a `docs/` dir and git — if the scaffolder refuses, scaffold into a temp dir and copy `package.json`, `vite.config.js`, `index.html`, and `src/` over, keeping the existing `docs/` and `.git/`.)

- [ ] **Step 2: Install dependencies**

Run in `D:\HMS\healtconnectfe`:
```bash
npm install antd @ant-design/icons @tanstack/react-query axios react-router-dom
```

- [ ] **Step 3: Configure the dev proxy in `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 4: Ensure `.gitignore` covers node**

`.gitignore` must contain at least:
```
node_modules
dist
.env
.env.local
*.log
```

- [ ] **Step 5: Minimal `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 6: Placeholder `src/app/App.jsx`**

```jsx
export default function App() {
  return <h1>HealthConnect</h1>
}
```

- [ ] **Step 7: Verify build + dev server**

Run: `npm run build` — Expected: build succeeds, `dist/` produced.
Run: `npm run dev` — Expected: server at `http://localhost:5173`, page shows "HealthConnect".

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React app with antd, react-query, axios, router and /api proxy"
```

---

### Task 2: Axios client with response-unwrap + auth stub

**Files:**
- Create: `src/api/axiosClient.js`
- Create: `src/utils/apiError.js`

**Interfaces:**
- Produces:
  - `default` export `axiosClient` (axios instance, `baseURL: '/api/v1'`).
  - On success, response interceptor returns `response.data.data` (the unwrapped payload) when the envelope is present, else `response.data`.
  - On error, rejects with an `Error` whose `.message` is the backend `message` (falling back to a generic message) and `.status` is the HTTP status.
  - `getErrorMessage(error)` in `apiError.js` → `string`.

- [ ] **Step 1: Create `src/utils/apiError.js`**

```js
export function getErrorMessage(error) {
  if (error && typeof error.message === 'string' && error.message) {
    return error.message
  }
  return 'Something went wrong. Please try again.'
}
```

- [ ] **Step 2: Create `src/api/axiosClient.js`**

```js
import axios from 'axios'

const axiosClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Auth stub: JWT header will be attached here once Spring Security lands.
axiosClient.interceptors.request.use((config) => {
  // const token = getToken()
  // if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Unwrap the backend ApiResponse envelope on success.
axiosClient.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === 'object' && 'data' in body && 'success' in body) {
      return body.data
    }
    return body
  },
  (error) => {
    const body = error.response?.data
    const message =
      body?.message ||
      (Array.isArray(body?.errors) ? body.errors.join(', ') : null) ||
      error.message ||
      'Request failed'
    const wrapped = new Error(message)
    wrapped.status = error.response?.status
    wrapped.errors = body?.errors
    return Promise.reject(wrapped)
  },
)

export default axiosClient
```

- [ ] **Step 3: Verify it imports cleanly**

Run: `npm run build` — Expected: build succeeds (no unused/broken imports).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add axios client with ApiResponse unwrap and auth-header stub"
```

---

### Task 3: Query client, constants, and format utils

**Files:**
- Create: `src/app/queryClient.js`
- Create: `src/constants/enums.js`
- Create: `src/utils/format.js`

**Interfaces:**
- Produces:
  - `queryClient` (configured `QueryClient`).
  - `GENDER_OPTIONS`, `BLOOD_GROUP_OPTIONS`, `APPOINTMENT_STATUS_OPTIONS`, `DAY_OF_WEEK_OPTIONS` — each an array of `{ label, value }`.
  - `formatDate(isoOrDate)` → `'DD MMM YYYY'` or `''`; `formatDateTime(iso)` → string; `formatCurrency(number)` → `'₹1,200.00'`.

- [ ] **Step 1: Create `src/app/queryClient.js`**

```js
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = error?.status
        if (status && status >= 400 && status < 500) return false
        return failureCount < 2
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})
```

- [ ] **Step 2: Create `src/constants/enums.js`**

Values must match the backend enums. If backend enum values differ, update here.
```js
export const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
]

export const BLOOD_GROUP_OPTIONS = [
  { label: 'A+', value: 'A_POSITIVE' },
  { label: 'A-', value: 'A_NEGATIVE' },
  { label: 'B+', value: 'B_POSITIVE' },
  { label: 'B-', value: 'B_NEGATIVE' },
  { label: 'AB+', value: 'AB_POSITIVE' },
  { label: 'AB-', value: 'AB_NEGATIVE' },
  { label: 'O+', value: 'O_POSITIVE' },
  { label: 'O-', value: 'O_NEGATIVE' },
]

export const APPOINTMENT_STATUS_OPTIONS = [
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

export const DAY_OF_WEEK_OPTIONS = [
  { label: 'Monday', value: 'MONDAY' },
  { label: 'Tuesday', value: 'TUESDAY' },
  { label: 'Wednesday', value: 'WEDNESDAY' },
  { label: 'Thursday', value: 'THURSDAY' },
  { label: 'Friday', value: 'FRIDAY' },
  { label: 'Saturday', value: 'SATURDAY' },
  { label: 'Sunday', value: 'SUNDAY' },
]
```
> Note during implementation: verify `BloodGroup` and `Gender` enum constant names against `src/main/java/in/healthconnect/entity/enums/` in the backend and correct any mismatches.

- [ ] **Step 3: Create `src/utils/format.js`**

```js
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${formatDate(value)}, ${time}`
}

export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return ''
  const num = Number(value)
  if (Number.isNaN(num)) return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(num)
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build` — Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add query client, backend enum options, and format utilities"
```

---

### Task 4: App shell — layout, router, providers

**Files:**
- Create: `src/components/layout/AppLayout.jsx`
- Create: `src/features/dashboard/DashboardPage.jsx`
- Create: `src/app/router.jsx`
- Modify: `src/app/App.jsx` (replace placeholder with real providers)

**Interfaces:**
- Consumes: `queryClient` (Task 3).
- Produces:
  - `AppLayout` — renders Ant `Layout` with a collapsible `Sider` menu, a `Header`, and `<Outlet />` in the content.
  - `router` — a `createBrowserRouter` instance with `AppLayout` as the root and children: index → `DashboardPage`, `/specialties` → (added in Task 6).
  - `App` — wraps `QueryClientProvider` → antd `ConfigProvider` → antd `App` → `RouterProvider`.

- [ ] **Step 1: Create `src/features/dashboard/DashboardPage.jsx`**

```jsx
import { Typography, Card } from 'antd'

export default function DashboardPage() {
  return (
    <Card>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Welcome to HealthConnect
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Use the navigation on the left to manage specialties, patients, doctors, and appointments.
      </Typography.Paragraph>
    </Card>
  )
}
```

- [ ] **Step 2: Create `src/components/layout/AppLayout.jsx`**

```jsx
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
```

- [ ] **Step 3: Create `src/app/router.jsx`**

```jsx
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout.jsx'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      // Specialties route added in Task 6
    ],
  },
])
```

- [ ] **Step 4: Replace `src/app/App.jsx`**

```jsx
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, App as AntdApp } from 'antd'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from './queryClient.js'
import { router } from './router.jsx'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={{ token: { colorPrimary: '#1677ff', borderRadius: 6 } }}>
        <AntdApp>
          <RouterProvider router={router} />
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
```

- [ ] **Step 5: Verify in browser**

Run: `npm run dev`.
Expected: left sidebar with 5 nav items (collapsible), header reading "Admin Console" / "Guest", content shows the Dashboard welcome card. Clicking nav items changes the URL (Patients/Doctors/Specialties/Appointments will show a blank content area until their routes exist — that is expected).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: app shell with collapsible sidebar layout, router, and providers"
```

---

### Task 5: Specialties API + React Query hooks

**Files:**
- Create: `src/features/specialties/specialtiesApi.js`
- Create: `src/features/specialties/specialtiesHooks.js`

**Interfaces:**
- Consumes: `axiosClient` (Task 2).
- Produces (`specialtiesApi.js`):
  - `getSpecialties({ search, page, size })` → `Promise<Page>` (`{ content, totalElements, number, size }`). `page` is **0-based** here (already converted).
  - `createSpecialty({ name, description })` → `Promise<SpecialtyResponse>`.
  - `updateSpecialty(id, { name, description })` → `Promise<SpecialtyResponse>`.
  - `deleteSpecialty(id)` → `Promise<void>`.
- Produces (`specialtiesHooks.js`):
  - `useSpecialties({ search, page, size })` — `page` is **1-based** (Ant Table), converted to 0-based before calling the API. Query key: `['specialties', { search, page, size }]`.
  - `useCreateSpecialty()`, `useUpdateSpecialty()`, `useDeleteSpecialty()` — mutations that invalidate `['specialties']` on success.

- [ ] **Step 1: Create `src/features/specialties/specialtiesApi.js`**

```js
import axiosClient from '../../api/axiosClient.js'

export function getSpecialties({ search, page = 0, size = 20 }) {
  return axiosClient.get('/specialties', {
    params: {
      search: search || undefined,
      page,
      size,
    },
  })
}

export function createSpecialty(payload) {
  return axiosClient.post('/specialties', payload)
}

export function updateSpecialty(id, payload) {
  return axiosClient.put(`/specialties/${id}`, payload)
}

export function deleteSpecialty(id) {
  return axiosClient.delete(`/specialties/${id}`)
}
```

- [ ] **Step 2: Create `src/features/specialties/specialtiesHooks.js`**

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} from './specialtiesApi.js'

export function useSpecialties({ search, page = 1, size = 20 }) {
  return useQuery({
    queryKey: ['specialties', { search, page, size }],
    queryFn: () => getSpecialties({ search, page: page - 1, size }),
    keepPreviousData: true,
  })
}

export function useCreateSpecialty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSpecialty,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specialties'] }),
  })
}

export function useUpdateSpecialty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => updateSpecialty(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specialties'] }),
  })
}

export function useDeleteSpecialty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSpecialty,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specialties'] }),
  })
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build` — Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(specialties): add API calls and react-query hooks"
```

---

### Task 6: Specialties list page (table + search + pagination) wired into router

**Files:**
- Create: `src/features/specialties/specialtyColumns.jsx`
- Create: `src/features/specialties/SpecialtyListPage.jsx`
- Modify: `src/app/router.jsx` (add `/specialties` route)

**Interfaces:**
- Consumes: `useSpecialties`, `useDeleteSpecialty` (Task 5); `formatDateTime` (Task 3).
- Produces:
  - `getSpecialtyColumns({ onEdit, onDelete })` → Ant `Table` columns array.
  - `SpecialtyListPage` — default export; manages `search`, `page`, `size` state; renders search input, "Add Specialty" button, and the table. (The form modal is added in Task 7; until then the Add/Edit buttons can no-op or be disabled — this task focuses on read + delete.)

- [ ] **Step 1: Create `src/features/specialties/specialtyColumns.jsx`**

```jsx
import { Button, Popconfirm, Space } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'

export function getSpecialtyColumns({ onEdit, onDelete }) {
  return [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (v) => v || <span style={{ color: '#999' }}>—</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this specialty?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(record)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]
}
```

- [ ] **Step 2: Create `src/features/specialties/SpecialtyListPage.jsx`**

```jsx
import { useState } from 'react'
import { Card, Table, Input, Button, Space, Typography, App } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useSpecialties, useDeleteSpecialty } from './specialtiesHooks.js'
import { getSpecialtyColumns } from './specialtyColumns.jsx'
import { getErrorMessage } from '../../utils/apiError.js'

export default function SpecialtyListPage() {
  const { message } = App.useApp()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)

  const { data, isFetching, isError, error } = useSpecialties({ search, page, size })
  const deleteMutation = useDeleteSpecialty()

  const rows = data?.content ?? []
  const total = data?.totalElements ?? 0

  const handleDelete = (record) => {
    deleteMutation.mutate(record.id, {
      onSuccess: () => message.success('Specialty deleted'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  const columns = getSpecialtyColumns({
    onEdit: () => message.info('Edit form arrives in the next task'),
    onDelete: handleDelete,
  })

  return (
    <Card>
      <Space
        style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Specialties
        </Typography.Title>
        <Space>
          <Input.Search
            allowClear
            placeholder="Search name or description"
            style={{ width: 280 }}
            onSearch={(v) => {
              setSearch(v)
              setPage(1)
            }}
          />
          <Button type="primary" icon={<PlusOutlined />} disabled>
            Add Specialty
          </Button>
        </Space>
      </Space>

      {isError && (
        <Typography.Text type="danger">{getErrorMessage(error)}</Typography.Text>
      )}

      <Table
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={rows}
        pagination={{
          current: page,
          pageSize: size,
          total,
          showSizeChanger: true,
          onChange: (p, s) => {
            setPage(p)
            setSize(s)
          },
        }}
      />
    </Card>
  )
}
```

- [ ] **Step 3: Wire the route in `src/app/router.jsx`**

Replace the `children` array so it includes the specialties route:
```jsx
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout.jsx'
import DashboardPage from '../features/dashboard/DashboardPage.jsx'
import SpecialtyListPage from '../features/specialties/SpecialtyListPage.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'specialties', element: <SpecialtyListPage /> },
    ],
  },
])
```

- [ ] **Step 4: Verify in browser (backend running on :8080)**

Run backend, then `npm run dev`. Navigate to Specialties.
Expected: table lists specialties from the API, search filters results, pagination works, delete removes a row and shows a success toast. If the backend is down, the page shows an error message rather than crashing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(specialties): list page with search, pagination, and delete"
```

---

### Task 7: Specialty create/edit form modal

**Files:**
- Create: `src/features/specialties/SpecialtyFormModal.jsx`
- Modify: `src/features/specialties/SpecialtyListPage.jsx` (open modal for add/edit, enable the Add button)

**Interfaces:**
- Consumes: `useCreateSpecialty`, `useUpdateSpecialty` (Task 5).
- Produces:
  - `SpecialtyFormModal({ open, mode, initialValues, onClose })` — `mode` is `'create' | 'edit'`. On submit it calls the matching mutation, shows a toast, and closes on success. `initialValues` shape: `{ id, name, description }`.

- [ ] **Step 1: Create `src/features/specialties/SpecialtyFormModal.jsx`**

```jsx
import { useEffect } from 'react'
import { Modal, Form, Input, App } from 'antd'
import { useCreateSpecialty, useUpdateSpecialty } from './specialtiesHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'

export default function SpecialtyFormModal({ open, mode, initialValues, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const createMutation = useCreateSpecialty()
  const updateMutation = useUpdateSpecialty()
  const isEdit = mode === 'edit'
  const submitting = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: initialValues?.name ?? '',
        description: initialValues?.description ?? '',
      })
    }
  }, [open, initialValues, form])

  const handleOk = async () => {
    const values = await form.validateFields()
    const payload = { name: values.name.trim(), description: values.description?.trim() || null }
    const onError = (e) => message.error(getErrorMessage(e))

    if (isEdit) {
      updateMutation.mutate(
        { id: initialValues.id, payload },
        {
          onSuccess: () => {
            message.success('Specialty updated')
            onClose()
          },
          onError,
        },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          message.success('Specialty created')
          onClose()
        },
        onError,
      })
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit Specialty' : 'Add Specialty'}
      okText={isEdit ? 'Save' : 'Create'}
      confirmLoading={submitting}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="name"
          label="Name"
          rules={[
            { required: true, message: 'Name is required' },
            { max: 100, message: 'Name must not exceed 100 characters' },
          ]}
        >
          <Input placeholder="e.g. Cardiology" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          rules={[{ max: 500, message: 'Description must not exceed 500 characters' }]}
        >
          <Input.TextArea rows={3} placeholder="Optional description" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
```

- [ ] **Step 2: Wire the modal into `SpecialtyListPage.jsx`**

Add modal state and render it; enable the Add button and connect Edit:
```jsx
// add imports
import SpecialtyFormModal from './SpecialtyFormModal.jsx'
// add near other useState calls:
const [modal, setModal] = useState({ open: false, mode: 'create', record: null })
```
Replace the Add button and the `onEdit` handler:
```jsx
// Add button:
<Button
  type="primary"
  icon={<PlusOutlined />}
  onClick={() => setModal({ open: true, mode: 'create', record: null })}
>
  Add Specialty
</Button>
```
```jsx
// columns onEdit:
const columns = getSpecialtyColumns({
  onEdit: (record) => setModal({ open: true, mode: 'edit', record }),
  onDelete: handleDelete,
})
```
Add the modal render before the closing `</Card>`:
```jsx
<SpecialtyFormModal
  open={modal.open}
  mode={modal.mode}
  initialValues={modal.record}
  onClose={() => setModal((m) => ({ ...m, open: false }))}
/>
```

- [ ] **Step 3: Verify in browser**

Expected: "Add Specialty" opens a modal; submitting creates a specialty and the table refreshes with a success toast. "Edit" pre-fills the modal; saving updates the row. Validation blocks empty name. A backend error (e.g. duplicate name → 400/409) surfaces as an error toast without crashing.
> Known backend limitation: `updateSpecialty` currently only changes description and rejects a null description (backend finding #5). The frontend is correct; the edit of `name` will take effect once the backend is fixed.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(specialties): create/edit form modal"
```

---

### Task 8: README + Phase 1 wrap

**Files:**
- Create: `README.md`

**Interfaces:** none.

- [ ] **Step 1: Write `README.md`**

```markdown
# HealthConnect Frontend

React admin UI for the HealthConnect Spring Boot API.

## Stack
Vite · React (JS) · Ant Design · TanStack Query · Axios · React Router

## Prerequisites
- Node 18+
- Backend running on http://localhost:8080

## Getting started
    npm install
    npm run dev
Open http://localhost:5173. The dev server proxies `/api` to the backend on `:8080`.

## Scripts
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview the production build

## Structure
- `src/api` — shared Axios client
- `src/app` — App root, router, query client
- `src/components/layout` — app shell
- `src/features/<module>` — one folder per feature (API, hooks, screens)
- `src/constants`, `src/utils` — shared helpers

## Modules
- [x] Specialties
- [ ] Patients
- [ ] Doctors
- [ ] Doctor availability + specialty assignment
- [ ] Appointments
```

- [ ] **Step 2: Verify + commit**

Run: `npm run build` — Expected: succeeds.
```bash
git add -A
git commit -m "docs: add frontend README"
```

---

## Notes for later phases (not in this plan)

- Patients, Doctors, Availability, and Appointments each get their own plan following the Specialties pattern (`api.js` + `hooks.js` + list page + form modal, plus filter controls where the endpoint supports them).
- Optional add-ons deferred by the spec: Vitest + React Testing Library harness, dark-mode toggle, real dashboard analytics.
