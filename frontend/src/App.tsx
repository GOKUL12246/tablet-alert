import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { useAuth } from './hooks/useAuth';
import { stopSpeaking } from './lib/speechUtils';
import AlarmModal from './components/patient/AlarmModal';

// Pages - Public
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import LanguageSelect from './pages/LanguageSelect';

// Pages - Patient
import PatientDashboard from './pages/patient/Dashboard';
import PatientMedicines from './pages/patient/Medicines';
import AddMedicine from './pages/patient/AddMedicine';
import MedicineDetail from './pages/patient/MedicineDetail';
import PrescriptionUpload from './pages/patient/PrescriptionUpload';
import PrescriptionVerify from './pages/patient/PrescriptionVerify';
import MedicineIdentification from './pages/patient/MedicineIdentification';
import Schedule from './pages/patient/Schedule';
import ReminderConfirm from './pages/patient/ReminderConfirm';
import MedicineHistory from './pages/patient/MedicineHistory';
import VoiceAssistant from './pages/patient/VoiceAssistant';
import Chatbot from './pages/patient/Chatbot';
import AccessibilitySettings from './pages/patient/AccessibilitySettings';

// Pages - Caregiver
import CaregiverDashboard from './pages/caregiver/Dashboard';
import CaregiverAlerts from './pages/caregiver/Alerts';
import AssistanceRequests from './pages/caregiver/AssistanceRequests';
import NotificationHistory from './pages/caregiver/NotificationHistory';
import CaregiverLinking from './pages/caregiver/CaregiverLinking';

// Pages - Healthcare
import HealthcareDashboard from './pages/healthcare/Dashboard';

// Pages - Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import SystemSettings from './pages/admin/SystemSettings';
import AuditLogs from './pages/admin/AuditLogs';

// Pages - Shared
import Reports from './pages/shared/Reports';
import PrivacyConsent from './pages/shared/PrivacyConsent';
import HelpSupport from './pages/shared/HelpSupport';
import NotFound from './pages/shared/NotFound';

// Protected Route wrapper
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
        <p className="text-blue-700 text-lg font-medium">Loading MEDISAKHI AI…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={user ? <Navigate to={`/${user.role.replace('_', '-')}/dashboard`} /> : <Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/language" element={<LanguageSelect />} />
      <Route path="/privacy" element={<PrivacyConsent />} />
      <Route path="/help" element={<HelpSupport />} />

      {/* Patient routes */}
      <Route path="/patient/dashboard" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/medicines" element={<ProtectedRoute roles={['patient']}><PatientMedicines /></ProtectedRoute>} />
      <Route path="/patient/medicines/add" element={<ProtectedRoute roles={['patient']}><AddMedicine /></ProtectedRoute>} />
      <Route path="/patient/medicines/:id" element={<ProtectedRoute roles={['patient']}><MedicineDetail /></ProtectedRoute>} />
      <Route path="/patient/prescriptions/upload" element={<ProtectedRoute roles={['patient']}><PrescriptionUpload /></ProtectedRoute>} />
      <Route path="/patient/prescriptions/:id/verify" element={<ProtectedRoute roles={['patient']}><PrescriptionVerify /></ProtectedRoute>} />
      <Route path="/patient/medicine-identification" element={<ProtectedRoute roles={['patient']}><MedicineIdentification /></ProtectedRoute>} />
      <Route path="/patient/schedule" element={<ProtectedRoute roles={['patient']}><Schedule /></ProtectedRoute>} />
      <Route path="/patient/reminders/:id" element={<ProtectedRoute roles={['patient']}><ReminderConfirm /></ProtectedRoute>} />
      <Route path="/patient/history" element={<ProtectedRoute roles={['patient']}><MedicineHistory /></ProtectedRoute>} />
      <Route path="/patient/voice" element={<ProtectedRoute roles={['patient']}><VoiceAssistant /></ProtectedRoute>} />
      <Route path="/patient/chatbot" element={<ProtectedRoute roles={['patient']}><Chatbot /></ProtectedRoute>} />
      <Route path="/patient/accessibility" element={<ProtectedRoute roles={['patient']}><AccessibilitySettings /></ProtectedRoute>} />
      <Route path="/patient/reports" element={<ProtectedRoute roles={['patient']}><Reports /></ProtectedRoute>} />

      {/* Caregiver routes */}
      <Route path="/caregiver/dashboard" element={<ProtectedRoute roles={['caregiver']}><CaregiverDashboard /></ProtectedRoute>} />
      <Route path="/caregiver/alerts" element={<ProtectedRoute roles={['caregiver']}><CaregiverAlerts /></ProtectedRoute>} />
      <Route path="/caregiver/requests" element={<ProtectedRoute roles={['caregiver']}><AssistanceRequests /></ProtectedRoute>} />
      <Route path="/caregiver/notifications" element={<ProtectedRoute roles={['caregiver']}><NotificationHistory /></ProtectedRoute>} />
      <Route path="/caregiver/link" element={<ProtectedRoute roles={['caregiver']}><CaregiverLinking /></ProtectedRoute>} />
      <Route path="/caregiver/reports" element={<ProtectedRoute roles={['caregiver']}><Reports /></ProtectedRoute>} />

      {/* Healthcare Professional */}
      <Route path="/healthcare-professional/dashboard" element={<ProtectedRoute roles={['healthcare_professional']}><HealthcareDashboard /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><SystemSettings /></ProtectedRoute>} />
      <Route path="/admin/audit" element={<ProtectedRoute roles={['admin']}><AuditLogs /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><Reports /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function RouteAudioStopper() {
  const location = useLocation();
  useEffect(() => {
    // Whenever navigation happens or user leaves current page, stop speech immediately
    stopSpeaking();
  }, [location.pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AccessibilityProvider>
            <RouteAudioStopper />
            <AppRoutes />
            <AlarmModal />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { fontFamily: 'Inter, system-ui, sans-serif', fontSize: '1rem' },
              }}
            />
          </AccessibilityProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
