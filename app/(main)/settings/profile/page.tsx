'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { updateProfile, getProfile } from '@/features/auth/actions';
import { User, Upload, X, Plus, Loader2 } from 'lucide-react';

interface WorkHistoryEntry {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [qualifications, setQualifications] = useState<string[]>(['']);
  const [workHistory, setWorkHistory] = useState<WorkHistoryEntry[]>([
    { company: '', position: '', startDate: '', endDate: '', current: false, description: '' }
  ]);
  const [avatar, setAvatar] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
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
          const u = result.user;
          setName(u.name || '');
          setBio(u.bio || '');
          setTitle(u.title || '');
          setCompany(u.company || '');
          setLocation(u.location || '');
          setAvatar(u.avatar || '');
          setAvatarPreview(u.avatar || '');

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
              setWorkHistory(Array.isArray(history) && history.length > 0 ? history : [
                { company: '', position: '', startDate: '', endDate: '', current: false, description: '' }
              ]);
            } catch {
              setWorkHistory([{ company: '', position: '', startDate: '', endDate: '', current: false, description: '' }]);
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
    }
  };

  const addQualification = () => {
    setQualifications([...qualifications, '']);
  };

  const removeQualification = (index: number) => {
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const updateQualification = (index: number, value: string) => {
    const updated = [...qualifications];
    updated[index] = value;
    setQualifications(updated);
  };

  const addWorkHistory = () => {
    setWorkHistory([...workHistory, { company: '', position: '', startDate: '', endDate: '', current: false, description: '' }]);
  };

  const removeWorkHistory = (index: number) => {
    setWorkHistory(workHistory.filter((_, i) => i !== index));
  };

  const updateWorkHistory = (index: number, field: keyof WorkHistoryEntry, value: string | boolean) => {
    const updated = [...workHistory];
    updated[index] = { ...updated[index], [field]: value };
    setWorkHistory(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      formData.append('title', title);
      formData.append('company', company);
      formData.append('location', location);
      formData.append('avatar', avatar);
      
      // Filter out empty qualifications
      const validQualifications = qualifications.filter(q => q.trim() !== '');
      formData.append('qualifications', JSON.stringify(validQualifications));
      
      // Filter out empty work history entries
      const validWorkHistory = workHistory.filter(
        wh => wh.company.trim() !== '' && wh.position.trim() !== ''
      );
      formData.append('workHistory', JSON.stringify(validWorkHistory));

      const result = await updateProfile(session.user.id, formData);
      if (result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        update({ name, avatar });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsLoading(false);
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
              className={`p-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-600'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}
            >
              {message.text}
            </div>
          )}

          <Button type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
