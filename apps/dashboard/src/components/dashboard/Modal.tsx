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
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-wise-green-forest/40 p-4 backdrop-blur-sm'>
      <div className={`rounded-xl border border-wise-gray-200 bg-white ${sizeClasses[size]} w-full p-6`}>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-extrabold tracking-tight text-wise-green-forest'>{title}</h2>
          <button
            onClick={onClose}
            className='rounded-lg p-1.5 text-wise-gray-400 transition-colors hover:bg-wise-gray-100 hover:text-wise-green-forest'
            aria-label='Close'
          >
            <X className='h-5 w-5' />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
