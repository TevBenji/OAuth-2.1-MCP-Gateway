'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Building2, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getOrganization, createOrganization, updateOrganization } from '@/app/actions';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function OrganizationGeneralPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  useEffect(() => {
    async function loadOrganization() {
      if (!user?.id) return;

      try {
        setLoading(true);
        const result = await getOrganization(user.id);

        if (result.success && result.data) {
          setOrganization(result.data as any);
          setFormData({
            name: result.data.name || '',
            slug: result.data.slug || '',
            description: result.data.description || '',
          });
        }
      } catch (error) {
        console.error('Error loading organization:', error);
        toast.error('Failed to load organization');
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    try {
      setSaving(true);

      if (organization) {
        // Update existing organization
        const result = await updateOrganization({
          userId: user.id,
          organizationId: organization.id,
          name: formData.name,
          description: formData.description,
        });

        if (result.success) {
          toast.success('Organization updated successfully');
          setOrganization(result.data as any);
        } else {
          toast.error(result.error || 'Failed to update organization');
        }
      } else {
        // Create new organization
        const result = await createOrganization({
          userId: user.id,
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
        });

        if (result.success) {
          toast.success('Organization created successfully');
          setOrganization(result.data as any);
        } else {
          toast.error(result.error || 'Failed to create organization');
        }
      }
    } catch (error) {
      console.error('Error saving organization:', error);
      toast.error('Failed to save organization');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading organization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-wise-gray-900'>Organization Settings</h1>
        <p className='text-wise-gray-600 mt-1'>
          Manage your organization's general information and settings
        </p>
      </div>

      {/* Info Banner */}
      {!organization && (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='flex items-start'>
            <AlertCircle className='w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0' />
            <div>
              <h3 className='text-sm font-medium text-blue-900'>Create Your Organization</h3>
              <p className='text-sm text-blue-700 mt-1'>
                You haven't created an organization yet. Organizations allow you to manage projects, team members, and billing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className='card-wise p-6 space-y-6'>
        <div className='flex items-center space-x-3 pb-4 border-b border-wise-gray-200'>
          <Building2 className='w-6 h-6 text-wise-green-primary' />
          <h2 className='text-xl font-semibold text-wise-gray-900'>Organization Details</h2>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
              Organization Name *
            </label>
            <input
              type='text'
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className='input-wise'
              placeholder='Enter organization name'
              required
            />
            <p className='text-xs text-wise-gray-500 mt-1'>
              The display name for your organization
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
              Organization Slug *
            </label>
            <input
              type='text'
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              className='input-wise'
              placeholder='organization-slug'
              required
              disabled={!!organization}
            />
            <p className='text-xs text-wise-gray-500 mt-1'>
              {organization ? 'Slug cannot be changed after creation' : 'Used in URLs and API calls (lowercase letters, numbers, and hyphens only)'}
            </p>
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className='input-wise min-h-[100px] resize-y'
            placeholder='Enter a description for your organization'
          />
          <p className='text-xs text-wise-gray-500 mt-1'>
            A brief description of your organization's purpose or mission
          </p>
        </div>

        {organization && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-wise-gray-200'>
            <div>
              <p className='text-sm text-wise-gray-600'>Created</p>
              <p className='text-sm font-medium text-wise-gray-900 mt-1'>
                {new Date(organization.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className='text-sm text-wise-gray-600'>Last Updated</p>
              <p className='text-sm font-medium text-wise-gray-900 mt-1'>
                {new Date(organization.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}

        <div className='flex items-center justify-end pt-4 border-t border-wise-gray-200'>
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
                {organization ? 'Save Changes' : 'Create Organization'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
