import { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  icon,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-wise-green-50 flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && (
              <p className="text-wise-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface SettingsItemProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsItem({
  title,
  description,
  children,
  className,
}: SettingsItemProps) {
  return (
    <div className={`py-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-base font-medium text-wise-gray-900">{title}</h4>
          {description && (
            <p className="text-sm text-wise-gray-600 mt-1">{description}</p>
          )}
        </div>
        <div className="flex-shrink-0 ml-4">{children}</div>
      </div>
    </div>
  );
}

interface SettingsGroupProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsGroup({
  title,
  description,
  children,
  className,
}: SettingsGroupProps) {
  return (
    <div className={className}>
      {title && (
        <div className="mb-4 pb-4 border-b border-wise-gray-200">
          <h3 className="text-lg font-medium text-wise-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-wise-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}
