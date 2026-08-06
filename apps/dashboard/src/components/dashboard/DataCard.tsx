import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Stat {
  label: string;
  value: string | number;
}

interface ActionButton {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
}

/**
 * Props for the DataCard component.
 */
interface DataCardProps {
  /**
   * The main title of the card.
   */
  title: string;
  /**
   * A subtitle or description shown below the title.
   */
  subtitle?: string;
  /**
   * An icon component (e.g., from lucide-react) to display in the card's header.
   */
  icon: React.ReactElement;
  /**
   * An array of stats to display in a grid.
   */
  stats?: Stat[];
  /**
   * An array of action buttons to display in the card's header.
   */
  actions?: ActionButton[];
  /**
   * Optional children to render in the main content area of the card.
   */
  children?: React.ReactNode;
  /**
   * Optional className for additional styling.
   */
  className?: string;
}

/**
 * A flexible card component for displaying data with stats and actions.
 */
const DataCard: React.FC<DataCardProps> = ({
  title,
  subtitle,
  icon,
  stats = [],
  actions = [],
  children,
  className = '',
}) => {
  const getButtonClass = (variant: ActionButton['variant'] = 'secondary') => {
    switch (variant) {
      case 'primary':
        return 'p-1.5 rounded hover:bg-wise-green-50 text-wise-green-primary';
      case 'destructive':
        return 'p-1.5 rounded hover:bg-red-50 text-red-500';
      default:
        return 'p-1.5 rounded hover:bg-wise-gray-50 text-wise-gray-500';
    }
  };

  return (
    <div className={`card-wise p-6 flex flex-col bg-white rounded-lg shadow-md transition-shadow duration-300 hover:shadow-lg ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-wise-green-50 flex items-center justify-center rounded-lg">
            {React.cloneElement(icon, {
              className: 'w-5 h-5 text-wise-green-primary'
            })}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-wise-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-wise-gray-600 mt-1 line-clamp-2">{subtitle}</p>}
          </div>
        </div>
        {actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={getButtonClass(action.variant)}
                aria-label={action.label}
                title={action.label}
              >
                <action.icon size={16} />
              </button>
            ))}
          </div>
        )}
      </div>

      {children && <div className="flex-grow mb-4">{children}</div>}

      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-wise-gray-200">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="flex items-center text-wise-gray-500">
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className="text-lg font-semibold text-wise-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataCard;
