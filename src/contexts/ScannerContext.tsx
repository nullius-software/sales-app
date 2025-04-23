// ScannerContext.tsx
'use client';

import BarcodeScanner from '@/app/components/BarcodeScanner';
import { createContext, useContext, useState, useCallback } from 'react';

interface ScannerContextType {
  isScannerOpen: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  setOnScanCallback: (callback: (barcode: string) => void) => void;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export function ScannerProvider({ children }: { children: React.ReactNode }) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [onScanCallback, setOnScanCallback] = useState<((barcode: string) => void) | null>(null);

  const openScanner = useCallback(() => {
    setIsScannerOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsScannerOpen(false);
  }, []);

  const handleScan = useCallback(
    (barcode: string) => {
      if (onScanCallback) {
        onScanCallback(barcode);
      }
    },
    [onScanCallback]
  );

  return (
    <ScannerContext.Provider
      value={{
        isScannerOpen,
        openScanner,
        closeScanner,
        setOnScanCallback,
      }}
    >
      {children}
      {isScannerOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.5)', // Fondo semitransparente
          }}
        >
          <BarcodeScanner onScan={handleScan} />
        </div>
      )}
    </ScannerContext.Provider>
  );
}

export function useScanner() {
  const context = useContext(ScannerContext);
  if (!context) {
    throw new Error('useScanner must be used within a ScannerProvider');
  }
  return context;
}