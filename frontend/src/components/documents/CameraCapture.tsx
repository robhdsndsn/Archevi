import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Camera, FlipHorizontal, X, RotateCcw, Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CameraCaptureProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCapture: (file: File) => void
}

export function CameraCapture({ open, onOpenChange, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Start camera stream
  const startCamera = useCallback(async () => {
    setError(null)
    setIsLoading(true)

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStreaming(true)
      }
    } catch (err) {
      console.error('Camera error:', err)
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access in your browser settings.')
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.')
        } else if (err.name === 'NotReadableError') {
          setError('Camera is in use by another application.')
        } else {
          setError(`Camera error: ${err.message}`)
        }
      } else {
        setError('Failed to access camera.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [facingMode])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }, [])

  // Initialize camera when dialog opens
  useEffect(() => {
    if (open) {
      startCamera()
    } else {
      stopCamera()
      setCapturedImage(null)
      setError(null)
    }

    return () => {
      stopCamera()
    }
  }, [open, startCamera, stopCamera])

  // Restart camera when facing mode changes
  useEffect(() => {
    if (open && !capturedImage) {
      startCamera()
    }
  }, [facingMode, open, capturedImage, startCamera])

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get the image data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageDataUrl)

    // Stop the camera while reviewing
    stopCamera()
  }, [stopCamera])

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    startCamera()
  }, [startCamera])

  // Confirm and use the captured photo
  const confirmPhoto = useCallback(async () => {
    if (!capturedImage) return

    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage)
      const blob = await response.blob()

      // Create a file from the blob
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const file = new File([blob], `scan-${timestamp}.jpg`, { type: 'image/jpeg' })

      onCapture(file)
      onOpenChange(false)
    } catch (err) {
      console.error('Error creating file:', err)
      setError('Failed to process the captured image.')
    }
  }, [capturedImage, onCapture, onOpenChange])

  // Toggle camera facing mode
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Document
          </DialogTitle>
          <DialogDescription>
            Position the document in frame and take a photo
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-[4/3] bg-black">
          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <Button variant="outline" onClick={startCamera}>
                Try Again
              </Button>
            </div>
          )}

          {/* Video preview */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              'w-full h-full object-cover',
              (!isStreaming || capturedImage) && 'hidden'
            )}
          />

          {/* Captured image preview */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured document"
              className="w-full h-full object-cover"
            />
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Document frame guide (only when streaming) */}
          {isStreaming && !capturedImage && (
            <div className="absolute inset-4 border-2 border-white/50 border-dashed rounded-lg pointer-events-none">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 flex items-center justify-between gap-2 bg-background">
          {!capturedImage ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>

              <Button
                size="lg"
                className="rounded-full h-16 w-16"
                onClick={capturePhoto}
                disabled={!isStreaming || isLoading}
              >
                <Camera className="h-6 w-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCamera}
                disabled={!isStreaming || isLoading}
              >
                <FlipHorizontal className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={retakePhoto}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                >
                  Retake
                </Button>
                <Button onClick={confirmPhoto}>
                  <Upload className="h-4 w-4 mr-2" />
                  Use Photo
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to check if device has camera
export function useHasCamera() {
  const [hasCamera, setHasCamera] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkCamera() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        setHasCamera(videoDevices.length > 0)
      } catch {
        setHasCamera(false)
      } finally {
        setIsChecking(false)
      }
    }

    if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
      checkCamera()
    } else {
      setHasCamera(false)
      setIsChecking(false)
    }
  }, [])

  return { hasCamera, isChecking }
}
