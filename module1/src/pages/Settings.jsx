import { useNavigate } from 'react-router-dom'
import { AlertTriangle, DatabaseZap, Server } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../components/ui/alert-dialog'
import { Badge } from '../components/ui/badge'

export default function Settings() {
  const navigate = useNavigate()
  const clearAllData = useAppStore((state) => state.clearAllData)
  const pushToast = useAppStore((state) => state.pushToast)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              This version uses a local parser service instead of any Groq or Grok API key.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Server className="h-4 w-4 text-sky-700" />
                <p className="font-medium text-slate-900">Parser Backend</p>
              </div>
              <p className="text-sm text-slate-600">
                FastAPI endpoint expected at <code>/api/parse-resume</code> during local development.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <DatabaseZap className="h-4 w-4 text-sky-700" />
                <p className="font-medium text-slate-900">Stored App Data</p>
              </div>
              <p className="text-sm text-slate-600">
                Candidate profiles, jobs, and draft registration data are still stored in localStorage.
              </p>
            </div>
            <Badge variant="info" className="w-fit">
              No external LLM key required
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              Clear all locally stored candidates, jobs, toasts, and draft registration state.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Clear All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all local application data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes every saved candidate, job posting, match result, and draft form entry
                    from localStorage.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-rose-600 hover:bg-rose-700"
                    onClick={() => {
                      clearAllData()
                      pushToast({
                        message: 'Local application data cleared successfully.',
                        variant: 'success'
                      })
                      navigate('/')
                    }}
                  >
                    Clear Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
