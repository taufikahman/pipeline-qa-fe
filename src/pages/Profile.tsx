import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Building2, Shield, Eye, EyeOff, KeyRound, Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { changePassword, uploadAvatar, uploadOrgLogo, getUploadUrl } from '@/lib/api';

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, organizations, isAuthenticated, updateUser, updateOrganization } = useAuth();

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Org logo upload
  const logoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingLogoOrg, setUploadingLogoOrg] = useState<string | null>(null);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [currentPwError, setCurrentPwError] = useState('');
  const [newPwError, setNewPwError] = useState('');
  const [confirmPwError, setConfirmPwError] = useState('');

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const result = await uploadAvatar(user.id, file);
      updateUser({ avatar_url: result.avatar_url });
      toast({ title: 'Avatar updated', description: 'Your profile picture has been changed.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleLogoUpload = async (orgId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogoOrg(orgId);
    try {
      const result = await uploadOrgLogo(orgId, user.id, file);
      updateOrganization(orgId, { logo_url: result.logo_url });
      toast({ title: 'Logo updated', description: 'Organization logo has been changed.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    } finally {
      setUploadingLogoOrg(null);
      const ref = logoInputRefs.current[orgId];
      if (ref) ref.value = '';
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPwError('');
    setNewPwError('');
    setConfirmPwError('');

    let isValid = true;
    if (!currentPassword) { setCurrentPwError('Current password is required'); isValid = false; }
    if (!newPassword) { setNewPwError('New password is required'); isValid = false; }
    else if (newPassword.length < 8) { setNewPwError('Must be at least 8 characters'); isValid = false; }
    if (!confirmPassword) { setConfirmPwError('Please confirm your new password'); isValid = false; }
    else if (newPassword !== confirmPassword) { setConfirmPwError('Passwords do not match'); isValid = false; }
    if (!isValid) return;

    setIsChanging(true);
    try {
      await changePassword({ user_id: user.id, current_password: currentPassword, new_password: newPassword });
      toast({ title: 'Password changed', description: 'Your password has been updated successfully.' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Failed to change password', description: err.message });
    } finally {
      setIsChanging(false);
    }
  };

  const avatarSrc = getUploadUrl(user.avatar_url);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">
          View your account information and manage your settings.
        </p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your personal details and profile picture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="size-20 rounded-full object-cover ring-2 ring-background shadow-md"
                />
              ) : (
                <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold ring-2 ring-background shadow-md">
                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                </div>
              )}
              {/* Upload overlay */}
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="size-6 text-white" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {user.full_name || 'No name set'}
              </h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
              >
                {isUploadingAvatar ? 'Uploading...' : 'Change profile picture'}
              </button>
            </div>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Mail className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-base">{user.full_name || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={user.is_active ? 'default' : 'destructive'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant={user.is_email_verified ? 'default' : 'secondary'}>
                    {user.is_email_verified ? 'Email Verified' : 'Email Not Verified'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Card */}
      {organizations && organizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5" />
              Organizations
            </CardTitle>
            <CardDescription>Organizations you belong to. Owners and admins can change the logo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {organizations.map((org) => {
                const logoSrc = getUploadUrl(org.logo_url);
                const canUpload = org.role === 'owner' || org.role === 'admin';
                const isUploading = uploadingLogoOrg === org.id;

                return (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      {/* Org logo with upload */}
                      <div className="relative group">
                        {logoSrc ? (
                          <img
                            src={logoSrc}
                            alt={org.name}
                            className="size-10 shrink-0 rounded-lg object-cover shadow-sm"
                          />
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {canUpload && (
                          <>
                            <button
                              type="button"
                              disabled={isUploading}
                              onClick={() => logoInputRefs.current[org.id]?.click()}
                              className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <Upload className="size-4 text-white" />
                            </button>
                            <input
                              ref={(el) => { logoInputRefs.current[org.id] = el; }}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleLogoUpload(org.id, e)}
                            />
                          </>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{org.name}</p>
                        {canUpload && (
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => logoInputRefs.current[org.id]?.click()}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {isUploading ? 'Uploading...' : 'Change logo'}
                          </button>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {org.role}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password. Must be at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setCurrentPwError(''); }}
                  className={`pr-10 ${currentPwError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {currentPwError && <p className="text-sm text-red-600">{currentPwError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setNewPwError(''); }}
                  className={`pr-10 ${newPwError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {newPwError && <p className="text-sm text-red-600">{newPwError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPwError(''); }}
                className={confirmPwError ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {confirmPwError && <p className="text-sm text-red-600">{confirmPwError}</p>}
            </div>

            <Button
              type="submit"
              disabled={isChanging}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isChanging ? 'Changing password...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
