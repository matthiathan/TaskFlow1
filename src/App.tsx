import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { ERPRequestsPage } from './pages/ERPRequestsPage';
import { VerificationsPage } from './pages/VerificationsPage';
import { MessagesPage } from './pages/MessagesPage';
import { SpecialTasksPage } from './pages/SpecialTasksPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { useAuth } from './contexts/AuthContext';

const AppRoutes = () => {
  const { loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Universal Protected Routes (All Roles) */}
      <Route element={<ProtectedRoute roles={['admin', 'road_tech', 'user']} />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/special-tasks" element={<SpecialTasksPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/messages" element={<MessagesPage />} />
      </Route>

      {/* Strict Admin Only Routes */}
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin/users" element={<AdminUsersPage />} />
      </Route>

      {/* Admin/Tech Only Routes */}
      <Route element={<ProtectedRoute roles={['admin', 'road_tech']} />}>
        <Route path="/erp-requests" element={<ERPRequestsPage />} />
        <Route path="/verifications" element={<VerificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

