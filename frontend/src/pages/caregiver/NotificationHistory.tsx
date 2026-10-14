import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { notificationsAPI } from '../../lib/api';
import { t } from '../../lib/i18n';

export default function NotificationHistory() {
  const { language } = useLanguage();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await notificationsAPI.history();
        setHistory(res.data || []);
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/caregiver/dashboard" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {language === 'ta' ? 'அறிவிப்பு வரலாறு' : 'Notification Dispatch History'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'ta' ? 'SMS, அழைப்புகள் மற்றும் செயலி அறிவிப்புகளின் டெலிவரி நிலை' : 'Audit logs for SMS, voice, and browser reminder dispatch status'}
          </p>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" /></div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-gray-500 border border-gray-200">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="font-bold text-lg">{language === 'ta' ? 'அறிவிப்புகள் எதுவும் இல்லை' : 'No notifications dispatched yet'}</p>
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 uppercase text-sm block">{item.channel} • {item.provider_name || 'DEMO'}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(item.sent_at || item.created_at).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  item.status === 'delivered' ? 'bg-green-100 text-green-800' : item.status === 'sent' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                }`}>
                  {item.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
