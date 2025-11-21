import { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button, Input, Badge } from './ui';
import { marketplaceService } from '../services/marketplaceService';
import { PREDEFINED_TAGS } from '../types/marketplace';
import { PlanVisibility } from '../types/database';
import { typography, cn, flex } from '../lib/designSystem';
import { Globe, Lock, EyeOff, Loader2 } from 'lucide-react';

interface PublishPlanModalProps {
  planId: string;
  currentVisibility?: PlanVisibility;
  currentDescription?: string | null;
  currentTags?: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function PublishPlanModal({
  planId,
  currentVisibility = 'private',
  currentDescription = '',
  currentTags = [],
  onClose,
  onSuccess,
}: PublishPlanModalProps) {
  const [visibility, setVisibility] = useState<PlanVisibility>(currentVisibility);
  const [description, setDescription] = useState(currentDescription || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    currentTags.filter((tag) => PREDEFINED_TAGS.includes(tag))
  );
  const [loading, setLoading] = useState(false);

  const isPublished = currentVisibility !== 'private';

  const handlePublish = async () => {
    try {
      setLoading(true);

      if (visibility === 'private') {
        // Unpublish
        await marketplaceService.unpublishPlan(planId);
      } else {
        // Publish
        await marketplaceService.publishPlan(planId, {
          visibility,
          description,
          manual_tags: selectedTags,
        });
      }

      onSuccess();
    } catch (err) {
      console.error('Error publishing plan:', err);
      alert('Fehler beim Veröffentlichen');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isPublished ? 'Veröffentlichung verwalten' : 'Plan veröffentlichen'}
      size="lg"
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            Abbrechen
          </Button>
          <Button
            onClick={handlePublish}
            variant={visibility === 'private' ? 'danger' : 'primary'}
            disabled={loading || (visibility !== 'private' && !description.trim())}
            leftIcon={loading ? <Loader2 size={18} className="animate-spin" /> : undefined}
          >
            {loading
              ? 'Verarbeite...'
              : visibility === 'private'
              ? 'Veröffentlichung aufheben'
              : isPublished
              ? 'Änderungen speichern'
              : 'Veröffentlichen'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Info Banner */}
        {!isPublished && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className={cn(typography.small, 'text-blue-800')}>
              Veröffentliche deinen Trainingsplan im Marktplatz, damit andere Läufer ihn nutzen
              können. Du kannst wählen, ob dein Name angezeigt wird oder ob der Plan anonym
              veröffentlicht wird.
            </p>
          </div>
        )}

        {/* Visibility Options */}
        <div>
          <label className={cn(typography.small, 'font-semibold mb-3 block')}>
            Sichtbarkeit
          </label>
          <div className="space-y-3">
            {/* Private */}
            <button
              onClick={() => setVisibility('private')}
              className={cn(
                'w-full text-left p-4 rounded-lg border-2 transition-all',
                visibility === 'private'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className={flex.row}>
                <Lock size={20} className="text-gray-600" />
                <div>
                  <div className={cn(typography.body, 'font-semibold')}>Privat</div>
                  <div className={cn(typography.small, 'text-text-tertiary')}>
                    Nur du kannst diesen Plan sehen
                  </div>
                </div>
              </div>
            </button>

            {/* Public */}
            <button
              onClick={() => setVisibility('public')}
              className={cn(
                'w-full text-left p-4 rounded-lg border-2 transition-all',
                visibility === 'public'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className={flex.row}>
                <Globe size={20} className="text-green-600" />
                <div>
                  <div className={cn(typography.body, 'font-semibold')}>
                    Öffentlich mit Profil
                  </div>
                  <div className={cn(typography.small, 'text-text-tertiary')}>
                    Dein Name und Profil werden angezeigt
                  </div>
                </div>
              </div>
            </button>

            {/* Public Anonymous */}
            <button
              onClick={() => setVisibility('public_anonymous')}
              className={cn(
                'w-full text-left p-4 rounded-lg border-2 transition-all',
                visibility === 'public_anonymous'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className={flex.row}>
                <EyeOff size={20} className="text-orange-600" />
                <div>
                  <div className={cn(typography.body, 'font-semibold')}>
                    Öffentlich (Anonym)
                  </div>
                  <div className={cn(typography.small, 'text-text-tertiary')}>
                    Plan ist öffentlich, aber dein Name wird nicht angezeigt
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Description - only show if public */}
        {visibility !== 'private' && (
          <div>
            <label className={cn(typography.small, 'font-semibold mb-2 block')}>
              Beschreibung *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibe deinen Trainingsplan... (z.B. Für wen ist er geeignet? Was macht ihn besonders?)"
              className={cn(
                'w-full px-4 py-3 rounded-lg border-2 border-gray-200',
                'focus:border-primary-600 focus:outline-none transition-colors',
                'min-h-[120px] resize-y'
              )}
              maxLength={500}
            />
            <div className="flex justify-between mt-1">
              <span className={cn(typography.small, 'text-text-tertiary')}>
                Mindestens 20 Zeichen
              </span>
              <span className={cn(typography.small, 'text-text-tertiary')}>
                {description.length}/500
              </span>
            </div>
          </div>
        )}

        {/* Tags - only show if public */}
        {visibility !== 'private' && (
          <div>
            <label className={cn(typography.small, 'font-semibold mb-2 block')}>
              Tags auswählen (optional)
            </label>
            <p className={cn(typography.small, 'text-text-tertiary mb-3')}>
              Automatische Tags (Distanz, Dauer, Terrain) werden hinzugefügt. Wähle
              zusätzliche Tags aus:
            </p>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'cursor-pointer transition-all',
                    selectedTags.includes(tag)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className={cn(typography.small, 'text-text-tertiary mt-2')}>
                {selectedTags.length} {selectedTags.length === 1 ? 'Tag' : 'Tags'}{' '}
                ausgewählt
              </p>
            )}
          </div>
        )}

        {/* Current Status */}
        {isPublished && (
          <div className="border-t border-gray-200 pt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className={cn(typography.small, 'text-green-800')}>
                <strong>Status:</strong> Dieser Plan ist bereits veröffentlicht.{' '}
                {currentVisibility === 'public'
                  ? 'Dein Name wird angezeigt.'
                  : currentVisibility === 'public_anonymous'
                  ? 'Der Plan ist anonym.'
                  : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
