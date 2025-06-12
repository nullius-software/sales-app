'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';

interface FabricIdentifierDialogProps {
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
  handleFabricIdentified: (search: string) => void;
}

export default function FabricIdentifierDialog({ open, onOpenChange, handleFabricIdentified }: FabricIdentifierDialogProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
  const [cameraActive, setCameraActive] = useState(true);

  useEffect(() => {
    if (!open) return;

    const getVideoDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((device) => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
        setCameraActive(true);
      } catch (error) {
        console.error('Error listando cámaras', error);
        toast.error('No se pudieron listar las cámaras disponibles');
      }
    };

    getVideoDevices();
  }, [open]);

  const stopCamera = () => {
    if (webcamRef.current) {
      const stream = webcamRef.current.video?.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
    setCameraActive(false);
  };

  const captureAndSend = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      toast.error('No se pudo capturar la imagen');
      return;
    }

    stopCamera();

    const res = await fetch(imageSrc);
    const blob = await res.blob();

    const formData = new FormData();
    formData.append('file', new File([blob], 'fabric.jpg', { type: 'image/jpeg' }));

    try {
      setIsLoading(true);
      const response = await axios.post('/api/identify-fabric', formData);
      handleFabricIdentified(response.data.result)
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al procesar la imagen');
    } finally {
      setIsLoading(false);
    }
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Identificador de Tela</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {devices.length > 1 && (
            <Select
              value={selectedDeviceId}
              onValueChange={(value) => setSelectedDeviceId(value)}
              disabled={!cameraActive}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Selecciona una cámara" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Cámara ${device.deviceId}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {cameraActive ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full rounded-md"
              videoConstraints={{
                deviceId: selectedDeviceId,
                facingMode: 'environment',
              }}
            />
          ) : (
            <div className="w-full rounded-md bg-black aspect-video" />
          )}
        </div>

        <DialogFooter>
          <Button onClick={captureAndSend} disabled={isLoading || !cameraActive}>
            {isLoading ? 'Procesando...' : 'Tomar Foto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
