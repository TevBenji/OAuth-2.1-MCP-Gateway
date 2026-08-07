'use client';

import { useState } from 'react';
import { Key, RotateCcw, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
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
    <div className='space-y-6 max-w-3xl'>
      <div>
        <h1 className='text-3xl font-bold text-wise-gray-900'>API Keys</h1>
        <p className='text-wise-gray-600 mt-1'>
          Manage the gateway API key for the default tenant
        </p>
      </div>

      <div className='card-wise p-6 space-y-4'>
        <div className='flex items-center space-x-3'>
          <div className='w-10 h-10 rounded-lg bg-wise-green-50 flex items-center justify-center'>
            <Key className='w-5 h-5 text-wise-green-primary' />
          </div>
          <div>
            <h2 className='text-lg font-semibold text-wise-gray-900'>Tenant API Key</h2>
            <p className='text-sm text-wise-gray-600'>
              Used by services calling the gateway on behalf of this tenant.
            </p>
          </div>
        </div>

        <p className='text-sm text-wise-gray-600'>
          For security, the current key is never displayed. Rotating generates a new key and
          immediately invalidates the old one — the new key is shown exactly once below.
        </p>

        <button
          onClick={handleRotate}
          disabled={rotating}
          className='btn-wise-primary px-4 py-2 inline-flex items-center disabled:opacity-50'
        >
          <RotateCcw className={`w-4 h-4 mr-2 ${rotating ? 'animate-spin' : ''}`} />
          {rotating ? 'Rotating…' : 'Rotate API Key'}
        </button>

        {error && <p className='text-sm text-red-600'>{error}</p>}
      </div>

      {result && (
        <div className='card-wise p-6 space-y-4'>
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2'>
            <AlertTriangle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
            <p className='text-sm text-yellow-800'>
              <strong>Copy this key now.</strong> It will not be shown again after you leave this
              page. Rotated at {new Date(result.rotated_at).toLocaleString()}.
            </p>
          </div>
          <div className='bg-wise-gray-50 rounded-lg p-4 flex items-center justify-between gap-2'>
            <code className='text-sm font-mono text-wise-gray-900 break-all flex-1'>
              {result.api_key}
            </code>
            <button
              onClick={handleCopy}
              className='p-2 hover:bg-wise-gray-200 rounded-lg transition-colors flex-shrink-0'
              aria-label='Copy API key'
            >
              {copied ? (
                <CheckCircle className='w-5 h-5 text-green-600' />
              ) : (
                <Copy className='w-5 h-5 text-wise-gray-600' />
              )}
            </button>
          </div>
        </div>
      )}

      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3'>
        <AlertTriangle className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
        <div className='text-sm text-blue-800'>
          <p className='font-medium'>Security Best Practices</p>
          <ul className='mt-1 space-y-1 list-disc list-inside'>
            <li>Never commit API keys to version control</li>
            <li>Store keys in environment variables or a secrets manager</li>
            <li>Rotate keys regularly and after any suspected exposure</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
