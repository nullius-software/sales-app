'use client';

import { useState, useEffect } from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function ScanPage() {
  const [result, setResult] = useState('');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [scannerActive, setScannerActive] = useState(false);

  const checkAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices);
      return videoDevices;
    } catch (error) {
      console.error('Error enumerating devices:', error);
      return [];
    }
  };

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('MediaDevices API not supported');
      setCameraPermission('unsupported');
      return;
    }

    checkAvailableDevices().then(videoDevices => {
      if (videoDevices.length === 0) {
        console.log('No video devices found');
      }
    });

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then(permissionStatus => {
          console.log('Camera permission status:', {
            state: permissionStatus.state,
            permissionStatus: permissionStatus
          });

          const state = permissionStatus.state as 'granted' | 'denied' | 'prompt';
          setCameraPermission(state);

          if (state === 'granted') {
            setScannerActive(true);
          }

          permissionStatus.onchange = () => {
            console.log('Camera permission changed:', {
              newState: permissionStatus.state
            });
            const newState = permissionStatus.state as 'granted' | 'denied' | 'prompt';
            setCameraPermission(newState);
            if (newState === 'granted') {
              setScannerActive(true);
            } else if (newState === 'denied') {
              setScannerActive(false);
            }
          };
        })
        .catch(error => {
          console.error('Error querying camera permission:', error);
          setCameraPermission('prompt');
        });
    } else {
      console.log('Permissions API not supported in this browser');
      setCameraPermission('prompt');
    }
  }, []);

  const requestCameraPermission = async () => {
    console.log('Requesting camera permission');
    try {
      const videoDevices = await checkAvailableDevices();
      if (videoDevices.length === 0) {
        console.log('No video devices available before requesting permission');
        setCameraPermission('denied');
        toast.error('No se encontró ninguna cámara');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('Camera permission granted, stream acquired:', stream);
      setCameraPermission('granted');
      setScannerActive(true);
      toast.success('Cámara activada');
      // Stop the stream to free the camera for the scanner
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      console.error('Error requesting camera permission:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setCameraPermission('denied');
      if (error.name === 'NotFoundError') {
        toast.error('No se encontró ninguna cámara');
      } else if (error.name === 'NotAllowedError') {
        toast.error('Permiso de cámara denegado por el usuario');
      } else {
        toast.error('Error al acceder a la cámara');
      }
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Escaneá un código de barras</h1>

      {cameraPermission === 'unsupported' && (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
          <p>Tu navegador no soporta el acceso a la cámara.</p>
          <p className="mt-2 text-sm">Intenta usar un navegador moderno como Chrome, Firefox o Safari.</p>
        </div>
      )}

      {cameraPermission === 'denied' && (
        <div className="p-4 bg-red-50 text-red-800 rounded-md">
          <p>Se ha denegado el acceso a la cámara o no se encontró ninguna cámara.</p>
          <p className="mt-2 text-sm">
            Por favor, verifica que tu cámara esté habilitada en la configuración de tu dispositivo y navegador, luego recarga la página.
          </p>
          <Button
            variant="outline"
            className="w-full mt-4 flex items-center justify-center"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Recargar
          </Button>
        </div>
      )}

      {cameraPermission === 'prompt' && (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <Camera className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-center mb-4">Se necesita acceso a tu cámara para escanear códigos de barras.</p>
          <Button onClick={requestCameraPermission}>
            Permitir acceso a la cámara
          </Button>
        </div>
      )}

      {cameraPermission === 'granted' && scannerActive && (
        <>
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <BarcodeScanner onScan={(code) => setResult(code)} />
          </div>

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="font-medium text-green-800">Código detectado:</p>
              <p className="mt-1 font-mono text-lg break-all">{result}</p>
              <Button
                variant="outline"
                className="w-full mt-3"
                onClick={() => setResult('')}
              >
                Escanear otro código
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}