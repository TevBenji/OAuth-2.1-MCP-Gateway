import React, { useEffect, useState, useCallback, FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Props for the FormModal component.
 */
interface FormModalProps {
  /**
   * Whether the modal is open.
   */
  isOpen: boolean;
  /**
   * Function to call when the modal should be closed.
   */
  onClose: () => void;
  /**
   * The title of the modal.
   */
  title: string;
  /**
   * The content of the modal form.
   */
  children: React.ReactNode;
  /**
   * The size of the modal.
   * @default 'md'
   */
  size?: ModalSize;
  /**
   * Function to handle form submission.
   * Should return a promise that resolves when the submission is complete.
   */
  onSubmit: () => Promise<void>;
  /**
   * Whether the modal can be closed by clicking the backdrop or pressing Escape.
   * @default true
   */
  allowClose?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

/**
 * A generic modal wrapper for forms with submission and loading states.
 */
const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  onSubmit,
  allowClose = true,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEscKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && allowClose && !isSubmitting) {
      onClose();
    }
  }, [onClose, allowClose, isSubmitting]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, handleEscKey]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit();
      // Close modal on success
      onClose();
    } catch (error) {
      console.error("Form submission failed:", error);
      // Keep modal open on error so user can see the error and try again
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = () => {
    if (allowClose && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
    >
      <div
        className={`card-wise w-full bg-white rounded-lg shadow-xl transform transition-all duration-300 ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-wise-gray-200">
          <h2 id="form-modal-title" className="text-xl font-semibold text-wise-gray-900">
            {title}
          </h2>
          {allowClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close modal"
              className="p-1 rounded-full text-wise-gray-500 hover:bg-wise-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wise-green-primary disabled:opacity-50"
            >
              <X size={24} />
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">{children}</div>
          <div className="flex justify-end gap-3 p-6 bg-wise-gray-50 border-t border-wise-gray-200 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-wise-gray-700 hover:bg-wise-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-wise-primary px-6 py-2 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={18} />}
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;
