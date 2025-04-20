import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  pagination: PaginationData;
  onPageChange: (newPage: number) => void;
}

export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  if (pagination.totalPages <= 1) return null;

  return (
    <CardFooter className="flex justify-between items-center">
      <div className="text-sm text-gray-500">
        Mostrando {((pagination.page - 1) * pagination.limit) + 1} -{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          <ChevronLeft size={16} />
        </Button>
        <span className="text-sm">
          Página {pagination.page} de {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </CardFooter>
  );
}