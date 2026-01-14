import { useState } from 'react';
import { PersonalBest } from '../types/userProfile';
import { calculateVDOT } from '../utils/vdotCalculator';
import { PersonalBestInput } from './PersonalBestInput';
import { Edit2, Trash2, Calendar, TrendingUp, Clock } from 'lucide-react';
import { cn } from '../lib/designSystem';

interface PersonalBestCardProps {
  personalBest: PersonalBest;
  onEdit: (pb: PersonalBest) => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

const DISTANCE_LABELS: Record<string, string> = {
  '5K': '5K',
  '10K': '10K',
  'HALF_MARATHON': 'Halbmarathon',
  'MARATHON': 'Marathon',
};

const DISTANCE_ICONS: Record<string, string> = {
  '5K': '🏃',
  '10K': '🏃‍♂️',
  'HALF_MARATHON': '🏃‍♀️',
  'MARATHON': '🎽',
  'CUSTOM': '📏',
};

export function PersonalBestCard({
  personalBest,
  onEdit,
  onDelete,
  isDeleting = false,
}: PersonalBestCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const vdot = calculateVDOT(personalBest);
  const distanceLabel =
    personalBest.distance === 'CUSTOM'
      ? `${personalBest.customDistanceKm} km`
      : DISTANCE_LABELS[personalBest.distance];
  const distanceIcon = DISTANCE_ICONS[personalBest.distance];

  const formattedDate = personalBest.date
    ? new Date(personalBest.date).toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const handleSave = (pb: PersonalBest) => {
    onEdit(pb);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  if (isEditing) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200 rounded-xl p-5 animate-in fade-in duration-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="text-xl">{distanceIcon}</div>
          <h4 className="font-semibold text-slate-800">Bestzeit bearbeiten</h4>
        </div>
        <PersonalBestInput
          initialValue={personalBest}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          saveButtonText="Änderungen speichern"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative bg-white border-2 border-slate-200 rounded-xl p-4 transition-all duration-200',
        'hover:border-primary-300 hover:shadow-md',
        isDeleting && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-800 mb-3">
              Möchtest du diese Bestzeit wirklich löschen?
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Ja, löschen
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Distance */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{distanceIcon}</span>
            <h3 className="text-lg font-bold text-slate-800">{distanceLabel}</h3>
          </div>

          {/* Time and VDOT */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
            <div className="flex items-center gap-1.5 text-slate-700">
              <Clock size={14} className="text-slate-400" />
              <span className="font-mono font-semibold text-base">
                {personalBest.time}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-purple-500" />
              <span className="text-sm text-slate-600">
                VDOT: <span className="font-semibold text-purple-600">{vdot.toFixed(1)}</span>
              </span>
            </div>
          </div>

          {/* Date */}
          {formattedDate && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar size={12} />
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
            title="Bearbeiten"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Löschen"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-400 to-blue-400 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
