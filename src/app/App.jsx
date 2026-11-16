import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, App as AntdApp } from 'antd'
import { RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '../store/store.js'
import { queryClient } from './queryClient.js'
import { router } from './router.jsx'
import { appTheme } from './theme.js'
import AuthBootstrap from './AuthBootstrap.jsx'

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={appTheme}>
          <AntdApp>
            <AuthBootstrap>
              <RouterProvider router={router} />
            </AuthBootstrap>
          </AntdApp>
        </ConfigProvider>
      </QueryClientProvider>
    </Provider>
  )
}
