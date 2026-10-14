import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Pill, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { medicinesAPI } from '../../lib/api';
import { t } from '../../lib/i18n';
import type { Medicine } from '../../types';

export default function MedicineIdentification() {
  const { language } = useLanguage();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [query, setQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
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

  const filtered = medicines.filter(m => {
    const matchesQuery = !query || m.name.toLowerCase().includes(query.toLowerCase()) || m.brand_name?.toLowerCase().includes(query.toLowerCase());
    const matchesColor = !selectedColor || m.color?.toLowerCase() === selectedColor.toLowerCase();
    return matchesQuery && matchesColor;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/patient/dashboard" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {language === 'ta' ? 'மருந்து அடையாளம் காணுதல்' : 'Medicine Identification Assistance'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'ta'
              ? 'உங்கள் மாத்திரையின் நிறம் அல்லது பெயர் கொண்டு சரியான மருந்தை ஒப்பிட்டுப் பார்க்கவும்.'
              : 'Match your physical tablet by name, strength, color, shape, and packaging.'}
          </p>
        </div>

        {/* Safety Warning */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 text-sm text-amber-900 flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-extrabold text-base mb-1">
              {language === 'ta' ? 'பாதுகாப்பு வழிகாட்டல்' : 'Important Clinical Advisory'}
            </p>
            <p className="leading-relaxed">
              {language === 'ta'
                ? 'தோற்றத்தை மட்டுமே நம்பி மாத்திரையை எடுக்க வேண்டாம். சந்தேகம் இருந்தால், மாத்திரையை உட்கொள்வதற்கு முன் உங்கள் மருந்தாளர் அல்லது மருத்துவரை அணுகவும்.'
                : 'We could not safely verify this medicine from appearance alone. Do not rely on color or shape alone. If identity is uncertain, contact your pharmacist or healthcare professional.'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={language === 'ta' ? 'மருந்தின் பெயர் தேடுங்கள்...' : 'Search medicine name...'}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 outline-none text-base"
            />
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs font-bold text-gray-500">{language === 'ta' ? 'நிறம்:' : 'Color:'}</span>
            {['', 'white', 'yellow', 'pink', 'blue'].map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                  selectedColor === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {c || (language === 'ta' ? 'அனைத்தும்' : 'All')}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(med => (
            <div key={med.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{med.name}</h3>
                  <p className="text-sm font-semibold text-blue-600">{med.strength}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                  {med.verification_status}
                </span>
              </div>

              {/* Visual preview */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                <div className={`w-12 h-12 rounded-full border-2 border-gray-400 bg-${med.color || 'white'} shadow flex items-center justify-center font-bold text-xs`} />
                <div className="text-xs space-y-1">
                  <p><span className="text-gray-400">{language === 'ta' ? 'நிறம்:' : 'Color:'}</span> <b>{med.color || 'white'}</b></p>
                  <p><span className="text-gray-400">{language === 'ta' ? 'வடிவம்:' : 'Shape:'}</span> <b>{med.shape || 'round'}</b></p>
                  <p><span className="text-gray-400">{language === 'ta' ? 'அளவு:' : 'Size:'}</span> <b>{med.size_description || 'medium'}</b></p>
                </div>
              </div>

              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-xl">
                🍽️ {med.food_instructions || 'Take after meals'}
              </div>

              <Link
                to={`/patient/medicines/${med.id}`}
                className="block text-center w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm"
              >
                {language === 'ta' ? 'முழு விவரங்கள் ➔' : 'View Verified Details ➔'}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
