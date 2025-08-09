'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  CameraDevice,
  Html5QrcodeSupportedFormats,
} from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Camera, AlertTriangle, Scan } from 'lucide-react';
import { memo } from 'react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  className?: string;
}

const readerId = 'barcode-reader';
type ScanMode = 'physical' | 'camera';

function BarcodeScanner({ onScan, className }: BarcodeScannerProps) {
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const [scanMode, setScanMode] = useState<ScanMode>('physical');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const lastScanTimeRef = useRef(0);
  const SCAN_COOLDOWN_MS = 3000;

  const startScanner = useCallback(async (cameraId: string) => {
    if (!scannerRef.current) {
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
      ];
      scannerRef.current = new Html5Qrcode(readerId, {
        formatsToSupport,
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      });
    }
    if (scannerRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
      try {
        await scannerRef.current.stop();
      } catch {}
    }
    setIsScanning(false);
    setError(null);

    try {
      await scannerRef.current.start(
        { deviceId: { exact: cameraId } },
        {
          fps: 10,
          qrbox: { width: 200, height: 200 },
          aspectRatio: 1.777,
          disableFlip: false,
        },
        (decodedText) => {
          const now = Date.now();
          if (now - lastScanTimeRef.current > SCAN_COOLDOWN_MS) {
            setIsScanning(true);
            onScanRef.current(decodedText);
            lastScanTimeRef.current = now;
          }
        },
        (errorMessage) => {
          if (
            !errorMessage.includes(
              'No MultiFormat Readers were able to detect the code'
            )
          ) {
            console.warn('Scan error:', errorMessage);
          }
        }
      );
      setIsScanning(true);
    } catch {
      setError(
        'No se pudo iniciar el escáner con esta cámara. Intenta otra cámara o verifica los permisos.'
      );
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    if (scanMode !== 'camera') return;

    setIsLoading(true);
    setError(null);

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices.length === 0) {
          setError(
            'No se encontraron cámaras disponibles. Conecta una cámara o verifica los permisos.'
          );
          return;
        }
        setCameras(devices);
        const rear = devices.find((d) => /back|rear/i.test(d.label));
        setSelectedCameraId(rear ? rear.id : devices[0].id);
      })
      .catch(() => {
        setError(
          'No se pudieron obtener las cámaras. Verifica los permisos de la cámara.'
        );
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          });
      }
    };
  }, [scanMode]);

  useEffect(() => {
    if (scanMode === 'camera' && selectedCameraId && !error) {
      startScanner(selectedCameraId);
    }
  }, [scanMode, selectedCameraId, error, startScanner]);

  const inputBuffer = useRef<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (scanMode !== 'physical') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (inputBuffer.current.length > 0) {
          e.preventDefault();
          onScanRef.current(inputBuffer.current.join(''));
          inputBuffer.current = [];
        }
        return;
      }

      // Ignore control keys, function keys, etc.
      if (e.key.length > 1) return;

      inputBuffer.current.push(e.key);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        inputBuffer.current = [];
      }, 100); // Increased timeout to 100ms for better reliability
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [scanMode]);

  if (scanMode === 'physical') {
    return (
      <div
        className={`${className} flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg h-64`}
      >
        <Scan size={48} className="text-gray-400 mb-4" />
        <p className="text-center text-gray-600 mb-4">
          Escanea el producto con tu escaner
        </p>
        <Button variant="outline" onClick={() => setScanMode('camera')}>
          <Camera className="mr-2 h-4 w-4" />
          Prefiero escanear con la cámara
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {cameras.length > 1 && (
          <Select
            value={selectedCameraId ?? ''}
            onValueChange={setSelectedCameraId}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full bg-white border-gray-300">
              <SelectValue placeholder="Selecciona una cámara" />
            </SelectTrigger>
            <SelectContent>
              {cameras.map((cam) => (
                <SelectItem key={cam.id} value={cam.id}>
                  {cam.label || `Cámara ${cam.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Cargando cámaras...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
              <AlertTriangle className="w-8 h-8 mb-2" />
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setError(null);
                  if (selectedCameraId) startScanner(selectedCameraId);
                }}
              >
                Reintentar
              </Button>
            </div>
          ) : (
            <div id={readerId} className="w-full h-full" />
          )}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-dashed border-green-500 rounded-lg" />
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Camera className="w-4 h-4" />
          <span>
            {isScanning
              ? 'Escaneando...'
              : error
                ? 'Error en el escáner'
                : 'Cámara lista'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(BarcodeScanner);
