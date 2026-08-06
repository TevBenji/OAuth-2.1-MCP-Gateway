'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import {
  User,
  Save,
  Loader2,
  Shield,
  Bell,
  Key,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user: clerkUser } = useUser();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const userSettings = useQuery(api.settings.getUserSettings, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip');
  const updateProfileMutation = useMutation(api.settings.updateProfile);

  const loading = userSettings === undefined;

  useEffect(() => {
    if (userSettings) {
      setName(userSettings.name || '');
    }
  }, [userSettings]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkUser?.id) return;

    try {
      setSaving(true);
      await updateProfileMutation({
        clerkId: clerkUser.id,
        name,
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6 max-w-4xl'>
      <div>
        <h1 className='text-3xl font-bold text-wise-gray-900'>Settings</h1>
        <p className='text-wise-gray-600 mt-1'>Manage your account settings and preferences</p>
      </div>

      {/* Profile Settings */}
      <div className='card-wise p-6'>
        <div className='flex items-center space-x-3 mb-6'>
          <User className='w-6 h-6 text-wise-green-primary' />
          <h2 className='text-lg font-semibold text-wise-gray-900'>Profile Information</h2>
        </div>

        <form onSubmit={handleSaveProfile} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
              Full Name
            </label>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='input-wise'
              placeholder='Enter your name'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
              Email Address
            </label>
            <input
              type='email'
              value={userSettings?.email || ''}
              className='input-wise bg-wise-gray-50'
              disabled
            />
            <p className='text-xs text-wise-gray-500 mt-1'>
              Email cannot be changed here. Manage it in your Clerk account.
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
              Role
            </label>
            <input
              type='text'
              value={userSettings?.role || ''}
              className='input-wise bg-wise-gray-50'
              disabled
            />
          </div>

          <div className='flex items-center justify-end pt-4'>
            <button
              type='submit'
              disabled={saving}
              className='btn-wise-primary px-6 py-2 flex items-center'
            >
              {saving ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <Save className='w-4 h-4 mr-2' />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Settings */}
      <div className='card-wise p-6'>
        <div className='flex items-center space-x-3 mb-6'>
          <Shield className='w-6 h-6 text-wise-green-primary' />
          <h2 className='text-lg font-semibold text-wise-gray-900'>Security</h2>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center justify-between p-4 bg-wise-gray-50 rounded-lg'>
            <div>
              <h3 className='font-medium text-wise-gray-900'>Two-Factor Authentication</h3>
              <p className='text-sm text-wise-gray-600 mt-1'>
                Add an extra layer of security to your account
              </p>
            </div>
            <button className='px-4 py-2 border border-wise-gray-300 text-wise-gray-700 rounded-lg hover:bg-white transition-colors'>
              Configure
            </button>
          </div>

          <div className='flex items-center justify-between p-4 bg-wise-gray-50 rounded-lg'>
            <div>
              <h3 className='font-medium text-wise-gray-900'>Active Sessions</h3>
              <p className='text-sm text-wise-gray-600 mt-1'>
                Manage your active login sessions
              </p>
            </div>
            <button className='px-4 py-2 border border-wise-gray-300 text-wise-gray-700 rounded-lg hover:bg-white transition-colors'>
              View Sessions
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className='card-wise p-6'>
        <div className='flex items-center space-x-3 mb-6'>
          <Bell className='w-6 h-6 text-wise-green-primary' />
          <h2 className='text-lg font-semibold text-wise-gray-900'>Notifications</h2>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between p-4 bg-wise-gray-50 rounded-lg'>
            <div>
              <h3 className='font-medium text-wise-gray-900'>Email Notifications</h3>
              <p className='text-sm text-wise-gray-600 mt-1'>
                Receive email updates about your account
              </p>
            </div>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input type='checkbox' className='sr-only peer' defaultChecked />
              <div className="w-11 h-6 bg-wise-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wise-green-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-wise-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wise-green-primary"></div>
            </label>
          </div>

          <div className='flex items-center justify-between p-4 bg-wise-gray-50 rounded-lg'>
            <div>
              <h3 className='font-medium text-wise-gray-900'>Usage Alerts</h3>
              <p className='text-sm text-wise-gray-600 mt-1'>
                Get notified when approaching usage limits
              </p>
            </div>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input type='checkbox' className='sr-only peer' defaultChecked />
              <div className="w-11 h-6 bg-wise-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wise-green-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-wise-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wise-green-primary"></div>
            </label>
          </div>

          <div className='flex items-center justify-between p-4 bg-wise-gray-50 rounded-lg'>
            <div>
              <h3 className='font-medium text-wise-gray-900'>Billing Updates</h3>
              <p className='text-sm text-wise-gray-600 mt-1'>
                Notifications about invoices and payments
              </p>
            </div>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input type='checkbox' className='sr-only peer' defaultChecked />
              <div className="w-11 h-6 bg-wise-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-wise-green-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-wise-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-wise-green-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* API Settings */}
      <div className='card-wise p-6'>
        <div className='flex items-center space-x-3 mb-6'>
          <Key className='w-6 h-6 text-wise-green-primary' />
          <h2 className='text-lg font-semibold text-wise-gray-900'>API Preferences</h2>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between p-4 bg-wise-gray-50 rounded-lg'>
            <div>
              <h3 className='font-medium text-wise-gray-900'>API Rate Limiting</h3>
              <p className='text-sm text-wise-gray-600 mt-1'>
                Configure rate limiting behavior
              </p>
            </div>
            <button className='px-4 py-2 border border-wise-gray-300 text-wise-gray-700 rounded-lg hover:bg-white transition-colors'>
              Configure
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className='card-wise p-6 border-2 border-red-200'>
        <div className='flex items-center space-x-3 mb-6'>
          <AlertTriangle className='w-6 h-6 text-red-500' />
          <h2 className='text-lg font-semibold text-red-900'>Danger Zone</h2>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center justify-between p-4 bg-red-50 rounded-lg'>
            <div>
              <h3 className='font-medium text-red-900'>Delete Account</h3>
              <p className='text-sm text-red-700 mt-1'>
                Permanently delete your account and all associated data
              </p>
            </div>
            <button className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Account Info */}
      {userSettings && (
        <div className='card-wise p-6 bg-wise-gray-50'>
          <h3 className='font-medium text-wise-gray-900 mb-3'>Account Information</h3>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-wise-gray-600'>Member since:</span>
              <span className='text-wise-gray-900'>
                {new Date(userSettings.createdAt).toLocaleDateString()}
              </span>
            </div>
            {userSettings.lastActiveAt && (
              <div className='flex justify-between'>
                <span className='text-wise-gray-600'>Last active:</span>
                <span className='text-wise-gray-900'>
                  {new Date(userSettings.lastActiveAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
