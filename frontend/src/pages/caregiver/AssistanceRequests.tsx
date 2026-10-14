import React, { useEffect, useState } from 'react';
import { ArrowLeft, HelpCircle, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { caregiversAPI } from '../../lib/api';
import { t } from '../../lib/i18n';

export default function AssistanceRequests() {
  const { language } = useLanguage();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await caregiversAPI.alerts();
        const helpRequests = (res.data || []).filter((a: any) => a.alert_type === 'assistance_request');
        setRequests(helpRequests);
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
            {language === 'ta' ? '🆘 உதவி கோரிக்கைகள்' : '🆘 Emergency Assistance Requests'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'ta' ? 'நோயாளி "எனக்கு உதவி வேண்டும்" பொத்தானை அழுத்திய கோரிக்கைகள்' : 'Direct help requests sent by patients via app button or keypad phone SMS'}
          </p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" /></div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-gray-500 border border-gray-200">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-lg">{language === 'ta' ? 'உதவி கோரிக்கைகள் எதுவும் நிலுவையில் இல்லை' : 'No open assistance requests'}</p>
            </div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="bg-white rounded-3xl p-6 shadow-sm border border-red-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-xl text-gray-900">{req.patient_name || 'Patient'}</h3>
                    <p className="text-xs text-gray-400">{new Date(req.created_at).toLocaleString()}</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-black uppercase rounded-full">
                    HELP NEEDED
                  </span>
                </div>
                <p className="text-base font-semibold text-gray-800 bg-red-50 p-4 rounded-2xl">
                  {language === 'ta' ? req.message_ta : req.message_en}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
