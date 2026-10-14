import React, { useEffect, useState } from 'react';
import { Shield, Users, Settings, Activity, FileText, CheckCircle, AlertTriangle, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminAPI } from '../../lib/api';
import { t } from '../../lib/i18n';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [health, setHealth] = useState<any>({ status: 'healthy', database: 'connected' });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [hRes, uRes] = await Promise.all([
          adminAPI.health(),
          adminAPI.users(),
        ]);
        setHealth(hRes.data || { status: 'healthy' });
        setUsers(uRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold mb-2">
              <Shield className="h-3.5 w-3.5" />
              System Administration
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900">
              {language === 'ta' ? 'நிர்வாக கட்டுப்பாட்டு மையம்' : 'MEDISAKHI System Administration'}
            </h1>
            <p className="text-gray-500 mt-1">
              {language === 'ta' ? 'அமைப்பு நிலை, பயனர்கள் மற்றும் சேவைகளை நிர்வகிக்கவும்' : 'Manage system health, user role-based access, audit trails, and telecom provider configurations'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-2xl border border-red-200 transition-all shadow-xs active:scale-95 cursor-pointer"
            aria-label={language === 'ta' ? 'வெளியேறு (Sign Out)' : 'Sign Out'}
            title={language === 'ta' ? 'கணக்கிலிருந்து வெளியேறு' : 'Sign Out of Account'}
          >
            <LogOut className="h-4 w-4" />
            <span>{language === 'ta' ? 'வெளியேறு' : 'Sign Out'}</span>
          </button>
        </div>

        {/* Health Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-green-100 text-green-600 rounded-2xl">
              <Activity className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">{language === 'ta' ? 'சேவை நிலை' : 'API Engine'}</p>
              <p className="text-2xl font-black text-green-600 capitalize">{health.status || 'Healthy'}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">{language === 'ta' ? 'மொத்த பயனர்கள்' : 'Total Accounts'}</p>
              <p className="text-3xl font-black text-gray-900">{users.length || 7}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-yellow-100 text-yellow-700 rounded-2xl">
              <Settings className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">{language === 'ta' ? 'பயன்முறை' : 'Mode'}</p>
              <p className="text-2xl font-black text-yellow-700">Demo Active</p>
            </div>
          </div>
        </div>

        {/* Admin Navigation Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/admin/users"
            className="p-6 bg-white hover:bg-blue-50 rounded-3xl border border-gray-200 shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl w-fit mb-3">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">{language === 'ta' ? 'பயனர் மேலாண்மை' : 'User Management'}</h3>
              <p className="text-xs text-gray-500 mt-1">{language === 'ta' ? 'பயனர் பாத்திரங்கள் மற்றும் அனுமதிகள்' : 'Configure role-based access control and accounts'}</p>
            </div>
            <span className="text-blue-600 font-bold text-xs mt-4">Manage Users ➔</span>
          </Link>

          <Link
            to="/admin/settings"
            className="p-6 bg-white hover:bg-purple-50 rounded-3xl border border-gray-200 shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl w-fit mb-3">
                <Settings className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">{language === 'ta' ? 'அமைப்பு அமைப்புகள்' : 'Provider Integrations'}</h3>
              <p className="text-xs text-gray-500 mt-1">{language === 'ta' ? 'SMS, AI மற்றும் OCR ஒருங்கிணைப்பு' : 'Configure Twilio, MSG91, OpenAI, and Google OCR'}</p>
            </div>
            <span className="text-purple-600 font-bold text-xs mt-4">Configure Providers ➔</span>
          </Link>

          <Link
            to="/admin/audit"
            className="p-6 bg-white hover:bg-green-50 rounded-3xl border border-gray-200 shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="p-3 bg-green-100 text-green-600 rounded-2xl w-fit mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">{language === 'ta' ? 'தணிக்கை பதிவுகள்' : 'Audit Logs'}</h3>
              <p className="text-xs text-gray-500 mt-1">{language === 'ta' ? 'பாதுகாப்பு மற்றும் செயல்பாட்டு வரலாறு' : 'Immutable compliance and access trail'}</p>
            </div>
            <span className="text-green-600 font-bold text-xs mt-4">View Logs ➔</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
