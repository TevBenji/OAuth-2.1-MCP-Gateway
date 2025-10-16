import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className={`bg-white rounded-lg ${sizeClasses[size]} w-full p-6`}>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-xl font-semibold text-wise-gray-900'>{title}</h2>
          <button
            onClick={onClose}
            className='p-1 rounded hover:bg-wise-gray-100'
          >
            <X className='w-5 h-5 text-wise-gray-500' />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
