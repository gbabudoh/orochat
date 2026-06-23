'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { updateProfile, getProfile, pauseAccount, reactivateAccount, deleteAccount } from '@/features/auth/actions';
import { User, Upload, X, Plus, Loader2, ShieldAlert, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import { COUNTRIES, countryCodeToFlag } from '@/lib/constants/countries';
import Modal from '@/components/ui/Modal';

interface WorkHistoryEntry {
  company: string;
  position: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface EducationEntry {
  institution: string;
  city: string;
  country: string;
  yearCompleted: string;
}

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isPaused, setIsPaused] = useState(false);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<'pause' | 'delete' | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [username, setUsername] = useState('');
  const [hasExistingUsername, setHasExistingUsername] = useState(false);
  const [countryCode, setCountryCode] = useState('');
  const [qualifications, setQualifications] = useState<string[]>(['']);
  const [workHistory, setWorkHistory] = useState<WorkHistoryEntry[]>([
    { company: '', position: '', city: '', country: '', startDate: '', endDate: '', current: false, description: '' }
  ]);
  const [education, setEducation] = useState<EducationEntry[]>([
    { institution: '', city: '', country: '', yearCompleted: '' }
  ]);
  const [avatar, setAvatar] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) return;

      try {
        const result = await getProfile(session.user.id);
        if (result.success && result.user) {
          const u = result.user as any;
          setName(u.name || '');
          setBio(u.bio || '');
          setTitle(u.title || '');
          setCompany(u.company || '');
          setLocation(u.location || '');
          setUsername(u.username || '');
          setHasExistingUsername(!!u.username);
          setCountryCode(u.countryCode || '');
          setAvatar(u.avatar || '');
          setAvatarPreview(u.avatar || '');
          setIsPaused(!!u.isPaused);

          // Parse qualifications
          if (u.qualifications) {
            try {
              const quals = typeof u.qualifications === 'string'
                ? JSON.parse(u.qualifications)
                : u.qualifications;
              setQualifications(Array.isArray(quals) && quals.length > 0 ? quals : ['']);
            } catch {
              setQualifications(['']);
            }
          }

          // Parse work history
          if (u.workHistory) {
            try {
              const history = typeof u.workHistory === 'string'
                ? JSON.parse(u.workHistory)
                : u.workHistory;
              setWorkHistory(Array.isArray(history) && history.length > 0 ? history.map((entry: Partial<WorkHistoryEntry>) => ({
                company: entry.company || '',
                position: entry.position || '',
                city: entry.city || '',
                country: entry.country || '',
                startDate: entry.startDate || '',
                endDate: entry.endDate || '',
                current: entry.current || false,
                description: entry.description || '',
              })) : [
                { company: '', position: '', city: '', country: '', startDate: '', endDate: '', current: false, description: '' }
              ]);
            } catch {
              setWorkHistory([{ company: '', position: '', city: '', country: '', startDate: '', endDate: '', current: false, description: '' }]);
            }
          }

          // Parse education
          if (u.education) {
            try {
              const edu = typeof u.education === 'string'
                ? JSON.parse(u.education)
                : u.education;
              setEducation(Array.isArray(edu) && edu.length > 0 ? edu : [
                { institution: '', city: '', country: '', yearCompleted: '' }
              ]);
            } catch {
              setEducation([{ institution: '', city: '', country: '', yearCompleted: '' }]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsFetching(false);
      }
    };

    loadProfile();
  }, [session?.user?.id]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 2MB' });
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploadingAvatar(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (data.success) {
        setAvatar(data.url);
        setMessage({ type: 'success', text: 'Photo uploaded successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to upload photo' });
        setAvatarPreview('');
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to upload photo' });
      setAvatarPreview('');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const addQualification = () => {
    setQualifications((prev) => [...prev, '']);
  };

  const removeQualification = (index: number) => {
    setQualifications((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQualification = (index: number, value: string) => {
    setQualifications((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const addWorkHistory = () => {
    setWorkHistory((prev) => [...prev, { company: '', position: '', city: '', country: '', startDate: '', endDate: '', current: false, description: '' }]);
  };

  const removeWorkHistory = (index: number) => {
    setWorkHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const updateWorkHistory = (index: number, field: keyof WorkHistoryEntry, value: string | boolean) => {
    setWorkHistory((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addEducation = () => {
    setEducation((prev) => [...prev, { institution: '', city: '', country: '', yearCompleted: '' }]);
  };

  const removeEducation = (index: number) => {
    setEducation((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof EducationEntry, value: string) => {
    setEducation((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    if (isUploadingAvatar) {
      setMessage({ type: 'error', text: 'Your photo is still uploading — please wait a moment and try again.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      formData.append('title', title);
      formData.append('company', company);
      formData.append('location', location);
      formData.append('username', username);
      formData.append('countryCode', countryCode);
      formData.append('avatar', avatar);

      // Filter out empty qualifications
      const validQualifications = qualifications.filter(q => q.trim() !== '');
      formData.append('qualifications', JSON.stringify(validQualifications));

      // Filter out empty work history entries
      const validWorkHistory = workHistory.filter(
        wh => wh.company.trim() !== '' && wh.position.trim() !== ''
      );
      formData.append('workHistory', JSON.stringify(validWorkHistory));

      // Filter out empty education entries
      const validEducation = education.filter(ed => ed.institution.trim() !== '');
      formData.append('education', JSON.stringify(validEducation));

      const result = await updateProfile(session.user.id, formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        update({ name, avatar });
        if (username) {
          setHasExistingUsername(true);
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseAccount = async () => {
    if (!session?.user?.id) return;
    setAccountActionLoading(true);
    try {
      const result = await pauseAccount(session.user.id);
      if (result.success) {
        setConfirmModal(null);
        await signOut({ callbackUrl: '/login' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to pause account' });
        setConfirmModal(null);
      }
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleReactivateAccount = async () => {
    if (!session?.user?.id) return;
    setAccountActionLoading(true);
    try {
      const result = await reactivateAccount(session.user.id);
      if (result.success) {
        setIsPaused(false);
        setMessage({ type: 'success', text: 'Your account has been reactivated' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to reactivate account' });
      }
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return;
    setAccountActionLoading(true);
    try {
      const result = await deleteAccount(session.user.id);
      if (result.success) {
        setConfirmModal(null);
        await signOut({ callbackUrl: '/login' });
        router.push('/login');
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete account' });
        setConfirmModal(null);
      }
    } finally {
      setAccountActionLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#458B9E] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#333333] mb-6">Profile Settings</h1>


      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo/Avatar */}
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-2">
              Profile Photo
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 rounded-full bg-[#458B9E] flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Profile" fill className="object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max size 2MB</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., John Doe"
            required
          />

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={session?.user?.email || ''}
              disabled
              className="w-full px-4 py-2.5 rounded-lg border-2 bg-gray-50 text-gray-600 border-gray-200 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Profession/Title */}
          <Input
            label="Professional Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
          />

          {/* Company */}
          <Input
            label="Current Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g., Tech Corp"
          />

          {/* Location */}
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., San Francisco, CA or London, UK"
          />

          {/* Handle + Country (used on the Global feed) */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1.5">
                Handle
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder="yourhandle"
                  maxLength={20}
                  disabled={hasExistingUsername}
                  className={`w-full pl-8 pr-4 py-2.5 rounded-lg border-2 transition-all duration-200 ${hasExistingUsername
                      ? 'bg-gray-50 text-gray-600 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-[#333333] placeholder:text-gray-400 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20'
                    }`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {hasExistingUsername
                  ? 'Handles cannot be changed once created. Please contact an admin to request a change.'
                  : 'Shown on your public posts in the Global feed'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1.5">
                Country
              </label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 bg-white text-[#333333] border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20"
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {countryCodeToFlag(c.code)} {c.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Shown as a flag badge next to your handle</p>
            </div>
          </div>

          {/* Qualifications */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#333333]">
                Qualifications
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addQualification}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {qualifications.map((qual, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={qual}
                    onChange={(e) => updateQualification(index, e.target.value)}
                    placeholder="e.g., MBA, PMP Certification, AWS Solutions Architect"
                    className="flex-1"
                  />
                  {qualifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQualification(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Work History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#333333]">
                Work History
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addWorkHistory}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Position
              </Button>
            </div>
            <div className="space-y-4">
              {workHistory.map((entry, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-[#333333]">Position {index + 1}</h4>
                      {workHistory.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWorkHistory(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <Input
                      label="Company"
                      value={entry.company}
                      onChange={(e) => updateWorkHistory(index, 'company', e.target.value)}
                      placeholder="Company name"
                    />
                    <Input
                      label="Position"
                      value={entry.position}
                      onChange={(e) => updateWorkHistory(index, 'position', e.target.value)}
                      placeholder="Job title"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="City"
                        value={entry.city}
                        onChange={(e) => updateWorkHistory(index, 'city', e.target.value)}
                        placeholder="e.g., London"
                      />
                      <div>
                        <label className="block text-sm font-medium text-[#333333] mb-1.5">
                          Country
                        </label>
                        <select
                          value={entry.country}
                          onChange={(e) => updateWorkHistory(index, 'country', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 bg-white text-[#333333] border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20"
                        >
                          <option value="">Select a country</option>
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Start Date"
                        type="month"
                        value={entry.startDate}
                        onChange={(e) => updateWorkHistory(index, 'startDate', e.target.value)}
                      />
                      {!entry.current && (
                        <Input
                          label="End Date"
                          type="month"
                          value={entry.endDate}
                          onChange={(e) => updateWorkHistory(index, 'endDate', e.target.value)}
                        />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`current-${index}`}
                        checked={entry.current}
                        onChange={(e) => {
                          updateWorkHistory(index, 'current', e.target.checked);
                          if (e.target.checked) {
                            updateWorkHistory(index, 'endDate', '');
                          }
                        }}
                        className="w-4 h-4 text-[#458B9E] border-gray-300 rounded focus:ring-[#458B9E]"
                      />
                      <label htmlFor={`current-${index}`} className="text-sm text-gray-700">
                        I currently work here
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#333333] mb-1.5">
                        Description (Optional)
                      </label>
                      <textarea
                        value={entry.description}
                        onChange={(e) => updateWorkHistory(index, 'description', e.target.value)}
                        placeholder="Brief description of your role and achievements"
                        className="w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 bg-white text-[#333333] placeholder:text-gray-400 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 min-h-[80px]"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#333333]">
                Education
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addEducation}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Education
              </Button>
            </div>
            <div className="space-y-4">
              {education.map((entry, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-[#333333]">Education {index + 1}</h4>
                      {education.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <Input
                      label="Institution"
                      value={entry.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      placeholder="e.g., Stanford University"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="City"
                        value={entry.city}
                        onChange={(e) => updateEducation(index, 'city', e.target.value)}
                        placeholder="e.g., London"
                      />
                      <div>
                        <label className="block text-sm font-medium text-[#333333] mb-1.5">
                          Country
                        </label>
                        <select
                          value={entry.country}
                          onChange={(e) => updateEducation(index, 'country', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 bg-white text-[#333333] border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20"
                        >
                          <option value="">Select a country</option>
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Year Completed"
                        type="number"
                        min="1950"
                        max="2100"
                        value={entry.yearCompleted}
                        onChange={(e) => updateEducation(index, 'yearCompleted', e.target.value)}
                        placeholder="e.g., 2022"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-1.5">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself, your professional background, and what you're looking for..."
              className="w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 bg-white text-[#333333] placeholder:text-gray-400 border-gray-200 focus:border-[#458B9E] focus:ring-2 focus:ring-[#458B9E]/20 min-h-[120px]"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg ${message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-600'
                  : 'bg-red-50 border border-red-200 text-red-600'
                }`}
            >
              {message.text}
            </div>
          )}

          <Button type="submit" isLoading={isLoading} disabled={isUploadingAvatar}>
            {isUploadingAvatar ? 'Uploading photo…' : 'Save Changes'}
          </Button>
        </form>
      </Card>

      <Card padding="lg" className="mt-6 border-2 border-red-100">
        <h2 className="text-lg font-semibold text-[#333333] mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          Danger Zone
        </h2>
        <div className="space-y-4">
          {isPaused ? (
            <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div>
                <p className="font-medium text-[#333333]">Account Paused</p>
                <p className="text-sm text-gray-600">Your account is deactivated and hidden from other Oros.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleReactivateAccount}
                isLoading={accountActionLoading}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Reactivate Account
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div>
                <p className="font-medium text-[#333333]">Pause Account</p>
                <p className="text-sm text-gray-600">Temporarily deactivate your account. You can reactivate anytime by logging back in.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmModal('pause')}
              >
                <PauseCircle className="w-4 h-4 mr-2" />
                Pause Account
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <div>
              <p className="font-medium text-[#333333]">Delete Account</p>
              <p className="text-sm text-gray-600">Permanently delete your account and all associated data. This cannot be undone.</p>
            </div>
            <Button
              type="button"
              variant="danger"
              onClick={() => setConfirmModal('delete')}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={confirmModal === 'pause'}
        onClose={() => setConfirmModal(null)}
        title="Pause your account?"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Your profile and activity will be hidden from other Oros until you log back in to reactivate it. You&apos;ll be signed out now.
        </p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => setConfirmModal(null)}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={handlePauseAccount} isLoading={accountActionLoading}>
            Pause Account
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={confirmModal === 'delete'}
        onClose={() => setConfirmModal(null)}
        title="Delete your account permanently?"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          This will permanently delete your account and all associated data, including posts, connections, and messages. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => setConfirmModal(null)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleDeleteAccount} isLoading={accountActionLoading}>
            Delete Permanently
          </Button>
        </div>
      </Modal>
    </div>
  );
}
