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
      <span className='mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-wise-green-forest text-wise-green-bright'>
        <Icon className='h-6 w-6' />
      </span>
      <h3 className='mb-2 text-lg font-bold tracking-tight text-wise-green-forest'>{title}</h3>
      <p className='mx-auto mb-6 max-w-md text-sm text-wise-gray-500'>{description}</p>
      {action && (
        <button onClick={action.onClick} className='btn-wise-primary mx-auto h-10 px-6'>
          {action.label}
        </button>
      )}
    </div>
  );
}
