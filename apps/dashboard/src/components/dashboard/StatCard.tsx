import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'green' | 'blue' | 'purple' | 'orange' | 'red';
}

const colorClasses = {
  green: {
    icon: 'text-wise-green-primary',
    bg: 'bg-wise-green-50',
    trend: 'text-wise-green-primary',
  },
  blue: {
    icon: 'text-blue-600',
    bg: 'bg-blue-50',
    trend: 'text-blue-600',
  },
  purple: {
    icon: 'text-purple-600',
    bg: 'bg-purple-50',
    trend: 'text-purple-600',
  },
  orange: {
    icon: 'text-orange-600',
    bg: 'bg-orange-50',
    trend: 'text-orange-600',
  },
  red: {
    icon: 'text-red-600',
    bg: 'bg-red-50',
    trend: 'text-red-600',
  },
};

export function StatCard({ label, value, icon: Icon, trend, color = 'green' }: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div className='card-wise p-6'>
      <div className='flex items-center justify-between'>
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        {trend && (
          <div className='flex items-center space-x-1'>
            <span
              className={`text-sm font-medium ${
                trend.isPositive ? colors.trend : 'text-red-500'
              }`}
            >
              {trend.value}
            </span>
          </div>
        )}
      </div>
      <div className='mt-4'>
        <h3 className='text-2xl font-bold text-wise-gray-900'>{value}</h3>
        <p className='text-sm text-wise-gray-600 mt-1'>{label}</p>
      </div>
    </div>
  );
}
