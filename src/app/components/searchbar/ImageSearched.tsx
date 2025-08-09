import { Button } from '@/components/ui/button';
import { useProductStore } from '@/store/productStore';
import { Trash } from 'lucide-react';
import Image from 'next/image';

export default function ImageSearched() {
  const { searchImage, setSearchImage } = useProductStore();

  const cleanSearchImage = () => {
    setSearchImage('', null);
  };

  if (searchImage === null) return null;

  return (
    <Button
      className="relative flex items-center group w-auto h-auto m-2 rounded-md"
      variant="ghost"
      size="icon"
      onClick={cleanSearchImage}
    >
      <Image
        src={searchImage.src}
        alt="product-searching"
        width={48}
        height={48}
        className="h-12 w-auto object-contain rounded-md"
      />
      <div className="absolute inset-0 hidden group-hover:flex bg-gray-100/70 items-center justify-center">
        <Trash className="text-destructive" size={20} />
      </div>
    </Button>
  );
}
