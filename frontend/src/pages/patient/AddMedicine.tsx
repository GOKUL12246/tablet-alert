import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Pill, Clock, Palette, ShieldAlert, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { medicinesAPI, schedulesAPI } from '../../lib/api';
import { t } from '../../lib/i18n';
import toast from 'react-hot-toast';

const COLORS = [
  { name: 'white', bg: 'bg-white', border: 'border-gray-400', labelEn: 'White', labelTa: 'வெள்ளை' },
  { name: 'yellow', bg: 'bg-yellow-300', border: 'border-yellow-500', labelEn: 'Yellow', labelTa: 'மஞ்சள்' },
  { name: 'pink', bg: 'bg-pink-300', border: 'border-pink-500', labelEn: 'Pink', labelTa: 'இளஞ்சிவப்பு' },
  { name: 'blue', bg: 'bg-blue-300', border: 'border-blue-500', labelEn: 'Blue', labelTa: 'நீலம்' },
  { name: 'orange', bg: 'bg-orange-300', border: 'border-orange-500', labelEn: 'Orange', labelTa: 'ஆரஞ்சு' },
  { name: 'red', bg: 'bg-red-400', border: 'border-red-600', labelEn: 'Red', labelTa: 'சிவப்பு' },
  { name: 'green', bg: 'bg-green-300', border: 'border-green-500', labelEn: 'Green', labelTa: 'பச்சை' },
];

const SHAPES = [
  { value: 'round', labelEn: 'Round', labelTa: 'வட்டம்' },
  { value: 'oval', labelEn: 'Oval', labelTa: 'நீள்வட்டம்' },
  { value: 'capsule', labelEn: 'Capsule', labelTa: 'கேப்சூல்' },
  { value: 'oblong', labelEn: 'Oblong', labelTa: 'செவ்வகம்' },
];

