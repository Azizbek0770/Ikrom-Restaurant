import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const Spinner = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center">
      <Loader2 className={cn('animate-spin text-primary-600', sizes[size], className)} />
    </div>
  );
};

export default Spinner;