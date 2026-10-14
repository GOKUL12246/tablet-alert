import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminAPI } from '../../lib/api';
import { t } from '../../lib/i18n';

export default function AuditLogs() {
  const { language } = useLanguage();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminAPI.auditLogs();
        setLogs(res.data || []);
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
        <div className="flex items-center gap-2">
          <Link to="/admin/dashboard" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {language === 'ta' ? 'பாதுகாப்பு மற்றும் தணிக்கை பதிவுகள்' : 'Compliance & Security Audit Logs'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'ta' ? 'அனைத்து மருந்து மாற்றங்கள் மற்றும் அணுகல் நிகழ்வுகளின் மாறாத பதிவு' : 'Immutable audit trail of access requests, medicine schedule modifications, and consent approvals'}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-black text-gray-500 uppercase">
                <th className="p-4">{language === 'ta' ? 'நேரம்' : 'Timestamp'}</th>
                <th className="p-4">{language === 'ta' ? 'செயல்' : 'Action'}</th>
                <th className="p-4">{language === 'ta' ? 'வளம்' : 'Resource'}</th>
                <th className="p-4">{language === 'ta' ? 'விவரம்' : 'User / Details'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    No security audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50">
                    <td className="p-4 text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-4 font-bold text-gray-800">{log.action}</td>
                    <td className="p-4 font-semibold text-blue-600 uppercase text-xs">{log.resource_type}</td>
                    <td className="p-4 text-xs text-gray-600">{log.user_id || 'System'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
