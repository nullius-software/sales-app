"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useHeaderMenuStore } from "@/store/headerMenuStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useEffect } from "react";

export default function HeaderMenu({
  navigation,
}: {
  navigation: React.ReactNode;
}) {
  const { isSidebarOpen, toggleSidebar, setSidebarOpen } = useHeaderMenuStore();
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile, setSidebarOpen]);

  return (
    <div className="md:hidden">
      <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="mr-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[250px] p-0">
          <div className="sr-only">Navigation Menu</div>
          {navigation}
        </SheetContent>
      </Sheet>
    </div>
  );
}
