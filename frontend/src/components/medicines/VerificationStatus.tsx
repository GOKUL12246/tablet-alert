import React from 'react';
import { VerificationStatus as StatusType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckCircle, Clock, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface VerificationStatusProps {
  status: StatusType;
  showIcon?: boolean;
  className?: string;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  status,
  showIcon = true,
  className,
}) => {
  const { language } = useLanguage();

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          labelEn: 'Verified by Doctor',
          labelTa: 'சரிபார்க்கப்பட்டது ✓',
          icon: ShieldCheck,
          className: 'bg-green-50 text-green-800 border-green-300',
        };
      case 'awaiting_confirmation':
      case 'ocr_extracted':
      case 'uploaded':
        return {
          labelEn: 'Awaiting Verification',
          labelTa: 'சரிபார்ப்பு காத்திருக்கிறது ⏳',
          icon: Clock,
          className: 'bg-amber-50 text-amber-800 border-amber-300',
        };
      case 'verification_required':
        return {
          labelEn: 'Needs Pharmacist Review',
          labelTa: 'சரிபார்ப்பு தேவை ⚠️',
          icon: AlertTriangle,
          className: 'bg-red-50 text-red-800 border-red-300',
        };
      case 'discontinued':
        return {
          labelEn: 'Discontinued',
          labelTa: 'நிறுத்தப்பட்டது',
          icon: XCircle,
          className: 'bg-gray-100 text-gray-700 border-gray-300',
        };
      default:
        return {
          labelEn: status,
          labelTa: status,
          icon: Clock,
          className: 'bg-blue-50 text-blue-800 border-blue-200',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{language === 'ta' ? config.labelTa : config.labelEn}</span>
    </span>
  );
};

export default VerificationStatus;
