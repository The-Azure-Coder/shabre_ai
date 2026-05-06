import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { AppFrame } from '@/components/layout/app-frame'

export const Route = createRootRoute({
  component: () => (
    <>
      <AppFrame>
        <Outlet />
      </AppFrame>
      {process.env.NODE_ENV === 'development' && <TanStackRouterDevtools />}
    </>
  ),
})
