import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { prescriptionsAPI } from '../../lib/api';
import { t } from '../../lib/i18n';
import toast from 'react-hot-toast';

export default function PrescriptionVerify() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [prescription, setPrescription] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  // Editable fields based on OCR
  const [form, setForm] = useState({
    medicine_name: '',
    strength: '',
    instructions: '',
    schedule: '',
    verified_by_user: true,
  });

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const res = await prescriptionsAPI.extract(id);
        setPrescription(res.data);
        const extracted = res.data.extracted_data || {};
        setForm({
          medicine_name: extracted.medicine_name || extracted.name || 'Metformin',
          strength: extracted.strength || '500 mg',
          instructions: extracted.instructions || 'Take 1 tablet twice daily after meals',
          schedule: extracted.schedule || 'Morning (8:00 AM), Night (8:00 PM)',
          verified_by_user: true,
        });
      } catch (err) {
        console.error(err);
        toast.error(t('common.error', language));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleConfirm = async () => {
    if (!id) return;
    setVerifying(true);
    try {
      await prescriptionsAPI.verify(id, {
        status: 'verified',
        notes: `User verified: ${form.medicine_name} ${form.strength}. Instructions: ${form.instructions}`,
      });
      toast.success(language === 'ta' ? 'விவரங்கள் உறுதி செய்யப்பட்டன!' : 'Prescription verified successfully!');
      navigate('/patient/medicines');
    } catch {
      toast.error(t('common.error', language));
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/patient/medicines" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 text-green-700 rounded-2xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                {language === 'ta' ? 'பிரித்தெடுக்கப்பட்ட விவரங்களை சரிபார்க்கவும்' : 'Verify Extracted Details'}
              </h1>
              <p className="text-xs text-gray-500">
                {language === 'ta' ? 'கீழே உள்ள தகவல்கள் சரியானவைதானா என உறுதிப்படுத்தவும்' : 'Review and correct OCR information'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                {language === 'ta' ? 'மருந்தின் பெயர்' : 'Medicine Name'}
              </label>
              <input
                type="text"
                value={form.medicine_name}
                onChange={e => setForm({ ...form, medicine_name: e.target.value })}
                className="w-full text-lg font-bold px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                {language === 'ta' ? 'வலிமை' : 'Strength'}
              </label>
              <input
                type="text"
                value={form.strength}
                onChange={e => setForm({ ...form, strength: e.target.value })}
                className="w-full text-base font-bold px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                {language === 'ta' ? 'வழிமுறைகள்' : 'Prescribed Instructions'}
              </label>
              <textarea
                rows={2}
                value={form.instructions}
                onChange={e => setForm({ ...form, instructions: e.target.value })}
                className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                {language === 'ta' ? 'நேரம் / அட்டவணை' : 'Schedule'}
              </label>
              <input
                type="text"
                value={form.schedule}
                onChange={e => setForm({ ...form, schedule: e.target.value })}
                className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-amber-600" />
            <p>
              {language === 'ta'
                ? 'இந்த வழிமுறைகளுக்கு சரிபார்ப்பு தேவை. சந்தேகம் இருப்பின் உங்கள் மருந்தாளர் அல்லது சுகாதார நிபுணரை தொடர்பு கொள்ளுங்கள்.'
                : 'These instructions need verification. Please contact your pharmacist or healthcare professional.'}
            </p>
          </div>

          <button
            type="button"
            disabled={verifying}
            onClick={handleConfirm}
            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-extrabold text-lg rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-5 w-5" />
            {verifying ? t('common.loading', language) : (language === 'ta' ? 'உறுதி செய்து சேமிக்கவும்' : 'Confirm & Save Verification')}
          </button>
        </div>
      </div>
    </div>
  );
}
