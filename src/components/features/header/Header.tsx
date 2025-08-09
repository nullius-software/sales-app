'use server';

import Navigation from '@/components/features/navigation/Navigation';
import HeaderMenu from './HeaderMenu';

export default async function Header() {
  const navigation = <Navigation />
  return (
    <header className="border-b py-4 px-6 flex justify-between items-center sticky top-0 bg-white z-10">
      <div className="flex items-center">
        <HeaderMenu navigation={navigation} />
        <h1 className="text-xl font-bold">Nullius Ventas</h1>
      </div>
    </header>
  );
}