import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, App as AntdApp } from 'antd'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from './queryClient.js'
import { router } from './router.jsx'
import { appTheme } from './theme.js'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={appTheme}>
        <AntdApp>
          <RouterProvider router={router} />
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
