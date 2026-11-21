"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { validateAddress } from "smart-account-kit";
import { Button } from "@/components/ui/button";

export function QrScanner({
  onScan,
  onCancel,
}: {
  onScan: (address: string) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frameHandle: number;
    let cancelled = false;

    async function start() {
      try {
        const [{ default: jsQR }, mediaStream] = await Promise.all([
          import("jsqr"),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }),
        ]);
        if (cancelled || !videoRef.current) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = mediaStream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanFrame(jsQR);
      } catch {
        setError("Couldn't access the camera — check your browser permissions.");
      }
    }

    function scanFrame(jsQR: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        frameHandle = requestAnimationFrame(() => scanFrame(jsQR));
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        try {
          validateAddress(code.data);
          onScan(code.data);
          return;
        } catch {
          toast.error("That QR code isn't a valid Stellar address.");
        }
      }
      frameHandle = requestAnimationFrame(() => scanFrame(jsQR));
    }

    void start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameHandle);
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={onCancel}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} muted playsInline className="size-full object-cover" />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <Button variant="outline" className="w-full" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
