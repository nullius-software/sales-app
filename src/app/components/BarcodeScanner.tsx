'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, CameraDevice } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Camera, AlertTriangle } from 'lucide-react';
import { memo } from 'react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  className?: string;
}

const readerId = 'barcode-reader';

function BarcodeScanner({ onScan, className }: BarcodeScannerProps) {
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const lastScanTimeRef = useRef<number>(0);
  const SCAN_COOLDOWN_MS = 3000;

  const startScanner = useCallback(async (cameraId: string) => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(readerId);
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
          if (!errorMessage.includes('No MultiFormat Readers were able to detect the code')) {
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
    setIsLoading(true);
    setError(null);

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices.length === 0) {
          setError(
            'No se encontraron cámaras disponibles. Conecta una cámara o verifica los permisos.'
          );
          setIsLoading(false);
          return;
        }
        setCameras(devices);
        const rearCamera = devices.find((d) =>
          d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
        );
        setSelectedCameraId(rearCamera ? rearCamera.id : devices[0].id);
      })
      .catch(() => {
        setError('No se pudieron obtener las cámaras. Verifica los permisos de la cámara.');
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
          scannerRef.current.clear();
          scannerRef.current = null;
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCameraId && !error) {
      startScanner(selectedCameraId);
    }
  }, [selectedCameraId, error, startScanner]);

  return (
    <div className={className}>
      <div className='space-y-4'>
        {cameras.length > 1 && (
          <Select value={selectedCameraId ?? ''} onValueChange={setSelectedCameraId} disabled={isLoading}>
            <SelectTrigger className='w-full bg-white border-gray-300'>
              <SelectValue placeholder='Selecciona una cámara' />
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
        <div className='relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden'>
          {isLoading ? (
            <div className='flex items-center justify-center h-full'>
              <Loader2 className='w-8 h-8 animate-spin text-gray-500' />
              <span className='ml-2 text-gray-500'>Cargando cámaras...</span>
            </div>
          ) : error ? (
            <div className='flex flex-col items-center justify-center h-full text-red-500'>
              <AlertTriangle className='w-8 h-8 mb-2' />
              <p>{error}</p>
              <Button
                variant='outline'
                size='sm'
                className='mt-4'
                onClick={() => setSelectedCameraId(cameras[0]?.id || null)}
              >
                Reintentar
              </Button>
            </div>
          ) : (
            <div id={readerId} className='w-full h-full' />
          )}
          {isScanning && (
            <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
              <div className='w-48 h-48 border-2 border-dashed border-green-500 rounded-lg' />
            </div>
          )}
        </div>
        <div className='flex items-center space-x-2 text-sm text-gray-600'>
          <Camera className='w-4 h-4' />
          <span>{isScanning ? 'Escaneando...' : error ? 'Error en el escáner' : 'Cámara lista'}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(BarcodeScanner);
