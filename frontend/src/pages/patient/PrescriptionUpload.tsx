import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { prescriptionsAPI } from '../../lib/api';
import { t } from '../../lib/i18n';
import toast from 'react-hot-toast';

export default function PrescriptionUpload() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error(language === 'ta' ? 'கோப்பைத் தேர்ந்தெடுக்கவும்' : 'Please select a file');
      return;
    }

    setUploading(true);
    try {
      const res = await prescriptionsAPI.upload(file);
      const prescriptionId = res.data.id;
      setExtractedData(res.data.extracted_data || {});
      toast.success(language === 'ta' ? 'மருந்துச்சீட்டு பகுப்பாய்வு செய்யப்பட்டது!' : 'Prescription uploaded and analyzed!');
      // Navigate to verification page
      navigate(`/patient/prescriptions/${prescriptionId}/verify`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || t('common.error', language));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/patient/medicines" className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ArrowLeft className="h-5 w-5" />
            {t('common.back', language)}
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              AI OCR Scanner
            </span>
            <h1 className="text-2xl font-black text-gray-900">
              {language === 'ta' ? 'மருந்துச்சீட்டு பதிவேற்று' : 'Upload Prescription'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {language === 'ta'
                ? 'உங்கள் மருந்துச்சீட்டு அல்லது மருந்து அட்டையின் படத்தை பதிவேற்றுங்கள். AI உரையை தானாகப் பிரித்தெடுக்கும்.'
                : 'Upload photo of prescription or medicine strip. AI will extract medication details for your review.'}
            </p>
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-3xl p-8 text-center cursor-pointer relative bg-gray-50 transition-colors">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {previewUrl ? (
              <div className="space-y-3">
                <img src={previewUrl} alt="Preview" className="max-h-56 mx-auto rounded-2xl object-contain shadow" />
                <p className="text-sm font-semibold text-gray-600">{file?.name}</p>
                <p className="text-xs text-blue-600 font-bold">{language === 'ta' ? 'மாற்ற தட்டவும்' : 'Click to change image'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8" />
                </div>
                <p className="font-bold text-gray-700">
                  {language === 'ta' ? 'படத்தைத் தேர்ந்தெடுக்க இங்கே தொடவும்' : 'Tap here to upload image'}
                </p>
                <p className="text-xs text-gray-400">JPG, PNG, PDF (Max 10MB)</p>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-xs text-yellow-800 space-y-1">
            <p className="font-bold">⚠️ {language === 'ta' ? 'முக்கிய பாதுகாப்பு குறிப்பு:' : 'Important Safety Notice:'}</p>
            <p>
              {language === 'ta'
                ? 'AI பிரித்தெடுக்கும் விவரங்கள் தானாகவே சரிபார்க்கப்பட்டதாக கருதப்படாது. நீங்கள் உறுதிப்படுத்திய பின்னரே அட்டவணை உருவாக்கப்படும்.'
                : 'OCR extraction is strictly advisory. Extracted instructions must be reviewed and confirmed before scheduling.'}
            </p>
          </div>

          <button
            type="button"
            disabled={!file || uploading}
            onClick={handleUpload}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-lg rounded-2xl shadow-lg transition-transform hover:scale-[1.01]"
          >
            {uploading
              ? (language === 'ta' ? 'பகுப்பாய்வு செய்கிறது...' : 'Analyzing Prescription...')
              : (language === 'ta' ? 'பகுப்பாய்வு செய்து சரிபார்க்கவும் ➔' : 'Analyze & Verify Details ➔')}
          </button>
        </div>
      </div>
    </div>
  );
}
