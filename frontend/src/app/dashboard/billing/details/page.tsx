'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Modal } from '@/components/dashboard/Modal';
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  Building,
  Globe,
  MapPin,
  User,
  Mail,
  Phone,
  Save,
  Loader2,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BillingDetailsPage() {
  const { user } = useUser();
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Billing info form state
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');
  const [taxId, setTaxId] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [billingPhone, setBillingPhone] = useState('');

  const billingInfo = useQuery(api.billing.getBillingInfo, user?.id ? { clerkId: user.id } : 'skip');
  const updateBillingInfoMutation = useMutation(api.billing.updateBillingInfo);

  const loading = billingInfo === undefined;

  // Initialize form with existing data
  useState(() => {
    if (billingInfo) {
      setCompanyName(billingInfo.companyName || '');
      setAddress(billingInfo.address || '');
      setCity(billingInfo.city || '');
      setState(billingInfo.state || '');
      setPostalCode(billingInfo.postalCode || '');
      setCountry(billingInfo.country || 'US');
      setTaxId(billingInfo.taxId || '');
      setBillingEmail(billingInfo.billingEmail || '');
      setBillingPhone(billingInfo.billingPhone || '');
    }
  });

  const handleSaveBillingInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setSaving(true);
      await updateBillingInfoMutation({
        clerkId: user.id,
        companyName,
        address,
        city,
        state,
        postalCode,
        country,
        taxId,
        billingEmail,
        billingPhone,
      });
      toast.success('Billing information updated successfully');
    } catch (error) {
      console.error('Error updating billing info:', error);
      toast.error('Failed to update billing information');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPaymentMethod = () => {
    // In production, this would open Stripe Elements modal
    toast.info('Stripe payment method integration would be initialized here');
    setShowAddCardModal(false);
  };

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading billing details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-wise-gray-900'>Billing Details</h1>
        <p className='text-wise-gray-600 mt-1'>
          Manage your payment methods and billing information
        </p>
      </div>

      {/* Payment Methods */}
      <div className='card-wise p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-lg font-semibold text-wise-gray-900'>Payment Methods</h2>
          <button
            onClick={() => setShowAddCardModal(true)}
            className='btn-wise-primary px-4 py-2 flex items-center'
          >
            <Plus className='w-4 h-4 mr-2' />
            Add Payment Method
          </button>
        </div>

        {billingInfo?.paymentMethod ? (
          <div className='space-y-3'>
            <div className='flex items-center justify-between p-4 bg-wise-gray-50 rounded-lg'>
              <div className='flex items-center space-x-4'>
                <div className='p-3 bg-wise-green-100 rounded-lg'>
                  <CreditCard className='w-6 h-6 text-wise-green-primary' />
                </div>
                <div>
                  <div className='flex items-center space-x-2 mb-1'>
                    <p className='font-semibold text-wise-gray-900'>
                      {billingInfo.paymentMethod}
                    </p>
                    <span className='px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center space-x-1'>
                      <CheckCircle className='w-3 h-3' />
                      <span>Default</span>
                    </span>
                  </div>
                  <p className='text-sm text-wise-gray-600'>Primary payment method</p>
                </div>
              </div>
              <button className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'>
                <Trash2 className='w-5 h-5' />
              </button>
            </div>
          </div>
        ) : (
          <div className='text-center py-8 bg-wise-gray-50 rounded-lg'>
            <CreditCard className='w-12 h-12 text-wise-gray-400 mx-auto mb-3' />
            <p className='text-wise-gray-600 mb-4'>No payment methods on file</p>
            <button
              onClick={() => setShowAddCardModal(true)}
              className='btn-wise-primary px-6 py-2 inline-flex items-center'
            >
              <Plus className='w-4 h-4 mr-2' />
              Add Payment Method
            </button>
          </div>
        )}
      </div>

      {/* Billing Information Form */}
      <div className='card-wise p-6'>
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-6'>Billing Information</h2>

        <form onSubmit={handleSaveBillingInfo} className='space-y-6'>
          {/* Company Information */}
          <div className='space-y-4'>
            <h3 className='font-medium text-wise-gray-900 flex items-center space-x-2'>
              <Building className='w-5 h-5 text-wise-gray-400' />
              <span>Company Information</span>
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                  Company Name
                </label>
                <input
                  type='text'
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className='input-wise'
                  placeholder='Your Company Inc.'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                  Tax ID / VAT Number
                </label>
                <input
                  type='text'
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className='input-wise'
                  placeholder='12-3456789'
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className='space-y-4'>
            <h3 className='font-medium text-wise-gray-900 flex items-center space-x-2'>
              <MapPin className='w-5 h-5 text-wise-gray-400' />
              <span>Billing Address</span>
            </h3>

            <div>
              <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                Street Address
              </label>
              <input
                type='text'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className='input-wise'
                placeholder='123 Main Street'
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                  City
                </label>
                <input
                  type='text'
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className='input-wise'
                  placeholder='San Francisco'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                  State / Province
                </label>
                <input
                  type='text'
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className='input-wise'
                  placeholder='CA'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                  Postal Code
                </label>
                <input
                  type='text'
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className='input-wise'
                  placeholder='94105'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className='input-wise'
              >
                <option value='US'>United States</option>
                <option value='CA'>Canada</option>
                <option value='GB'>United Kingdom</option>
                <option value='AU'>Australia</option>
                <option value='DE'>Germany</option>
                <option value='FR'>France</option>
                <option value='ES'>Spain</option>
                <option value='IT'>Italy</option>
                <option value='NL'>Netherlands</option>
                <option value='SE'>Sweden</option>
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <div className='space-y-4'>
            <h3 className='font-medium text-wise-gray-900 flex items-center space-x-2'>
              <User className='w-5 h-5 text-wise-gray-400' />
              <span>Billing Contact</span>
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                  <Mail className='w-4 h-4 inline mr-1' />
                  Billing Email
                </label>
                <input
                  type='email'
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  className='input-wise'
                  placeholder='billing@company.com'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                  <Phone className='w-4 h-4 inline mr-1' />
                  Phone Number
                </label>
                <input
                  type='tel'
                  value={billingPhone}
                  onChange={(e) => setBillingPhone(e.target.value)}
                  className='input-wise'
                  placeholder='+1 (555) 123-4567'
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
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
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Notice */}
      <div className='card-wise p-6 bg-blue-50 border-2 border-blue-200'>
        <div className='flex items-start space-x-3'>
          <Shield className='w-6 h-6 text-blue-600 mt-0.5' />
          <div>
            <h3 className='font-semibold text-blue-900 mb-2'>Secure Payment Processing</h3>
            <p className='text-sm text-blue-700'>
              All payment information is encrypted and processed securely through Stripe.
              We never store your complete card details on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      <Modal
        isOpen={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        title='Add Payment Method'
      >
        <div className='space-y-4'>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <p className='text-sm text-blue-700'>
              In production, this would load Stripe Elements for secure card input.
            </p>
          </div>

          <div className='space-y-3'>
            <input
              type='text'
              placeholder='Card Number'
              className='input-wise'
              disabled
            />
            <div className='grid grid-cols-2 gap-3'>
              <input
                type='text'
                placeholder='MM/YY'
                className='input-wise'
                disabled
              />
              <input
                type='text'
                placeholder='CVC'
                className='input-wise'
                disabled
              />
            </div>
            <input
              type='text'
              placeholder='Cardholder Name'
              className='input-wise'
              disabled
            />
          </div>

          <div className='flex items-center justify-end space-x-3 pt-4'>
            <button
              onClick={() => setShowAddCardModal(false)}
              className='px-4 py-2 text-wise-gray-700 hover:bg-wise-gray-50 rounded-lg transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleAddPaymentMethod}
              className='btn-wise-primary px-6 py-2 flex items-center'
            >
              <CreditCard className='w-4 h-4 mr-2' />
              Add Card
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
