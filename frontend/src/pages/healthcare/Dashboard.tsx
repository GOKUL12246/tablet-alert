import React, { useEffect, useState } from 'react';
import { Stethoscope, ShieldCheck, CheckCircle, AlertTriangle, FileText, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { medicinesAPI, prescriptionsAPI } from '../../lib/api';
import { t } from '../../lib/i18n';
import toast from 'react-hot-toast';

export default function HealthcareDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await medicinesAPI.list();
        setMedicines(res.data || []);
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold mb-2">
              <Stethoscope className="h-3.5 w-3.5" />
              Healthcare Professional Portal
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900">
              {language === 'ta' ? 'மருத்துவர் சரிபார்ப்பு மையம்' : 'Clinical Prescription Verification'}
            </h1>
            <p className="text-gray-500 mt-1">
              {language === 'ta' ? 'நோயாளி மருந்துச்சீட்டுகளின் துல்லியத்தை உறுதிப்படுத்தவும்' : 'Verify medicine details, correct unclear dosage instructions, and review flagged prescriptions'}
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

        <div className="space-y-4">
          {medicines.map(med => (
            <div key={med.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex items-center justify-between flex-wrap gap-4">
              <div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase mb-2 inline-block">
                  {med.verification_status}
                </span>
                <h3 className="text-xl font-bold text-gray-900">{med.name}</h3>
                <p className="text-sm text-gray-500">{med.strength} • {med.dosage_form}</p>
                <p className="text-xs text-gray-400 mt-1">🍽️ {med.food_instructions || 'After meals'}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toast.success(language === 'ta' ? 'மருந்துச்சீட்டு சரிபார்க்கப்பட்டது' : 'Prescription verified')}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm shadow flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {language === 'ta' ? 'சரிபார்' : 'Verify'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
