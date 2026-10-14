import React from 'react';
import { Medicine } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { TTSButton } from '../accessibility/TTSButton';
import { VerificationStatus } from './VerificationStatus';
import {
  Sunrise,
  Sun,
  Sunset,
  Moon,
  UtensilsCrossed,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MedicineCardProps {
  medicine: Medicine;
  onEdit?: (medicine: Medicine) => void;
  onDiscontinue?: (id: string) => void;
  onClick?: () => void;
  detailed?: boolean;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  onEdit,
  onDiscontinue,
  onClick,
  detailed = false,
}) => {
  const { language, t } = useLanguage();

  const getPillColorCode = (colorName?: string): { hex: string; border: string; label: string } => {
    const c = (colorName || 'white').toLowerCase();
    if (c.includes('yellow') || c.includes('மஞ்சள்'))
      return { hex: '#fde047', border: '#eab308', label: language === 'ta' ? 'மஞ்சள் நிறம்' : 'Yellow' };
    if (c.includes('pink') || c.includes('இளஞ்சிவப்பு'))
      return { hex: '#f472b6', border: '#db2777', label: language === 'ta' ? 'இளஞ்சிவப்பு நிறம்' : 'Pink' };
    if (c.includes('red') || c.includes('சிகப்பு'))
      return { hex: '#ef4444', border: '#b91c1c', label: language === 'ta' ? 'சிகப்பு நிறம்' : 'Red' };
    if (c.includes('blue') || c.includes('நீலம்'))
      return { hex: '#60a5fa', border: '#2563eb', label: language === 'ta' ? 'நீல நிறம்' : 'Blue' };
    if (c.includes('green') || c.includes('பச்சை'))
      return { hex: '#4ade80', border: '#16a34a', label: language === 'ta' ? 'பச்சை நிறம்' : 'Green' };
    if (c.includes('orange') || c.includes('ஆரஞ்சு'))
      return { hex: '#fb923c', border: '#ea580c', label: language === 'ta' ? 'ஆரஞ்சு நிறம்' : 'Orange' };
    return { hex: '#f8fafc', border: '#cbd5e1', label: language === 'ta' ? 'வெள்ளை நிறம்' : 'White' };
  };

  const pillColor = getPillColorCode(medicine.color);

  // Time pictograms
  const renderTimePictograms = () => {
    const times = medicine.reminder_times || ['08:00', '20:00'];
    return (
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {times.map((time, idx) => {
          const hour = parseInt(time.split(':')[0], 10);
          let Icon = Sun;
          let label = language === 'ta' ? 'பகல்' : 'Day';
          let badgeBg = 'bg-amber-50 text-amber-900 border-amber-200';

          if (hour >= 5 && hour < 11) {
            Icon = Sunrise;
            label = language === 'ta' ? 'காலை 🌅' : 'Morning 🌅';
            badgeBg = 'bg-orange-50 text-orange-900 border-orange-200';
          } else if (hour >= 11 && hour < 16) {
            Icon = Sun;
            label = language === 'ta' ? 'மதியம் ☀️' : 'Afternoon ☀️';
            badgeBg = 'bg-yellow-50 text-yellow-900 border-yellow-200';
          } else if (hour >= 16 && hour < 20) {
            Icon = Sunset;
            label = language === 'ta' ? 'மாலை 🌆' : 'Evening 🌆';
            badgeBg = 'bg-indigo-50 text-indigo-900 border-indigo-200';
          } else {
            Icon = Moon;
            label = language === 'ta' ? 'இரவு 🌙' : 'Night 🌙';
            badgeBg = 'bg-blue-50 text-blue-900 border-blue-200';
          }

          return (
            <span
              key={idx}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold border shadow-2xs',
                badgeBg
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              <span className="opacity-75 font-normal">({time})</span>
            </span>
          );
        })}
      </div>
    );
  };

  const spokenText = `${medicine.name}. ${medicine.strength}. ${medicine.dosage_form}. ${
    medicine.food_instructions || ''
  }. ${medicine.special_instructions || ''}`;

  return (
    <Card
      variant="bordered"
      className={cn(
        'transition-all hover:shadow-md cursor-pointer border-2',
        medicine.verification_status === 'verified' ? 'border-gray-200' : 'border-amber-200 bg-amber-50/10'
      )}
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        {/* Left: Pill Visual Display (Non-Literate Aid) */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            {/* Visual Pill Circle */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-inner relative border-4"
              style={{
                backgroundColor: pillColor.hex,
                borderColor: pillColor.border,
              }}
              title={`Pill visual: ${pillColor.label}`}
            >
              <span className="text-2xl" role="img" aria-label="Tablet shape">
                💊
              </span>
              {medicine.dosage_form?.toLowerCase().includes('syrup') && (
                <span className="absolute bottom-1 right-1 text-xs bg-white/90 px-1 rounded-full font-bold">
                  🥄
                </span>
              )}
            </div>
            {/* Visual shape and color text badges */}
            <span className="mt-1.5 text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md text-center max-w-[85px] truncate">
              {pillColor.label}
            </span>
            <span className="text-[11px] text-gray-500 text-center">
              {medicine.shape || (language === 'ta' ? 'வட்ட மாத்திரை' : 'Round tablet')}
            </span>
          </div>

          {/* Details */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                {medicine.name}
              </h4>
              <Badge variant="primary" size="sm">
                {medicine.strength}
              </Badge>
              <Badge variant="default" size="sm">
                {medicine.dosage_form}
              </Badge>
            </div>

            {medicine.brand_name && (
              <p className="text-xs text-gray-500 font-medium">
                {language === 'ta' ? 'வணிகப் பெயர்:' : 'Brand:'} {medicine.brand_name}
              </p>
            )}

            {/* Food Instruction with Pictograms */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-800 pt-1">
              <UtensilsCrossed className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                {medicine.food_instructions ||
                  (language === 'ta' ? 'உணவுக்குப் பின் 🍽️✓' : 'After Food 🍽️✓')}
              </span>
            </div>

            {/* Schedule time pictograms */}
            {renderTimePictograms()}
          </div>
        </div>

        {/* Right side: Verification Status, TTS Button, Actions */}
        <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 self-stretch sm:self-auto w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
          <VerificationStatus status={medicine.verification_status} />
          <TTSButton text={spokenText} size="md" label={language === 'ta' ? 'கேளுங்கள்' : 'Hear'} />
        </div>
      </div>

      {/* Special Warnings if any */}
      {medicine.special_instructions && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs sm:text-sm text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">
              {language === 'ta' ? 'முக்கிய குறிப்பு: ' : 'Instruction: '}
            </strong>
            {medicine.special_instructions}
          </div>
        </div>
      )}

      {/* Action buttons if edit/discontinue provided */}
      {(onEdit || onDiscontinue) && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(medicine);
              }}
              className="text-xs font-bold text-primary-600 hover:text-primary-800 px-3 py-1.5 rounded-lg hover:bg-primary-50"
            >
              {t('common.edit')}
            </button>
          )}
          {onDiscontinue && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDiscontinue(medicine.id);
              }}
              className="text-xs font-bold text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              {t('medicine.discontinue')}
            </button>
          )}
        </div>
      )}
    </Card>
  );
};

export default MedicineCard;
