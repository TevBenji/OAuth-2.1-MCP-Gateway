'use client';

import { useState } from 'react';
import { Key, RotateCcw, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { rotateApiKey } from './actions';

export default function ApiKeysPage() {
  const [rotating, setRotating] = useState(false);
  const [result, setResult] = useState<{ api_key: string; rotated_at: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRotate = async () => {
    if (
      !confirm(
        'Rotate the gateway API key? The previous key stops working immediately and any integrations using it must be updated.'
      )
    ) {
      return;
    }
    setRotating(true);
    setError(null);
    try {
      const res = await rotateApiKey();
      setResult(res);
      setCopied(false);
    } catch {
      setError('Failed to rotate API key. Is the gateway reachable?');
    } finally {
      setRotating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='max-w-3xl space-y-6'>
      <PageHeader
        eyebrow='Access'
        title='API Keys'
        description='Manage the gateway API key for the default tenant'
      />

      <div className='card-wise space-y-4 p-6'>
        <div className='flex items-center gap-3'>
          <span className='inline-flex h-9 w-9 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright'>
            <Key className='h-[18px] w-[18px]' />
          </span>
          <div>
            <h2 className='text-lg font-bold tracking-tight text-wise-green-forest'>
              Tenant API Key
            </h2>
            <p className='text-sm text-wise-gray-500'>
              Used by services calling the gateway on behalf of this tenant.
            </p>
          </div>
        </div>

        <p className='text-sm text-wise-gray-500'>
          For security, the current key is never displayed. Rotating generates a new key and
          immediately invalidates the old one — the new key is shown exactly once below.
        </p>

        <button
          onClick={handleRotate}
          disabled={rotating}
          className='btn-wise-primary inline-flex h-10 items-center px-4 disabled:opacity-50'
        >
          <RotateCcw className={`w-4 h-4 mr-2 ${rotating ? 'animate-spin' : ''}`} />
          {rotating ? 'Rotating…' : 'Rotate API Key'}
        </button>

        {error && <p className='text-sm text-red-600'>{error}</p>}
      </div>

      {result && (
        <div className='card-wise space-y-4 p-6'>
          <div className='flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4'>
            <AlertTriangle className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600' />
            <p className='text-sm text-amber-800'>
              <strong>Copy this key now.</strong> It will not be shown again after you leave this
              page. Rotated at {new Date(result.rotated_at).toLocaleString()}.
            </p>
          </div>
          <div className='flex items-center justify-between gap-2 rounded-lg border border-wise-gray-200 bg-wise-gray-50 p-4'>
            <code className='flex-1 break-all font-mono text-sm text-wise-gray-900'>
              {result.api_key}
            </code>
            <button
              onClick={handleCopy}
              className='flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-wise-gray-200'
              aria-label='Copy API key'
            >
              {copied ? (
                <CheckCircle className='h-5 w-5 text-wise-green-primary' />
              ) : (
                <Copy className='h-5 w-5 text-wise-gray-600' />
              )}
            </button>
          </div>
        </div>
      )}

      <div className='flex items-start gap-3 rounded-xl border border-wise-green-primary/30 bg-wise-green-50 p-4'>
        <AlertTriangle className='mt-0.5 h-5 w-5 flex-shrink-0 text-wise-green-700' />
        <div className='text-sm text-wise-gray-700'>
          <p className='font-bold text-wise-green-forest'>Security Best Practices</p>
          <ul className='mt-1 list-inside list-disc space-y-1'>
            <li>Never commit API keys to version control</li>
            <li>Store keys in environment variables or a secrets manager</li>
            <li>Rotate keys regularly and after any suspected exposure</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
