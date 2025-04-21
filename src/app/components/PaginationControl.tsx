'use client';

import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils'; 

interface PaginationControlsProps {
  pagination: PaginationData;
  onPageChange: (newPage: number) => void;
  className?: string;
  showRangeText?: boolean;
  rangeTextPrefix?: string; 
}

export function PaginationControls({
  pagination,
  onPageChange,
  className,
  showRangeText = true,
  rangeTextPrefix = '',
}: PaginationControlsProps) {
  if (pagination.totalPages <= 1) return null;

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <CardFooter
      className={cn(
        'flex flex-col sm:flex-row justify-between items-center py-3 px-4 bg-gray-50 border-t border-gray-200',
        className
      )}
    >
      {showRangeText && (
        <div className="text-sm text-gray-600 mb-2 sm:mb-0">
          {rangeTextPrefix} {startItem} - {endItem} de {pagination.total}
        </div>
      )}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className={cn(
            'h-8 w-8 p-0 rounded-full border-gray-300',
            pagination.page <= 1
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-gray-100 hover:border-gray-400'
          )}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </Button>
        <span
          className="text-sm font-medium text-gray-700"
          aria-live="polite"
          aria-label={`Página actual ${pagination.page} de ${pagination.totalPages}`}
        >
          Página {pagination.page} de {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          className={cn(
            'h-8 w-8 p-0 rounded-full border-gray-300',
            pagination.page >= pagination.totalPages
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-gray-100 hover:border-gray-400'
          )}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </CardFooter>
  );
}