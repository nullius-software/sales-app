'use client';

import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Navigation from './Navigation';

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
  closeMobileMenu: () => void;
}

export function Header({ isSidebarOpen, setIsSidebarOpen, isMobile, closeMobileMenu }: HeaderProps) {
  return (
    <header className="border-b py-4 px-6 flex justify-between items-center sticky top-0 bg-white z-10">
      <div className="flex items-center">
        {isMobile && (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] p-0">
              <div className="sr-only">Navigation Menu</div>
              <Navigation closeMobileMenu={closeMobileMenu} />
            </SheetContent>
          </Sheet>
        )}
        <h1 className="text-xl font-bold">Nullius Ventas</h1>
      </div>
    </header>
  );
}