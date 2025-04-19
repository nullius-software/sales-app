'use client';

import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [scannerError, setScannerError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: Html5QrcodeScanner;

    try {
      scanner = new Html5QrcodeScanner(
        'reader',
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          // Success handler - no changes needed here
          const audio = new Audio('/sounds/beep.mp3');
          audio.play().catch(e => console.log('Audio play error:', e));
          onScan(decodedText);
          toast.success('Código escaneado');
        },
        (error: unknown) => {  // Explicitly type as 'unknown' instead of letting TypeScript infer it
          // Now properly handle the unknown type
          const errorMessage = typeof error === 'string' 
            ? error 
            : error && typeof error === 'object' && 'message' in error
              ? String(error.message)
              : 'Error desconocido';
              
          if (errorMessage.includes('Camera access') || 
              errorMessage.includes('permission')) {
            setScannerError(errorMessage);
            console.error('Scanner error:', error);
          }
        }
      );
    } catch (error) {
      console.error('Error initializing scanner:', error);
      setScannerError('Error al inicializar el escáner');
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error('Error clearing scanner:', e));
      }
    };
  }, [onScan]);

  if (scannerError) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>Error en el escáner: {scannerError}</p>
        <p className="mt-2 text-sm">Intenta recargar la página o verificar los permisos de la cámara.</p>
      </div>
    );
  }

  return (
    <div>
      <div id="reader" className="w-full" />
      <p className="text-sm text-gray-500 mt-2 text-center">
        Posicioná el código de barras en el recuadro para escanearlo
      </p>
    </div>
  );
}