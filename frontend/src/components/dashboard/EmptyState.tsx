import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className='card-wise p-12 text-center'>
      <Icon className='w-12 h-12 text-wise-gray-400 mx-auto mb-4' />
      <h3 className='text-lg font-semibold text-wise-gray-900 mb-2'>{title}</h3>
      <p className='text-wise-gray-600 mb-6'>{description}</p>
      {action && (
        <button onClick={action.onClick} className='btn-wise-primary px-6 py-2 mx-auto'>
          {action.label}
        </button>
      )}
    </div>
  );
}
