import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';
import { useToast } from '../contexts/ToastContext';
import { profileService } from '../services/profileService';
import { Camera, Save, Loader2 } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { typography, cn } from '../lib/designSystem';
import { UserProfileManager } from '../components/UserProfileManager';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { runnerProfile, updateRunnerProfile } = useRunnerProfile();
  const toast = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      await profileService.updateProfile(user.id, {
        full_name: fullName,
        bio: bio,
      });
      await refreshProfile();
      toast.success('Profil erfolgreich aktualisiert');
    } catch (err) {
      toast.error('Fehler beim Aktualisieren des Profils');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Bild darf maximal 2MB groß sein');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte nur Bilddateien hochladen');
      return;
    }

    setUploading(true);

    try {
      // Delete old avatar if exists
      if (profile?.avatar_url) {
        try {
          await profileService.deleteAvatar(profile.avatar_url);
        } catch (err) {
          console.error('Error deleting old avatar:', err);
        }
      }

      // Upload new avatar
      const avatarUrl = await profileService.uploadAvatar(user.id, file);
      if (avatarUrl) {
        await profileService.updateProfile(user.id, { avatar_url: avatarUrl });
        await refreshProfile();
        setImageError(false);
        toast.success('Profilbild erfolgreich aktualisiert');
      }
    } catch (err) {
      toast.error('Fehler beim Hochladen des Profilbilds');
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <Card variant="default" className="md:col-span-1">
          <div className="text-center">
            <h2 className={cn(typography.h3, 'mb-4')}>Profilbild</h2>

            <div className="relative inline-block mb-4">
              {profile?.avatar_url && !imageError ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'User'}
                  className="w-32 h-32 rounded-full object-cover mx-auto"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary-200 flex items-center justify-center mx-auto">
                  <span className={cn(typography.display, 'text-primary-800')}>
                    {getInitials(profile?.full_name || null)}
                  </span>
                </div>
              )}

              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              disabled={uploading}
              fullWidth
            >
              <Camera size={18} />
              Bild ändern
            </Button>

            <p className={cn(typography.caption, 'text-text-tertiary mt-2')}>
              Max. 2MB, JPG, PNG oder GIF
            </p>
          </div>
        </Card>

        {/* Profile Info Section */}
        <Card variant="default" className="md:col-span-2">
          <h2 className={cn(typography.h3, 'mb-4')}>Persönliche Informationen</h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="E-Mail"
              type="email"
              value={user?.email || ''}
              disabled
              helperText="E-Mail-Adresse kann nicht geändert werden"
            />

            <Input
              label="Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dein vollständiger Name"
            />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Bio (optional)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={cn(
                  'block w-full rounded-lg border px-4 py-2.5 text-base text-text-primary placeholder:text-text-tertiary bg-white transition-all duration-fast focus:outline-none focus:ring-2',
                  'border-border-medium focus:border-primary-400 focus:ring-primary-400',
                  'min-h-[100px]'
                )}
                placeholder="Erzähle etwas über dich..."
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
            >
              <Save size={18} />
              Änderungen speichern
            </Button>
          </form>
        </Card>
      </div>

      {/* Runner Profile Section */}
      {runnerProfile && (
        <div className="mt-6">
          <UserProfileManager
            profile={runnerProfile}
            onUpdateProfile={updateRunnerProfile}
          />
        </div>
      )}
    </div>
  );
}