export default function AddMedicine() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    brand_name: '',
    active_ingredient: '',
    strength: '',
    dosage_form: 'tablet',
    prescribed_quantity: '1 tablet',
    route: 'oral',
    // Schedule
    reminder_times: ['08:00', '20:00'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    timezone: 'Asia/Kolkata',
    // Visual
    color: 'white',
    shape: 'round',
    size_description: 'medium (9mm)',
    packaging_color: 'silver blister pack',
    strip_cover_color: 'silver',
    box_color: 'white and blue',
    icon_symbol: 'sun',
    pictogram_code: 'sun-morning',
    // Instructions
    special_instructions: '',
    food_instructions: 'after_food',
    warning_info: '',
    prescriber_name: '',
    pharmacy_name: '',
    // Stock / Inventory
    total_tablets: 30,
    remaining_tablets: 30,
    low_stock_threshold: 10,
  });

  const update = (field: string, val: any) => setFormData(prev => ({ ...prev, [field]: val }));

  const addTime = () => update('reminder_times', [...formData.reminder_times, '12:00']);
  const removeTime = (idx: number) => {
    if (formData.reminder_times.length > 1) {
      update('reminder_times', formData.reminder_times.filter((_, i) => i !== idx));
    }
  };

  const handleTimeChange = (idx: number, val: string) => {
    const copy = [...formData.reminder_times];
    copy[idx] = val;
    update('reminder_times', copy);
  };

  const setTimeToNextMinute = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 1);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    update('reminder_times', [`${hh}:${mm}`]);
    toast.success(language === 'ta' ? `அலாரம் நேரம் ${hh}:${mm} என அமைக்கப்பட்டது` : `Alarm set to ${hh}:${mm} (+1 min)`);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.strength.trim()) {
      toast.error(language === 'ta' ? 'மருந்தின் பெயர் மற்றும் வலிமை அவசியம்' : 'Name and strength are required');
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Medicine
      const medRes = await medicinesAPI.create({
        name: formData.name,
        brand_name: formData.brand_name || undefined,
        active_ingredient: formData.active_ingredient || undefined,
        strength: formData.strength,
        dosage_form: formData.dosage_form,
        prescribed_quantity: formData.prescribed_quantity,
        route: formData.route,
        tablet_color: formData.color,
        tablet_shape: formData.shape,
        tablet_size: formData.size_description,
        strip_cover_color: formData.strip_cover_color,
        box_color: formData.box_color,
        color: formData.color,
        shape: formData.shape,
        size_description: formData.size_description,
        packaging_color: formData.packaging_color,
        icon_symbol: formData.icon_symbol,
        pictogram_code: formData.pictogram_code,
        special_instructions: formData.special_instructions || undefined,
        food_instructions: formData.food_instructions,
        warning_info: formData.warning_info || undefined,
        prescriber_name: formData.prescriber_name || undefined,
        pharmacy_name: formData.pharmacy_name || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        total_tablets: Number(formData.total_tablets) || 30,
        remaining_tablets: Number(formData.remaining_tablets) || Number(formData.total_tablets) || 30,
        low_stock_threshold: Number(formData.low_stock_threshold) || 10,
      });

      const medicineId = medRes.data.id;

      // 2. Create Schedule
      await schedulesAPI.create({
        medicine_id: medicineId,
        reminder_times: formData.reminder_times,
        timezone: formData.timezone,
        is_active: true,
      });

      toast.success(language === 'ta' ? 'மருந்து வெற்றிகரமாக சேர்க்கப்பட்டது!' : 'Medicine added successfully!');
      navigate('/patient/medicines');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || t('common.error', language));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/patient/medicines" className="flex items-center gap-2 text-blue-600 font-semibold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
          <span className="text-sm font-semibold text-gray-500">
            {language === 'ta' ? `படி ${step} / 4` : `Step ${step} of 4`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2.5 rounded-full mb-8">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                  <Pill className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {language === 'ta' ? 'அடிப்படை விவரங்கள்' : 'Medicine Information'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {language === 'ta' ? 'மருந்தின் பெயர் மற்றும் வலிமை' : 'Name, strength, and active ingredient'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {language === 'ta' ? 'மருந்தின் பெயர் *' : 'Medicine Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => update('name', e.target.value)}
                  placeholder="e.g. Metformin, Paracetamol"
                  className="w-full text-lg px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {language === 'ta' ? 'வலிமை (Strength) *' : 'Strength *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.strength}
                    onChange={e => update('strength', e.target.value)}
                    placeholder="e.g. 500 mg, 650 mg"
                    className="w-full text-lg px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {language === 'ta' ? 'பிராண்ட் பெயர்' : 'Brand Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.brand_name}
                    onChange={e => update('brand_name', e.target.value)}
                    placeholder="e.g. Glycomet, Dolo"
                    className="w-full text-lg px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {language === 'ta' ? 'வடிவம் (Form)' : 'Dosage Form'}
                  </label>
                  <select
                    value={formData.dosage_form}
                    onChange={e => update('dosage_form', e.target.value)}
                    className="w-full text-lg px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
                  >
                    <option value="tablet">Tablet / மாத்திரை</option>
                    <option value="capsule">Capsule / காப்ஸ்யூல்</option>
                    <option value="syrup">Syrup / திரவம்</option>
                    <option value="drops">Drops / சொட்டு மருந்து</option>
                    <option value="injection">Injection / ஊசி</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {language === 'ta' ? 'அளவு (Quantity per dose)' : 'Dose Quantity'}
                  </label>
                  <input
                    type="text"
                    value={formData.prescribed_quantity}
                    onChange={e => update('prescribed_quantity', e.target.value)}
                    placeholder="1 tablet, 5 ml"
                    className="w-full text-lg px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Tablet Inventory / Stock Input */}
              <div className="bg-blue-50/70 border-2 border-blue-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="block text-sm font-black text-blue-950">
                    📦 {language === 'ta' ? 'மொத்த இருப்பு மாத்திரைகள் (Available Tablets in Strip)' : 'Total Available Tablets in Strip / Bottle'}
                  </label>
                  <span className="text-xs font-bold text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs">
                    {language === 'ta' ? 'அலாரம் ஏற்கும் போது 1 குறையும்' : 'Reduces by 1 each dose'}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.total_tablets}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      update('total_tablets', val);
                      update('remaining_tablets', val);
                    }}
                    className="w-28 text-xl font-black px-4 py-2.5 bg-white border-2 border-blue-400 rounded-xl focus:border-blue-600 outline-none shadow-inner"
                  />
                  <div className="flex flex-wrap gap-2">
                    {[10, 15, 30, 60].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          update('total_tablets', cnt);
                          update('remaining_tablets', cnt);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          formData.total_tablets === cnt
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-white text-blue-800 border border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        {cnt} {language === 'ta' ? 'மாத்திரைகள்' : 'Tablets'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-blue-900 font-medium">
                  ⚠️ {language === 'ta'
                    ? 'மாத்திரைகள் 10 அல்லது அதற்குக் குறைவாக வரும் போது, பராமரிப்பாளருக்கு தானாகவே தினசரி ஒருமுறை மின்னஞ்சல் மற்றும் குறுஞ்செய்தி அனுப்பப்படும்.'
                    : 'When available tablets reach 10 or fewer, an alert is sent to your registered caretaker once daily.'}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Schedule */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {language === 'ta' ? 'நினைவூட்டல் அட்டவணை' : 'Reminder Schedule'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {language === 'ta' ? 'எந்தெந்த நேரங்களில் எடுக்க வேண்டும்' : 'Daily reminder times'}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700">
                    {language === 'ta' ? 'நினைவூட்டல் நேரங்கள்' : 'Reminder Times'}
                  </label>
                  <button
                    type="button"
                    onClick={setTimeToNextMinute}
                    className="text-xs font-bold bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-xl transition"
                  >
                    ⏱️ {language === 'ta' ? 'அடுத்த நிமிடத்திற்கு அமை (+1 நிமிடம்)' : 'Set to Next Minute (+1 min to test alarm)'}
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.reminder_times.map((tVal, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="time"
                        value={tVal}
                        onChange={e => handleTimeChange(idx, e.target.value)}
                        className="text-xl font-bold px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-green-500 outline-none flex-1"
                      />
                      {formData.reminder_times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTime(idx)}
                          className="px-4 py-3 bg-red-100 text-red-600 rounded-2xl hover:bg-red-200 font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTime}
                    className="w-full py-3 border-2 border-dashed border-green-500 text-green-700 font-bold rounded-2xl hover:bg-green-50"
                  >
                    + {language === 'ta' ? 'மேலும் ஒரு நேரம் சேர்' : 'Add Another Reminder Time'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {language === 'ta' ? 'ஆரம்ப தேதி' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={e => update('start_date', e.target.value)}
                    className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {language === 'ta' ? 'முடிவு தேதி (விருப்பத்தேர்வு)' : 'End Date (Optional)'}
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={e => update('end_date', e.target.value)}
                    className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-green-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Visual Identifiers */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
                  <Palette className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {language === 'ta' ? 'காட்சி அடையாளங்கள்' : 'Visual Identification'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {language === 'ta' ? 'எழுத்தறிவு இல்லாத பயனர்களுக்கு அடையாளம் காண உதவும்' : 'Helps non-literate and elderly users identify tablets'}
                  </p>
                </div>
              </div>

              {/* Tablet Color Swatches */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {language === 'ta' ? 'மாத்திரையின் நிறம்' : 'Tablet Color'}
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                  {COLORS.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => update('color', c.name)}
                      className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-transform ${
                        formData.color === c.name ? 'border-purple-600 scale-105 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full border-2 ${c.bg} ${c.border} mb-1`} />
                      <span className="text-xs font-semibold text-gray-700">{language === 'ta' ? c.labelTa : c.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tablet Shape */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {language === 'ta' ? 'மாத்திரையின் வடிவம்' : 'Tablet Shape'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SHAPES.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => update('shape', s.value)}
                      className={`p-3 rounded-2xl border-2 font-semibold text-center transition-transform ${
                        formData.shape === s.value ? 'border-purple-600 bg-purple-50 text-purple-900 scale-105' : 'border-gray-200 hover:border-purple-300 text-gray-700'
                      }`}
                    >
                      {language === 'ta' ? s.labelTa : s.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {language === 'ta' ? 'மாத்திரை அளவு (Size)' : 'Tablet Size'}
                  </label>
                  <input
                    type="text"
                    value={formData.size_description}
                    onChange={e => update('size_description', e.target.value)}
                    placeholder="e.g. small (6mm), medium (10mm)"
                    className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {language === 'ta' ? 'ஸ்ட்ரிப் / அட்டை நிறம்' : 'Strip / Blister Pack Color'}
                  </label>
                  <input
                    type="text"
                    value={formData.strip_cover_color}
                    onChange={e => update('strip_cover_color', e.target.value)}
                    placeholder="e.g. silver foil, green blister"
                    className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Instructions & Prescriber */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {language === 'ta' ? 'வழிமுறைகள் & குறிப்புகள்' : 'Instructions & Warnings'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {language === 'ta' ? 'உணவு மற்றும் பாதுகாப்பு விதிமுறைகள்' : 'Food instructions and doctor recommendations'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {language === 'ta' ? 'உணவு தொடர்பான வழிமுறை' : 'Food Instruction'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 'before_food', labelEn: 'Before Food', labelTa: 'சாப்பிடும் முன்' },
                    { val: 'after_food', labelEn: 'After Food', labelTa: 'சாப்பிட்ட பின்' },
                    { val: 'with_food', labelEn: 'With Food', labelTa: 'உணவுடன்' },
                  ].map(f => (
                    <button
                      key={f.val}
                      type="button"
                      onClick={() => update('food_instructions', f.val)}
                      className={`p-3 rounded-2xl border-2 font-bold text-center transition-all ${
                        formData.food_instructions === f.val ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      🍽️ {language === 'ta' ? f.labelTa : f.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {language === 'ta' ? 'சிறப்பு வழிமுறைகள்' : 'Special Instructions'}
                </label>
                <textarea
                  rows={2}
                  value={formData.special_instructions}
                  onChange={e => update('special_instructions', e.target.value)}
                  placeholder="e.g. Take with a full glass of warm water. Do not crush."
                  className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {language === 'ta' ? 'மருத்துவர் பெயர்' : 'Prescribing Doctor'}
                  </label>
                  <input
                    type="text"
                    value={formData.prescriber_name}
                    onChange={e => update('prescriber_name', e.target.value)}
                    placeholder="e.g. Dr. Ramesh"
                    className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {language === 'ta' ? 'எச்சரிக்கை தகவல்' : 'Warning Information'}
                  </label>
                  <input
                    type="text"
                    value={formData.warning_info}
                    onChange={e => update('warning_info', e.target.value)}
                    placeholder="e.g. May cause drowsiness"
                    className="w-full text-base px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="px-6 py-3 border-2 border-gray-300 font-bold text-gray-700 rounded-2xl hover:bg-gray-100"
              >
                {t('common.back', language)}
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && (!formData.name.trim() || !formData.strength.trim())) {
                    toast.error(language === 'ta' ? 'மருந்தின் பெயர் மற்றும் வலிமை அவசியம்' : 'Name and strength are required');
                    return;
                  }
                  setStep(s => s + 1);
                }}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md"
              >
                {language === 'ta' ? 'அடுத்த படி ➔' : 'Next Step ➔'}
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg flex items-center gap-2"
              >
                <Check className="h-5 w-5" />
                {submitting ? t('common.loading', language) : (language === 'ta' ? 'மருந்து சேமிக்கவும்' : 'Save Medicine')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
