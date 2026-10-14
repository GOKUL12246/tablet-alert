import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pill, Plus, ArrowLeft, Search, Filter, AlertTriangle, ShieldCheck, Clock, FileUp, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { medicinesAPI } from '../../lib/api';
import { t } from '../../lib/i18n';
import type { Medicine } from '../../types';
import toast from 'react-hot-toast';

const COLOR_MAP: Record<string, { bg: string; border: string }> = {
  white: { bg: 'bg-white', border: 'border-gray-400' },
  yellow: { bg: 'bg-yellow-300', border: 'border-yellow-500' },
  pink: { bg: 'bg-pink-300', border: 'border-pink-500' },
  blue: { bg: 'bg-blue-300', border: 'border-blue-500' },
  orange: { bg: 'bg-orange-300', border: 'border-orange-500' },
  red: { bg: 'bg-red-400', border: 'border-red-600' },
  green: { bg: 'bg-green-300', border: 'border-green-500' },
  brown: { bg: 'bg-amber-700', border: 'border-amber-900' },
};

export default function Medicines() {
  const { logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'discontinued'>('active');

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await medicinesAPI.list();
      setMedicines(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error(t('common.error', language));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const filteredMedicines = medicines.filter((med) => {
    // Filter tab
    if (filterTab === 'active' && (!med.is_active || med.verification_status === 'discontinued')) {
      return false;
    }
    if (filterTab === 'discontinued' && med.is_active && med.verification_status !== 'discontinued') {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = med.name?.toLowerCase().includes(q);
      const matchBrand = med.brand_name?.toLowerCase().includes(q);
      const matchIngr = med.active_ingredient?.toLowerCase().includes(q);
      return matchName || matchBrand || matchIngr;
    }

    return true;
  });

  const getPillSwatch = (color?: string) => {
    const key = (color || 'white').toLowerCase();
    const style = COLOR_MAP[key] || { bg: 'bg-gray-200', border: 'border-gray-400' };
    return (
      <span
        className={`w-7 h-7 rounded-full border-2 shadow-xs inline-block flex-shrink-0 ${style.bg} ${style.border}`}
        aria-label={`${color || 'default'} color pill`}
        title={`Pill Color: ${color || 'Standard'}`}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/patient/dashboard"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label={t('common.back', language)}
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {t('medicine.title', language)}
              </h1>
              <p className="text-xs text-gray-500">
                {language === 'ta' ? 'உங்கள் பதிவு செய்த மருந்துகள்' : 'Your registered prescriptions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1" role="group" aria-label="Language selection">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  language === 'en' ? 'bg-blue-600 text-white' : 'text-gray-600'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ta')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  language === 'ta' ? 'bg-blue-600 text-white' : 'text-gray-600'
                }`}
              >
                தமிழ்
              </button>
            </div>

            <Link
              to="/patient/medicines/add"
              data-testid="add-medicine-btn"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all focus:ring-4 focus:ring-blue-300"
            >
              <Plus className="w-4 h-4" />
              <span>{t('medicine.add', language)}</span>
            </Link>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-all shadow-xs active:scale-95 cursor-pointer ml-1"
              aria-label={language === 'ta' ? 'வெளியேறு (Sign Out)' : 'Sign Out'}
              title={language === 'ta' ? 'கணக்கிலிருந்து வெளியேறு' : 'Sign Out of Account'}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'ta' ? 'வெளியேறு' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-5xl w-full mx-auto px-4 py-6 flex-1">
        {/* Actions Row: Search, Prescription Upload Link */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'மருந்தின் பெயர் அல்லது மூலப்பொருளைத் தேடுங்கள்...'
                  : 'Search by medicine name or active ingredient...'
              }
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-2xs"
            />
          </div>

          <Link
            to="/patient/prescriptions/upload"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-sm transition-colors"
          >
            <FileUp className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ta' ? 'மருந்து சீட்டு பதிவேற்றம்' : 'Upload Prescription'}</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-6" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={filterTab === 'active'}
            onClick={() => setFilterTab('active')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              filterTab === 'active'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {language === 'ta' ? 'செயலில் உள்ளவை' : 'Active Medicines'} (
            {medicines.filter((m) => m.is_active && m.verification_status !== 'discontinued').length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterTab === 'discontinued'}
            onClick={() => setFilterTab('discontinued')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              filterTab === 'discontinued'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {language === 'ta' ? 'நிறுத்தப்பட்டவை' : 'Discontinued'} (
            {medicines.filter((m) => !m.is_active || m.verification_status === 'discontinued').length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterTab === 'all'}
            onClick={() => setFilterTab('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              filterTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {language === 'ta' ? 'அனைத்தும்' : 'All'} ({medicines.length})
          </button>
        </div>

        {/* List Section */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              {language === 'ta' ? 'மருந்துகள் ஏற்றப்படுகின்றன...' : 'Loading your medicines...'}
            </p>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-gray-200 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Pill className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {language === 'ta' ? 'மருந்துகள் எதுவும் கிடைக்கவில்லை' : 'No medicines found'}
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              {searchQuery
                ? language === 'ta'
                  ? 'உங்கள் தேடலுக்குரிய மருந்து எதுவும் இல்லை. வேறு வார்த்தையை முயற்சிக்கவும்.'
                  : 'No medicines match your search criteria. Try a different term.'
                : t('medicine.empty', language)}
            </p>
            <Link
              to="/patient/medicines/add"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-all focus:ring-4 focus:ring-blue-300"
            >
              <Plus className="w-5 h-5" />
              <span>{t('medicine.add_new', language)}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMedicines.map((medicine) => {
              const isVerified = medicine.verification_status === 'verified';
              const isDiscontinued = !medicine.is_active || medicine.verification_status === 'discontinued';

              return (
                <div
                  key={medicine.id}
                  onClick={() => navigate(`/patient/medicines/${medicine.id}`)}
                  className={`bg-white rounded-2xl p-5 border-2 shadow-xs hover:shadow-md cursor-pointer transition-all ${
                    isDiscontinued
                      ? 'border-gray-200 opacity-75 bg-gray-50/50'
                      : isVerified
                      ? 'border-gray-200 hover:border-blue-300'
                      : 'border-amber-200 bg-amber-50/20 hover:border-amber-400'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/patient/medicines/${medicine.id}`);
                    }
                  }}
                  aria-label={`${medicine.name} ${medicine.strength}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Visual color circle & shape */}
                    <div className="flex flex-col items-center">
                      {getPillSwatch(medicine.color)}
                      <span className="text-[11px] font-semibold text-gray-600 mt-1 capitalize">
                        {medicine.color || 'white'}
                      </span>
                      {medicine.shape && (
                        <span className="text-[10px] text-gray-400 capitalize">
                          {medicine.shape}
                        </span>
                      )}
                    </div>

                    {/* Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 truncate">
                          {medicine.name}
                        </h2>
                        {/* Verification badge */}
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 flex-shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{t('medicine.verified', language)}</span>
                          </span>
                        ) : isDiscontinued ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-700 flex-shrink-0">
                            {language === 'ta' ? 'நிறுத்தப்பட்டது' : 'Discontinued'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex-shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t('medicine.awaiting', language)}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-blue-700">
                        {medicine.strength} • {medicine.dosage_form}
                      </p>

                      {medicine.brand_name && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {language === 'ta' ? 'வணிகப் பெயர்:' : 'Brand:'} {medicine.brand_name}
                        </p>
                      )}

                      {/* Reminder times chips */}
                      {medicine.reminder_times && medicine.reminder_times.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {medicine.reminder_times.map((time, idx) => (
                            <span
                              key={idx}
                              className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-100"
                            >
                              ⏰ {time}
                            </span>
                          ))}
                        </div>
                      )}

                      {medicine.food_instructions && (
                        <p className="text-xs font-medium text-emerald-800 bg-emerald-50 rounded-lg px-2 py-1 mt-2 inline-block border border-emerald-100">
                          🍽️ {medicine.food_instructions}
                        </p>
                      )}

                      {/* Stock / Available Tablets Badge */}
                      {medicine.remaining_tablets !== undefined && (
                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                          {medicine.remaining_tablets <= (medicine.low_stock_threshold || 10) ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-xl">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                              <span>
                                {language === 'ta'
                                  ? `குறைந்த இருப்பு: ${medicine.remaining_tablets} மட்டுமே! (பாதுகாவலர் எச்சரிக்கப்பட்டுள்ளார்)`
                                  : `Low Stock: Only ${medicine.remaining_tablets} left! (Caretaker alerted)`}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                              <span>📦</span>
                              <span>
                                {language === 'ta'
                                  ? `இருப்பு: ${medicine.remaining_tablets} / ${medicine.total_tablets || 30} மாத்திரைகள்`
                                  : `Stock: ${medicine.remaining_tablets} of ${medicine.total_tablets || 30} tablets`}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
