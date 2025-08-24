import * as React from 'react';
import {
  Router,
  RootRoute,
  Route,
} from '@tanstack/react-router';
import Login from '@pages/Login';
import Dashboard from '@pages/Dashboard';
import { AppShell } from '@layouts/AppShell';
import { useAuth } from '@auth/AuthContext';

const rootRoute = new RootRoute();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    // TanStack Router redirect
    throw Router.redirect({ to: '/login' });
  }
  return <>{children}</>;
}

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

const appLayoutRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: () => (
    <RequireAuth>
      <AppShell />
    </RequireAuth>
  ),
});

const dashboardRoute = new Route({
  getParentRoute: () => appLayoutRoute,
  path: 'dashboard',
  component: Dashboard,
});

const yearsRoute = new Route({
  getParentRoute: () => appLayoutRoute,
  path: 'years',
  component: React.lazy(() => import('@features/academics/pages/YearsPage')),
});

export const routeTree = rootRoute.addChildren([loginRoute, appLayoutRoute.addChildren([dashboardRoute, yearsRoute])]);
export const router = new Router({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
