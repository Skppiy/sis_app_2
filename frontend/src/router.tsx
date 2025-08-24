import * as React from 'react';
import {
  Router,
  RootRoute,
  Route,
  redirect,
} from '@tanstack/react-router';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import { AppShell } from '@/layouts/AppShell';
import { useAuth } from '@/auth/AuthContext';

const rootRoute = new RootRoute();

// Create a component that checks auth and renders children or redirects
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    throw redirect({ to: '/login' });
  }
  
  return <>{children}</>;
}

// Login route (public)
const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

// App layout route (protected)
const appLayoutRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: () => (
    <RequireAuth>
      <AppShell />
    </RequireAuth>
  ),
});

// Dashboard route (child of app layout)
const dashboardRoute = new Route({
  getParentRoute: () => appLayoutRoute,
  path: '/dashboard',
  component: Dashboard,
});

// Academic Years route (child of app layout)
const yearsRoute = new Route({
  getParentRoute: () => appLayoutRoute,
  path: '/years',
  component: React.lazy(() => import('@/features/academics/pages/YearsPage')),
});

// Subjects route (child of app layout)
const subjectsRoute = new Route({
  getParentRoute: () => appLayoutRoute,
  path: '/subjects',
  component: React.lazy(() => import('@/features/academics/pages/SubjectsPage')),
});

// Classrooms route (child of app layout)
const classroomsRoute = new Route({
  getParentRoute: () => appLayoutRoute,
  path: '/classrooms',
  component: React.lazy(() => import('@/features/academics/pages/ClassroomsPage')),
});

// Rooms route (child of app layout) - NEW
const roomsRoute = new Route({
  getParentRoute: () => appLayoutRoute,
  path: '/rooms',
  component: React.lazy(() => import('@/features/facilities/pages/RoomsPage')),
});

// Students route (child of app layout)
const studentsRoute = new Route({
  getParentRoute: () => appLayoutRoute,
  path: '/students',
  component: React.lazy(() => import('@/features/enrollment/pages/StudentsPage')),
});

// Root redirect to login
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    throw redirect({ to: '/login' });
  },
});

// Build the route tree
export const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  appLayoutRoute.addChildren([
    dashboardRoute, 
    yearsRoute, 
    subjectsRoute,
    classroomsRoute,
    roomsRoute, // Added rooms route
    studentsRoute
  ])
]);

// Create router
export const router = new Router({ 
  routeTree,
  defaultPreload: 'intent',
});

// Augment the Router type
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}