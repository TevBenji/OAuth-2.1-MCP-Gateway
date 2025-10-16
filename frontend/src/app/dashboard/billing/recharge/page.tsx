'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  CreditCard,
  DollarSign,
  Zap,
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const RECHARGE_AMOUNTS = [
  { amount: 1000, label: '$10.00', bonus: 0 },
  { amount: 2500, label: '$25.00', bonus: 0 },
  { amount: 5000, label: '$50.00', bonus: 500, bonusLabel: '+$5 bonus' },
  { amount: 10000, label: '$100.00', bonus: 1500, bonusLabel: '+$15 bonus' },
  { amount: 25000, label: '$250.00', bonus: 5000, bonusLabel: '+$50 bonus' },
  { amount: 50000, label: '$500.00', bonus: 12500, bonusLabel: '+$125 bonus' },
];

export default function RechargePage() {
  const { user } = useUser();
  const [selectedAmount, setSelectedAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const billingInfo = useQuery(api.billing.getBillingInfo, user?.id ? { clerkId: user.id } : 'skip');
  const paymentHistory = useQuery(
    api.billing.getPaymentHistory,
    user?.id ? { clerkId: user.id, limit: 5 } : 'skip'
  );
  const createPaymentMutation = useMutation(api.billing.createPayment);

  const loading = billingInfo === undefined || paymentHistory === undefined;

  const handleRecharge = async () => {
    if (!user?.id) return;

    const amount = customAmount ? Math.round(parseFloat(customAmount) * 100) : selectedAmount;

    if (amount < 500) {
      toast.error('Minimum recharge amount is $5.00');
      return;
    }

    try {
      setProcessing(true);

      // In production, this would integrate with Stripe Payment Intents
      // For now, we'll create a payment record
      await createPaymentMutation({
        clerkId: user.id,
        amount,
        description: `Account recharge - $${(amount / 100).toFixed(2)}`,
        // In production, include: paymentMethodId, currency, etc.
      });

      toast.success('Payment processed successfully! Your balance has been updated.');
      setCustomAmount('');
      setSelectedAmount(5000);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const getSelectedBonus = () => {
    const preset = RECHARGE_AMOUNTS.find((a) => a.amount === selectedAmount);
    return preset?.bonus || 0;
  };

  const getTotalAmount = () => {
    const amount = customAmount ? Math.round(parseFloat(customAmount) * 100) : selectedAmount;
    const bonus = customAmount ? 0 : getSelectedBonus();
    return amount + bonus;
  };

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div className='w-12 h-12 border-4 border-wise-green-primary border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-wise-gray-600'>Loading recharge options...</p>
        </div>
      </div>
    );
  }

  const currentBalance = billingInfo?.balance || 0;

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-wise-gray-900'>Recharge Account</h1>
        <p className='text-wise-gray-600 mt-1'>
          Add credits to your account balance
        </p>
      </div>

      {/* Current Balance */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <StatCard
          label='Current Balance'
          value={`$${(currentBalance / 100).toFixed(2)}`}
          icon={Wallet}
          color='green'
        />
        <StatCard
          label='This Month Usage'
          value='$0.00'
          icon={TrendingUp}
          color='blue'
        />
        <StatCard
          label='Avg Monthly Spend'
          value='$0.00'
          icon={DollarSign}
          color='purple'
        />
      </div>

      {/* Recharge Form */}
      <div className='card-wise p-6'>
        <h2 className='text-lg font-semibold text-wise-gray-900 mb-6'>Select Amount</h2>

        {/* Preset Amounts */}
        <div className='grid grid-cols-2 md:grid-cols-3 gap-4 mb-6'>
          {RECHARGE_AMOUNTS.map((option) => (
            <button
              key={option.amount}
              onClick={() => {
                setSelectedAmount(option.amount);
                setCustomAmount('');
              }}
              className={`relative p-6 border-2 rounded-lg transition-all ${
                selectedAmount === option.amount && !customAmount
                  ? 'border-wise-green-primary bg-wise-green-50'
                  : 'border-wise-gray-200 hover:border-wise-gray-300'
              }`}
            >
              <div className='text-center'>
                <p className='text-2xl font-bold text-wise-gray-900'>{option.label}</p>
                {option.bonus > 0 && (
                  <p className='text-sm font-medium text-wise-green-primary mt-2'>
                    {option.bonusLabel}
                  </p>
                )}
              </div>
              {selectedAmount === option.amount && !customAmount && (
                <div className='absolute top-2 right-2'>
                  <CheckCircle className='w-5 h-5 text-wise-green-primary' />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <div className='mb-6'>
          <label className='block text-sm font-medium text-wise-gray-700 mb-2'>
            Or enter custom amount
          </label>
          <div className='relative'>
            <DollarSign className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-wise-gray-400' />
            <input
              type='number'
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className='input-wise pl-10'
              placeholder='0.00'
              min='5'
              step='0.01'
            />
          </div>
          <p className='text-xs text-wise-gray-500 mt-1'>
            Minimum recharge amount is $5.00. Custom amounts do not include bonuses.
          </p>
        </div>

        {/* Summary */}
        <div className='bg-wise-gray-50 rounded-lg p-6 mb-6'>
          <h3 className='font-semibold text-wise-gray-900 mb-4'>Recharge Summary</h3>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-wise-gray-600'>Recharge Amount</span>
              <span className='font-semibold text-wise-gray-900'>
                ${((customAmount ? Math.round(parseFloat(customAmount) * 100) : selectedAmount) / 100).toFixed(2)}
              </span>
            </div>
            {!customAmount && getSelectedBonus() > 0 && (
              <div className='flex items-center justify-between'>
                <span className='text-wise-gray-600'>Bonus</span>
                <span className='font-semibold text-wise-green-primary'>
                  +${(getSelectedBonus() / 100).toFixed(2)}
                </span>
              </div>
            )}
            <div className='border-t border-wise-gray-200 pt-3 flex items-center justify-between'>
              <span className='font-semibold text-wise-gray-900'>Total Credits</span>
              <span className='text-2xl font-bold text-wise-green-primary'>
                ${(getTotalAmount() / 100).toFixed(2)}
              </span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-wise-gray-600'>New Balance</span>
              <span className='font-semibold text-wise-gray-900'>
                ${((currentBalance + getTotalAmount()) / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className='mb-6'>
          <h3 className='font-semibold text-wise-gray-900 mb-3'>Payment Method</h3>
          {billingInfo?.paymentMethod ? (
            <div className='flex items-center space-x-4 p-4 bg-wise-gray-50 rounded-lg'>
              <CreditCard className='w-8 h-8 text-wise-gray-600' />
              <div>
                <p className='font-medium text-wise-gray-900'>{billingInfo.paymentMethod}</p>
                <p className='text-sm text-wise-gray-600'>Default payment method</p>
              </div>
            </div>
          ) : (
            <div className='bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start space-x-3'>
              <AlertCircle className='w-5 h-5 text-orange-500 mt-0.5' />
              <div>
                <p className='text-sm text-orange-700'>
                  No payment method on file. Please add a payment method in{' '}
                  <a href='/dashboard/billing/details' className='underline font-medium'>
                    Billing Details
                  </a>
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleRecharge}
          disabled={processing || !billingInfo?.paymentMethod || (!selectedAmount && !customAmount)}
          className='w-full btn-wise-primary py-3 flex items-center justify-center'
        >
          {processing ? (
            <>
              <Loader2 className='w-5 h-5 mr-2 animate-spin' />
              Processing Payment...
            </>
          ) : (
            <>
              <Zap className='w-5 h-5 mr-2' />
              Recharge ${(getTotalAmount() / 100).toFixed(2)}
            </>
          )}
        </button>
      </div>

      {/* Recent Recharges */}
      {paymentHistory && paymentHistory.length > 0 && (
        <div className='card-wise p-6'>
          <h2 className='text-lg font-semibold text-wise-gray-900 mb-4'>Recent Recharges</h2>
          <div className='space-y-3'>
            {paymentHistory.map((payment) => (
              <div
                key={payment._id}
                className='flex items-center justify-between p-4 bg-wise-gray-50 rounded-lg'
              >
                <div className='flex items-center space-x-4'>
                  <div className={`p-2 rounded-lg ${
                    payment.status === 'SUCCEEDED' ? 'bg-green-100' :
                    payment.status === 'FAILED' ? 'bg-red-100' : 'bg-orange-100'
                  }`}>
                    {payment.status === 'SUCCEEDED' ? (
                      <CheckCircle className='w-5 h-5 text-green-600' />
                    ) : payment.status === 'FAILED' ? (
                      <AlertCircle className='w-5 h-5 text-red-600' />
                    ) : (
                      <Clock className='w-5 h-5 text-orange-600' />
                    )}
                  </div>
                  <div>
                    <p className='font-medium text-wise-gray-900'>
                      {payment.description || 'Account recharge'}
                    </p>
                    <p className='text-sm text-wise-gray-600'>
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='font-semibold text-wise-gray-900'>
                    ${(payment.amount / 100).toFixed(2)}
                  </p>
                  <p className={`text-sm ${
                    payment.status === 'SUCCEEDED' ? 'text-green-600' :
                    payment.status === 'FAILED' ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
