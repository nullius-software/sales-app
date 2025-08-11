'use server';

import { ProductList } from '../components/home/ProductList';
import { SelectedProducts } from '../components/home/SelectedProducts';

export default async function Home() {
  return (
    <div className="lg:p-6 flex-1 flex flex-col">
      <div className="flex flex-col xl:flex-row xl:gap-4">
        <div className="xl:flex-7/12">
          <ProductList />
        </div>
        <div className="sticky bottom-2 left-0 right-0 mx-auto my-2  w-11/12 xl:w-full xl:flex-5/12 min-w-80 z-20 h-min">
          <SelectedProducts />
        </div>
      </div>
    </div>
  );
}
