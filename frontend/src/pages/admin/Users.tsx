import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminAPI } from '../../lib/api';
import { t } from '../../lib/i18n';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const { language } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.users();
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminAPI.updateRole(userId, newRole);
      toast.success(language === 'ta' ? 'பயனர் பாத்திரம் மாற்றப்பட்டது' : 'User role updated');
      fetchUsers();
    } catch {
      toast.error(t('common.error', language));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/admin/dashboard" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {language === 'ta' ? 'பயனர் கணக்கு மேலாண்மை' : 'User Account & Role Management'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'ta' ? 'பாத்திர அடிப்படையிலான அணுகல் கட்டுப்பாடு (RBAC)' : 'View users, verify accounts, and configure permissions'}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-black text-gray-500 uppercase">
                <th className="p-4">{language === 'ta' ? 'பெயர் / மின்னஞ்சல்' : 'User'}</th>
                <th className="p-4">{language === 'ta' ? 'தொலைபேசி' : 'Phone'}</th>
                <th className="p-4">{language === 'ta' ? 'பாத்திரம்' : 'Role'}</th>
                <th className="p-4">{language === 'ta' ? 'நிலை' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{u.full_name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="p-4 text-gray-600">{u.phone_number || '—'}</td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-xl font-bold text-xs capitalize bg-white"
                    >
                      <option value="patient">Patient</option>
                      <option value="caregiver">Caregiver</option>
                      <option value="healthcare_professional">Doctor/HCP</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
