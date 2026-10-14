import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  LayoutDashboard,
  Pill,
  Calendar,
  MessageSquare,
  Mic,
  Camera,
  FileText,
  Clock,
  Sliders,
  Bell,
  Users,
  Settings,
  ShieldAlert,
  BarChart2,
  Smartphone,
  PhoneCall,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const role = user?.role || 'patient';

  const patientLinks = [
    { to: '/patient/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/patient/medicines', label: t('nav.medicines'), icon: Pill },
    { to: '/patient/schedule', label: t('nav.schedule'), icon: Calendar },
    { to: '/patient/chatbot', label: t('nav.chatbot'), icon: MessageSquare },
    { to: '/patient/voice', label: t('nav.voice'), icon: Mic },
    { to: '/patient/medicine-identification', label: t('nav.identification'), icon: Camera },
    { to: '/patient/prescriptions/upload', label: t('nav.prescriptions'), icon: FileText },
    { to: '/patient/history', label: t('nav.history'), icon: Clock },
    { to: '/help/keypad', label: language === 'ta' ? 'கீபேடு தொலைபேசி' : 'Keypad Phone SMS', icon: Smartphone },
    { to: '/patient/accessibility', label: t('nav.accessibility'), icon: Sliders },
  ];

  const caregiverLinks = [
    { to: '/caregiver/dashboard', label: t('caregiver.dashboard'), icon: LayoutDashboard },
    { to: '/caregiver/alerts', label: t('caregiver.alerts'), icon: Bell },
    { to: '/caregiver/requests', label: t('caregiver.requests'), icon: PhoneCall },
    { to: '/caregiver/link', label: t('caregiver.link_patient'), icon: Users },
    { to: '/caregiver/notifications', label: t('caregiver.notifications'), icon: MessageSquare },
    { to: '/reports', label: t('nav.reports'), icon: BarChart2 },
  ];

  const healthcareLinks = [
    { to: '/healthcare/dashboard', label: 'Doctor / Pharmacist Portal', icon: LayoutDashboard },
    { to: '/patient/prescriptions/upload', label: 'Prescription Verification', icon: FileText },
    { to: '/reports', label: t('nav.reports'), icon: BarChart2 },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'System Overview', icon: LayoutDashboard },
    { to: '/admin/users', label: t('nav.users'), icon: Users },
    { to: '/admin/settings', label: t('nav.system_settings'), icon: Settings },
    { to: '/admin/audit', label: t('nav.audit_logs'), icon: ShieldAlert },
    { to: '/reports', label: t('nav.reports'), icon: BarChart2 },
  ];

  let currentLinks = patientLinks;
  if (role === 'caregiver') currentLinks = caregiverLinks;
  else if (role === 'healthcare_professional') currentLinks = healthcareLinks;
  else if (role === 'admin') currentLinks = adminLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between lg:hidden">
          <span className="font-bold text-gray-800">Menu</span>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
            {role === 'patient'
              ? language === 'ta'
                ? 'நோயாளி வழிகாட்டல்'
                : 'Patient Services'
              : role.toUpperCase().replace('_', ' ')}
          </div>

          {currentLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="text-xs text-gray-500 text-center">
            <span className="font-semibold">MEDISAKHI AI v1.0</span>
            <br />
            Accessible Health Companion
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
