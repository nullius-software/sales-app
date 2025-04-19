'use client';

import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scannerInstance, setScannerInstance] = useState<Html5QrcodeScanner | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const initializeScanner = async () => {
    setIsInitializing(true);
    setScannerError(null);

    // Check available cameras
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    console.log('Available video devices for scanner:', videoDevices);

    if (videoDevices.length === 0) {
      setScannerError('No se encontró ninguna cámara');
      setIsInitializing(false);
      return;
    }

    try {
      const scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        /* verbose= */ false
      );

      setScannerInstance(scanner);

      scanner.render(
        (decodedText) => {
          const audio = new Audio('/sounds/beep.mp3');
          audio.play().catch(e => console.log('Audio play error:', e));
          onScan(decodedText);
          toast.success('Código escaneado');
        },
        (error: unknown) => {
          const errorMessage = typeof error === 'string'
            ? error
            : error && typeof error === 'object' && 'message' in error
              ? String(error.message)
              : 'Error desconocido';
          
          console.error('Scanner error:', errorMessage);
          if (errorMessage.includes('Camera access') || errorMessage.includes('permission')) {
            setScannerError('No se puede acceder a la cámara. Verifica los permisos.');
          } else {
            setScannerError(errorMessage);
          }
        }
      );
    } catch (error) {
      console.error('Error initializing scanner:', error);
      setScannerError('Error al inicializar el escáner');
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    // Delay initialization slightly to ensure camera is ready
    const timeout = setTimeout(() => {
      initializeScanner();
    }, 500);

    return () => {
      clearTimeout(timeout);
      if (scannerInstance) {
        scannerInstance.clear().catch(e => console.error('Error clearing scanner:', e));
      }
    };
  }, []);

  const retryScanner = () => {
    if (scannerInstance) {
      scannerInstance.clear().catch(e => console.error('Error clearing scanner:', e));
      setScannerInstance(null);
    }
    initializeScanner();
  };

  if (scannerError) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>Error en el escáner: {scannerError}</p>
        <p className="mt-2 text-sm">Verifica los permisos de la cámara o intenta de nuevo.</p>
        <Button
          variant="outline"
          className="w-full mt-4 flex items-center justify-center"
          onClick={retryScanner}
          disabled={isInitializing}
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
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