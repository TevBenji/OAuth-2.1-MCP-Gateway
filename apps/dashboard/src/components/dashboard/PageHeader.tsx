import { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  /** Optional actions rendered to the right of the header. */
  children?: ReactNode;
}

/** Standard dashboard page header: eyebrow, extrabold forest title, gray description. */
export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
      <div>
        <p className='text-[13px] font-semibold uppercase tracking-[0.14em] text-wise-green-primary'>
          {eyebrow}
        </p>
        <h1 className='mt-1 text-2xl font-extrabold tracking-tight text-wise-green-forest sm:text-3xl'>
          {title}
        </h1>
        {description && <p className='mt-1 text-sm text-wise-gray-500'>{description}</p>}
      </div>
      {children && <div className='flex shrink-0 items-center gap-3'>{children}</div>}
    </div>
  );
}
