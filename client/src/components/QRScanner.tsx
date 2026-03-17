import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Camera, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface QRScannerProps {
  onClose?: () => void;
  onSuccess?: () => void;
  onScan?: (data: string) => void;
}

export function QRScanner({ onClose = () => {}, onSuccess }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const checkInMutation = trpc.attendance.checkInViaQR.useMutation({
    onSuccess: (data) => {
      toast.success(`Checked in for ${data.className}!`);
      setScanResult("success");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message);
      setScanResult("error");
      setTimeout(() => {
        setScanResult(null);
        startScanning();
      }, 2000);
    },
  });

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Stop scanning immediately after successful scan
          scanner.stop();
          setIsScanning(false);
          
          // Process the QR code
          checkInMutation.mutate({ qrData: decodedText });
        },
        (errorMessage) => {
          // Ignore scanning errors (they happen frequently)
        }
      );

      setIsScanning(true);
      setCameraError(null);
    } catch (error: any) {
      console.error("Error starting scanner:", error);
      setCameraError(error.message || "Failed to access camera");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };

  useEffect(() => {
    startScanning();

    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="bg-gray-900 border-gray-700 max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Scan QR Code</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Scanner Area */}
          <div className="relative">
            {scanResult === "success" ? (
              <div className="bg-green-600/20 border-2 border-green-600 rounded-lg p-12 text-center">
                <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
                <p className="text-xl font-semibold text-green-400">Check-In Successful!</p>
              </div>
            ) : scanResult === "error" ? (
              <div className="bg-red-600/20 border-2 border-red-600 rounded-lg p-12 text-center">
                <X className="h-20 w-20 text-red-500 mx-auto mb-4" />
                <p className="text-xl font-semibold text-red-400">Check-In Failed</p>
                <p className="text-sm text-gray-400 mt-2">Retrying...</p>
              </div>
            ) : cameraError ? (
              <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-12 text-center">
                <Camera className="h-20 w-20 text-gray-600 mx-auto mb-4" />
                <p className="text-xl font-semibold text-white mb-2">Camera Access Required</p>
                <p className="text-sm text-gray-400 mb-4">{cameraError}</p>
                <Button
                  onClick={startScanning}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div>
                <div
                  id="qr-reader"
                  className="rounded-lg overflow-hidden border-2 border-red-600"
                ></div>
                <div className="mt-4 text-center">
                  <p className="text-gray-400 text-sm">
                    Position the QR code within the frame
                  </p>
                  {isScanning && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <div className="animate-pulse h-2 w-2 bg-red-600 rounded-full"></div>
                      <span className="text-red-600 text-sm font-semibold">Scanning...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          {!scanResult && !cameraError && (
            <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">Instructions:</h3>
              <ul className="space-y-1 text-gray-400 text-sm">
                <li>• Hold your device steady</li>
                <li>• Ensure good lighting</li>
                <li>• Align QR code within the frame</li>
                <li>• Check-in will happen automatically</li>
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
