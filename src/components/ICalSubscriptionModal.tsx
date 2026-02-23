import { useState } from 'react';
import { Copy, Check, Calendar, X, ExternalLink } from 'lucide-react';
import { Button, Card } from './ui';

interface ICalSubscriptionModalProps {
  planId: string;
  planName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ICalSubscriptionModal({ planId, planName, isOpen, onClose }: ICalSubscriptionModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Get Supabase URL from environment or use default
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const subscriptionUrl = `${supabaseUrl}/functions/v1/ical-subscription/${planId}`;
  const webcalUrl = subscriptionUrl.replace('https://', 'webcal://');

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(subscriptionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenInCalendar = () => {
    // Open webcal URL which will trigger the default calendar app
    window.location.href = webcalUrl;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar size={24} className="text-primary-600" />
            <h2 className="text-xl font-semibold text-text-primary">
              Kalender-Abonnement
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-text-primary mb-2">
              Trainingsplan: {planName}
            </h3>
            <p className="text-sm text-text-secondary">
              Abonnieren Sie diesen Trainingsplan in Ihrer Kalender-App. Der Kalender wird automatisch aktualisiert,
              wenn Sie Änderungen am Trainingsplan vornehmen.
            </p>
          </div>

          <div className="bg-background-secondary rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Abonnement-URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subscriptionUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-border-primary rounded-md bg-background-primary text-text-secondary text-sm font-mono"
                />
                <Button
                  onClick={handleCopyUrl}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Kopiert
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Kopieren
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t border-border-primary">
              <Button
                onClick={handleOpenInCalendar}
                variant="default"
                className="w-full flex items-center justify-center gap-2"
              >
                <ExternalLink size={18} />
                In Kalender-App öffnen
              </Button>
            </div>
          </div>

          <div className="bg-primary-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-text-primary text-sm">
              So fügen Sie das Abonnement hinzu:
            </h4>
            <div className="space-y-3 text-sm text-text-secondary">
              <div>
                <p className="font-medium text-text-primary mb-1">📱 Apple Kalender (iOS/macOS):</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Klicken Sie auf "In Kalender-App öffnen" oder</li>
                  <li>Öffnen Sie die Kalender-App → Kalender hinzufügen → Abonnement</li>
                  <li>Fügen Sie die kopierte URL ein</li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-text-primary mb-1">📅 Google Calendar:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Öffnen Sie Google Calendar im Browser</li>
                  <li>Klicken Sie auf das + neben "Andere Kalender"</li>
                  <li>Wählen Sie "Per URL"</li>
                  <li>Fügen Sie die URL ein (verwenden Sie die HTTPS-URL, nicht webcal://)</li>
                </ol>
              </div>
              <div>
                <p className="font-medium text-text-primary mb-1">🪟 Outlook:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Öffnen Sie Outlook</li>
                  <li>Datei → Kontoeinstellungen → Internetkalender</li>
                  <li>Fügen Sie die URL ein</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>Hinweis:</strong> Der Kalender wird regelmäßig (ca. stündlich) automatisch aktualisiert.
              Änderungen am Trainingsplan werden nach kurzer Zeit in Ihrer Kalender-App sichtbar.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
