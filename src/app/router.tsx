import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { RoleProtectedRoute } from '@/features/auth/RoleProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ProfilePage } from '@/features/auth/ProfilePage';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomePage } from '@/components/layout/HomePage';
import { ScanQRPage, ScanTargetPage } from '@/features/scan';
import {
  WorkOrdersPage,
  WorkOrderDetailPage,
} from '@/features/workorders';
import {
  EquipmentListPage,
  EquipmentDetailPage,
  QRPrintPage,
} from '@/features/equipment';
import { DashboardPage } from '@/features/dashboard';
import { UserManagementPage } from '@/features/users/UserManagementPage';
import { AuditLogPage } from '@/features/audit';

const router = createBrowserRouter([
  // Public Routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },

  // QR Print Route (A4 Printing View)
  {
    path: '/equipment/print-qr',
    element: (
      <ProtectedRoute>
        <QRPrintPage />
      </ProtectedRoute>
    ),
  },

  // Protected App Shell Routes
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'scan-qr',
        element: <ScanQRPage />,
      },
      {
        path: 'scan/:equipmentId',
        element: <ScanTargetPage />,
      },
      {
        path: 'work-orders',
        element: <WorkOrdersPage />,
      },
      {
        path: 'work-orders/:id',
        element: <WorkOrderDetailPage />,
      },
      {
        path: 'equipment',
        element: <EquipmentListPage />,
      },
      {
        path: 'equipment/:id',
        element: <EquipmentDetailPage />,
      },
      {
        path: 'dashboard',
        element: (
          <RoleProtectedRoute allowedRoles={['supervisor', 'admin']}>
            <DashboardPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleProtectedRoute allowedRoles={['admin']}>
            <UserManagementPage />
          </RoleProtectedRoute>
        ),
      },
      {
        path: 'audit',
        element: (
          <RoleProtectedRoute allowedRoles={['admin']}>
            <AuditLogPage />
          </RoleProtectedRoute>
        ),
      },
    ],
  },

  // Fallback Route
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
