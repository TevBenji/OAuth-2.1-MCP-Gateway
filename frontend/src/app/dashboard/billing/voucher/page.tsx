'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  Gift,
  Plus,
  Tag,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Percent,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function VoucherPage() {
  const { user } = useUser();
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [applying, setApplying] = useState(false);

  const activeVouchers = useQuery(api.vouchers.getActiveVouchers, user?.id ? { clerkId: user.id } : 'skip');
  const voucherHistory = useQuery(api.vouchers.getVoucherHistory, user?.id ? { clerkId: user.id } : 'skip');
  const applyVoucherMutation = useMutation(api.vouchers.applyVoucher);

  const loading = activeVouchers === undefined || voucherHistory === undefined;

  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !voucherCode.trim()) return;

    try {
      setApplying(true);
      await applyVoucherMutation({
        clerkId: user.id,
        code: voucherCode.trim().toUpperCase(),
      });
      toast.success('Voucher applied successfully!');
      setVoucherCode('');
      setShowApplyForm(false);
    } catch (error) {
      console.error('Error applying voucher:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to apply voucher');
    } finally {
      setApplying(false);
    }
  };

  const getDiscountDisplay = (discountType: string, discountValue: number) => {
    if (discountType === 'PERCENTAGE') {
      return (
        <div className='flex items-center space-x-1 text-2xl font-bold text-wise-green-primary'>
          <Percent className='w-6 h-6' />
          <span>{discountValue}</span>
        </div>
      );
    } else {
      return (
        <div className='flex items-center space-x-1 text-2xl font-bold text-wise-green-primary'>
          <DollarSign className='w-5 h-5' />
          <span>{(discountValue / 100).toFixed(2)}</span>
        </div>
      );
    }
  };

  const totalSavings = voucherHistory?.reduce((sum, voucher) => {
    if (voucher.status === 'REDEEMED' && voucher.amountSaved) {
      return sum + voucher.amountSaved;
    }
    return sum;
  }, 0) || 0;

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading vouchers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-wise-gray-900'>Vouchers</h1>
          <p className='text-wise-gray-600 mt-1'>
            Apply discount codes and track your savings
          </p>
        </div>
        <button
          onClick={() => setShowApplyForm(!showApplyForm)}
          className='btn-wise-primary px-4 py-2 flex items-center mt-4 md:mt-0'
        >
          <Plus className='w-4 h-4 mr-2' />
          Apply Voucher
        </button>
      </div>

      {/* Total Savings Banner */}
      {totalSavings > 0 && (
        <div className='card-wise p-6 bg-gradient-to-r from-wise-green-50 to-wise-green-100/50'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='p-3 bg-wise-green-primary rounded-full'>
                <Sparkles className='w-8 h-8 text-white' />
              </div>
              <div>
                <h2 className='text-lg font-semibold text-wise-gray-900'>Total Savings</h2>
                <p className='text-sm text-wise-gray-600'>From all redeemed vouchers</p>
              </div>
            </div>
            <div className='text-right'>
              <div className='flex items-center space-x-1 text-3xl font-bold text-wise-green-primary'>
                <DollarSign className='w-8 h-8' />
                <span>{(totalSavings / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Voucher Form */}
      {showApplyForm && (
        <div className='card-wise p-6'>
          <form onSubmit={handleApplyVoucher} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
                Voucher Code
              </label>
              <input
                type='text'
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                className='input-wise'
                placeholder='Enter voucher code'
                required
              />
              <p className='text-xs text-wise-gray-500 mt-1'>
                Enter the voucher code you received
              </p>
            </div>

            <div className='flex items-center justify-end space-x-3'>
              <button
                type='button'
                onClick={() => {
                  setShowApplyForm(false);
                  setVoucherCode('');
                }}
                className='px-4 py-2 text-wise-gray-700 hover:bg-wise-gray-50 rounded-lg transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={applying || !voucherCode.trim()}
                className='btn-wise-primary px-6 py-2 flex items-center'
              >
                {applying ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Applying...
                  </>
                ) : (
                  <>
                    <Tag className='w-4 h-4 mr-2' />
                    Apply Voucher
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Vouchers */}
      {activeVouchers && activeVouchers.length > 0 && (
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold text-wise-gray-900'>Active Vouchers</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {activeVouchers.map((voucher) => (
              <div
                key={voucher._id}
                className='card-wise p-6 border-2 border-wise-green-200 bg-gradient-to-br from-white to-wise-green-50/30'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='p-2 bg-wise-green-primary rounded-lg'>
                      <Gift className='w-6 h-6 text-white' />
                    </div>
                    <div>
                      <h3 className='font-bold text-wise-gray-900 text-lg'>
                        {voucher.code}
                      </h3>
                      <p className='text-sm text-wise-gray-600'>
                        {voucher.description || 'Discount voucher'}
                      </p>
                    </div>
                  </div>
                  {getDiscountDisplay(voucher.discountType, voucher.discountValue)}
                </div>

                <div className='space-y-2'>
                  {voucher.expiresAt && (
                    <div className='flex items-center space-x-2 text-sm text-wise-gray-600'>
                      <Calendar className='w-4 h-4' />
                      <span>
                        Expires: {new Date(voucher.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {voucher.maxUses && (
                    <div className='flex items-center space-x-2 text-sm text-wise-gray-600'>
                      <Tag className='w-4 h-4' />
                      <span>
                        {voucher.currentUses || 0} of {voucher.maxUses} uses
                      </span>
                    </div>
                  )}
                  {voucher.minPurchase && (
                    <div className='flex items-center space-x-2 text-sm text-wise-gray-600'>
                      <DollarSign className='w-4 h-4' />
                      <span>
                        Minimum purchase: ${(voucher.minPurchase / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className='mt-4 pt-4 border-t border-wise-gray-200'>
                  <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700'>
                    <CheckCircle className='w-3 h-3 mr-1' />
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voucher History */}
      <div className='card-wise p-6'>
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-4'>Voucher History</h2>
        {voucherHistory && voucherHistory.length > 0 ? (
          <div className='space-y-3'>
            {voucherHistory.map((voucher) => (
              <div
                key={voucher._id}
                className='flex items-center justify-between p-4 bg-wise-gray-50 rounded-lg'
              >
                <div className='flex items-center space-x-4'>
                  <div className={`p-2 rounded-lg ${
                    voucher.status === 'REDEEMED' ? 'bg-green-100' :
                    voucher.status === 'EXPIRED' ? 'bg-gray-100' : 'bg-red-100'
                  }`}>
                    {voucher.status === 'REDEEMED' ? (
                      <CheckCircle className='w-5 h-5 text-green-600' />
                    ) : voucher.status === 'EXPIRED' ? (
                      <Clock className='w-5 h-5 text-gray-600' />
                    ) : (
                      <XCircle className='w-5 h-5 text-red-600' />
                    )}
                  </div>
                  <div>
                    <h3 className='font-semibold text-wise-gray-900'>{voucher.code}</h3>
                    <p className='text-sm text-wise-gray-600'>
                      {voucher.description || 'Discount voucher'}
                    </p>
                    {voucher.redeemedAt && (
                      <p className='text-xs text-wise-gray-500 mt-1'>
                        Redeemed on {new Date(voucher.redeemedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className='text-right'>
                  {voucher.status === 'REDEEMED' && voucher.amountSaved ? (
                    <>
                      <div className='flex items-center space-x-1 text-lg font-bold text-green-600'>
                        <DollarSign className='w-4 h-4' />
                        <span>{(voucher.amountSaved / 100).toFixed(2)}</span>
                      </div>
                      <p className='text-xs text-green-600'>Saved</p>
                    </>
                  ) : (
                    <span className={`text-sm font-medium ${
                      voucher.status === 'REDEEMED' ? 'text-green-600' :
                      voucher.status === 'EXPIRED' ? 'text-gray-600' : 'text-red-600'
                    }`}>
                      {voucher.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Gift}
            title='No voucher history'
            description='Your voucher redemption history will appear here'
          />
        )}
      </div>
    </div>
  );
}
