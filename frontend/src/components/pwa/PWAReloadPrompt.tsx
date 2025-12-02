import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, X } from 'lucide-react'

export function PWAReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every hour
      if (r) {
        setInterval(() => {
          r.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm shadow-lg border-primary/20 animate-in slide-in-from-bottom-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              {offlineReady ? 'Ready for Offline' : 'Update Available'}
            </CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={close}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="mb-3">
          {offlineReady
            ? 'Archevi is now available offline. You can access your recent documents without an internet connection.'
            : 'A new version of Archevi is available. Reload to get the latest features and improvements.'}
        </CardDescription>
        {needRefresh && (
          <div className="flex gap-2">
            <Button onClick={() => updateServiceWorker(true)} className="flex-1">
              Reload
            </Button>
            <Button variant="outline" onClick={close}>
              Later
            </Button>
          </div>
        )}
        {offlineReady && (
          <Button variant="outline" onClick={close} className="w-full">
            Got it
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
