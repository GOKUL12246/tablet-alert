import React, { useEffect, useState } from 'react';
import { ArrowLeft, History, CheckCircle, AlertTriangle, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { remindersAPI } from '../../lib/api';
import { t } from '../../lib/i18n';
import type { ReminderEvent } from '../../types';

export default function MedicineHistory() {
  const { language } = useLanguage();
  const [history, setHistory] = useState<ReminderEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'taken' | 'missed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await remindersAPI.upcoming();
        // Include historical list
        setHistory(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = history.filter(h => {
    if (filter === 'taken') return h.status === 'patient_reported_taken';
    if (filter === 'missed') return h.status === 'confirmation_not_received';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/patient/dashboard" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {language === 'ta' ? 'மருந்து வரலாறு' : 'Medicine Adherence History'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'ta' ? 'கடந்த நினைவூட்டல்களின் உறுதிப்படுத்தல் பதிவுகள்' : 'Historical records of scheduled and confirmed medications'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { val: 'all', labelEn: 'All Records', labelTa: 'அனைத்தும்' },
            { val: 'taken', labelEn: 'Confirmed Taken', labelTa: 'உறுதி செய்யப்பட்டது' },
            { val: 'missed', labelEn: 'Unacknowledged', labelTa: 'உறுதி செய்யப்படாதவை' },
          ].map(f => (
            <button
              key={f.val}
              type="button"
              onClick={() => setFilter(f.val as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-colors ${
                filter === f.val ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              {language === 'ta' ? f.labelTa : f.labelEn}
            </button>
          ))}
        </div>

        {/* History List */}
        <div className="space-y-3">
          {filtered.map(item => {
            const isTaken = item.status === 'patient_reported_taken';
            const isMissed = item.status === 'confirmation_not_received';
            const dt = new Date(item.scheduled_datetime).toLocaleString();

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-gray-900 text-base">{item.medicine_name || 'Prescribed Medicine'}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{dt}</p>
                </div>
                <div>
                  {isTaken ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {language === 'ta' ? 'எடுத்ததாக பதிவானது' : 'Patient Reported Taken'}
                    </span>
                  ) : isMissed ? (
                    <span
                      data-testid="reminder-status-confirmation_not_received"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Confirmation Not Received
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase">
                      {item.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
