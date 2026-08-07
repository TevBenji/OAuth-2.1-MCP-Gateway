'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ClientRegistrationStepProps {
  onNext: (data: ClientData) => void;
  onBack: () => void;
}

export interface ClientData {
  name: string;
  redirectUris: string[];
  description?: string;
  applicationType: 'web' | 'native' | 'spa';
}

export function ClientRegistrationStep({ onNext, onBack }: ClientRegistrationStepProps) {
  const [formData, setFormData] = useState<ClientData>({
    name: '',
    redirectUris: [''],
    description: '',
    applicationType: 'web',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }

    const validUris = formData.redirectUris.filter((uri) => uri.trim());
    if (validUris.length === 0) {
      newErrors.redirectUris = 'At least one redirect URI is required';
    } else {
      // Validate URI format
      validUris.forEach((uri, index) => {
        try {
          new URL(uri);
          // Additional validation for localhost in production
          if (uri.includes('localhost') && formData.applicationType === 'web') {
            newErrors[`uri_${index}`] = 'Localhost URIs should only be used in development';
          }
        } catch {
          newErrors[`uri_${index}`] = 'Invalid URI format';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext({
        ...formData,
        redirectUris: formData.redirectUris.filter((uri) => uri.trim()),
      });
    }
  };

  const addRedirectUri = () => {
    setFormData({
      ...formData,
      redirectUris: [...formData.redirectUris, ''],
    });
  };

  const removeRedirectUri = (index: number) => {
    setFormData({
      ...formData,
      redirectUris: formData.redirectUris.filter((_, i) => i !== index),
    });
  };

  const updateRedirectUri = (index: number, value: string) => {
    const newUris = [...formData.redirectUris];
    newUris[index] = value;
    setFormData({ ...formData, redirectUris: newUris });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto"
    >
      <Card variant="elevated" padding="lg">
        <CardHeader>
          <CardTitle className="text-3xl">Register Your Client Application</CardTitle>
          <CardDescription className="text-base">
            Provide details about your application to generate OAuth 2.1 credentials.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Name */}
            <div>
              <label
                htmlFor="client-name"
                className="mb-2 block text-sm font-medium text-wise-gray-700"
              >
                Application Name <span className="text-red-500">*</span>
              </label>
              <input
                id="client-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={cn('input-wise', errors.name && 'border-red-500')}
                placeholder="My Awesome App"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Application Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-wise-gray-700">
                Application Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'web', label: 'Web Application', desc: 'Server-side app' },
                  { value: 'spa', label: 'Single Page App', desc: 'Browser-based' },
                  { value: 'native', label: 'Native/Mobile', desc: 'Desktop or mobile' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        applicationType: type.value as ClientData['applicationType'],
                      })
                    }
                    className={cn(
                      'rounded-xl border p-4 text-left transition-all',
                      formData.applicationType === type.value
                        ? 'border-wise-green-primary/50 bg-wise-green-50 ring-1 ring-wise-green-primary/30'
                        : 'border-wise-gray-200 hover:border-wise-gray-300'
                    )}
                  >
                    <div className="text-sm font-bold text-wise-green-forest">{type.label}</div>
                    <div className="mt-1 text-xs text-wise-gray-500">
                      {type.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Redirect URIs */}
            <div>
              <label className="mb-2 block text-sm font-medium text-wise-gray-700">
                Redirect URIs <span className="text-red-500">*</span>
              </label>
              <p className="mb-3 text-sm text-wise-gray-500">
                Where should users be redirected after authentication?
              </p>
              <div className="space-y-3">
                {formData.redirectUris.map((uri, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="flex-1">
                      <input
                        type="url"
                        value={uri}
                        onChange={(e) => updateRedirectUri(index, e.target.value)}
                        className={cn('input-wise', errors[`uri_${index}`] && 'border-red-500')}
                        placeholder="https://example.com/callback"
                        aria-invalid={!!errors[`uri_${index}`]}
                        aria-describedby={errors[`uri_${index}`] ? `uri-error-${index}` : undefined}
                      />
                      {errors[`uri_${index}`] && (
                        <p
                          id={`uri-error-${index}`}
                          className="mt-1 text-sm text-red-600 flex items-center"
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors[`uri_${index}`]}
                        </p>
                      )}
                    </div>
                    {formData.redirectUris.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRedirectUri(index)}
                        className="mt-0.5"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRedirectUri}
                className="mt-3"
              >
                + Add Another URI
              </Button>
              {errors.redirectUris && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.redirectUris}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-wise-gray-700"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="input-wise"
                placeholder="A brief description of your application..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onBack} icon={<ArrowLeft />}>
                Back
              </Button>
              <Button type="submit" icon={<ArrowRight />} iconPosition="right">
                Continue
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
