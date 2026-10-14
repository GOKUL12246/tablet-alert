import React, { useState } from 'react';
import { Medicine } from '../../types';
import { MedicineCard } from './MedicineCard';
import { useLanguage } from '../../contexts/LanguageContext';
import { Search, Plus, Pill, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export interface MedicineListProps {
  medicines: Medicine[];
  onAddMedicine?: () => void;
  onSelectMedicine?: (medicine: Medicine) => void;
  onEditMedicine?: (medicine: Medicine) => void;
  onDiscontinueMedicine?: (id: string) => void;
}

export const MedicineList: React.FC<MedicineListProps> = ({
  medicines,
  onAddMedicine,
  onSelectMedicine,
  onEditMedicine,
  onDiscontinueMedicine,
}) => {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.brand_name && m.brand_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.color && m.color.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'verified') return matchesSearch && m.verification_status === 'verified';
    if (filterStatus === 'pending') return matchesSearch && m.verification_status !== 'verified';
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={
              language === 'ta'
                ? 'மருந்தின் பெயர் அல்லது நிறத்தை தேடுங்கள்...'
                : 'Search medicine name, brand, or tablet color...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border-gray-300 text-sm py-2.5 px-3 bg-white shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">{language === 'ta' ? 'அனைத்து மருந்துகள்' : 'All Medicines'}</option>
            <option value="verified">
              {language === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Verified Only'}
            </option>
            <option value="pending">
              {language === 'ta' ? 'சரிபார்ப்பு காத்திருக்கிறது' : 'Awaiting Verification'}
            </option>
          </select>

          {onAddMedicine && (
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-5 h-5" />}
              onClick={onAddMedicine}
            >
              {t('medicine.add')}
            </Button>
          )}
        </div>
      </div>

      {/* List / Empty State */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center text-primary-600">
            <Pill className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-1">
            {language === 'ta' ? 'மருந்துகள் எதுவும் காணப்படவில்லை' : 'No Medicines Found'}
          </h4>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
            {t('medicine.empty')}
          </p>
          {onAddMedicine && (
            <Button
              variant="primary"
              size="lg"
              icon={<Plus className="w-5 h-5" />}
              onClick={onAddMedicine}
            >
              {t('medicine.add_new')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onClick={() => onSelectMedicine?.(medicine)}
              onEdit={onEditMedicine}
              onDiscontinue={onDiscontinueMedicine}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineList;
