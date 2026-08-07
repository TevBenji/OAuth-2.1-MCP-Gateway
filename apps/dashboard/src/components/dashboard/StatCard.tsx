import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  /** Kept for API compatibility; the design system renders one uniform style. */
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'red';
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className='card-wise p-6'>
      <div className='flex items-center justify-between'>
        <span className='inline-flex h-9 w-9 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright'>
          <Icon className='h-[18px] w-[18px]' />
        </span>
        {trend && (
          <span
            className={`text-sm font-semibold ${
              trend.isPositive ? 'text-wise-green-700' : 'text-red-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div className='mt-4'>
        <p className='text-2xl font-extrabold tracking-tight text-wise-green-forest'>{value}</p>
        <p className='mt-1 text-xs font-semibold uppercase tracking-wider text-wise-gray-500'>
          {label}
        </p>
      </div>
    </div>
  );
}
