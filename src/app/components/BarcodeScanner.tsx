'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const readerId = 'reader';
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScanner = async (cameraId: string) => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
    }

    scannerRef.current = new Html5Qrcode(readerId);
    try {
      await scannerRef.current.start(
        { deviceId: { exact: cameraId } },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
        },
        (errorMessage) => {
          console.warn('Scan error:', errorMessage);
        }
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('No se pudo iniciar el escáner con esta cámara.');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    Html5Qrcode.getCameras()
      .then((devices) => {
        setCameras(devices);

        const rearCamera = devices.find((device) =>
          device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear')
        );

        if (rearCamera) {
          setSelectedCameraId(rearCamera.id);
        } else if (devices.length > 0) {
          setSelectedCameraId(devices[0].id);
        }
      })
      .catch((err) => {
        console.error('Error al obtener cámaras:', err);
        setError('No se pudieron obtener las cámaras disponibles.');
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.clear();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCameraId) {
      startScanner(selectedCameraId);
    }
  }, [selectedCameraId]);

  return (
    <div className="w-full space-y-2">
      {cameras.length > 1 && (
        <select
          className="p-2 border rounded-md"
          value={selectedCameraId ?? ''}
          onChange={(e) => setSelectedCameraId(e.target.value)}
        >
          {cameras.map((cam) => (
            <option key={cam.id} value={cam.id}>
              {cam.label || `Cámara ${cam.id}`}
            </option>
          ))}
        </select>
      )}

      <div id={readerId} className="w-full" />
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
