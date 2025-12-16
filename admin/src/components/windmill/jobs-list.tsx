import { useState, useEffect, useCallback } from "react"
import {
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Square,
  Eye,
  ExternalLink,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { windmillAdmin, type Job } from "@/api/windmill"
import { Pagination, usePagination } from "@/components/ui/pagination"

function formatDuration(ms?: number): string {
  if (!ms) return "-"
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function JobStatusBadge({ job }: { job: Job }) {
  if (job.running) {
    return (
      <Badge variant="default" className="bg-blue-500">
        <Play className="h-3 w-3 mr-1" />
        Running
      </Badge>
    )
  }
  if (job.canceled) {
    return (
      <Badge variant="secondary">
        <Square className="h-3 w-3 mr-1" />
        Canceled
      </Badge>
    )
  }
  if (job.success === true) {
    return (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="h-3 w-3 mr-1" />
        Success
      </Badge>
    )
  }
  if (job.success === false) {
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      <Clock className="h-3 w-3 mr-1" />
      Pending
    </Badge>
  )
}

interface JobDetailsDialogProps {
  job: Job | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function JobDetailsDialog({ job, open, onOpenChange }: JobDetailsDialogProps) {
  if (!job) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Job Details
            <JobStatusBadge job={job} />
          </DialogTitle>
          <DialogDescription>
            {job.script_path || "Unknown script"} - {job.id}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="info" className="flex-1 overflow-hidden">
          <TabsList>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="args">Arguments</TabsTrigger>
            <TabsTrigger value="result">Result</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Job ID:</span>
                <p className="font-mono">{job.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Script:</span>
                <p className="font-mono">{job.script_path || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p>{formatTime(job.created_at)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Started:</span>
                <p>{job.started_at ? formatTime(job.started_at) : "Not started"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <p>{formatDuration(job.duration_ms)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created By:</span>
                <p>{job.created_by}</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="args" className="overflow-auto max-h-[50vh]">
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
              {JSON.stringify(job.args, null, 2) || "No arguments"}
            </pre>
          </TabsContent>
          <TabsContent value="result" className="overflow-auto max-h-[50vh]">
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
              {JSON.stringify(job.result, null, 2) || "No result"}
            </pre>
          </TabsContent>
          <TabsContent value="logs" className="overflow-auto max-h-[50vh]">
            <pre className="bg-black text-green-400 p-4 rounded-lg text-xs overflow-auto font-mono">
              {job.logs || "No logs available"}
            </pre>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filter, setFilter] = useState<"all" | "running" | "completed" | "failed">("all")

  const fetchJobs = useCallback(async () => {
    setError(null)
    try {
      const params: { running?: boolean; success?: boolean; limit: number } = { limit: 50 }

      if (filter === "running") {
        params.running = true
      } else if (filter === "completed") {
        params.success = true
      } else if (filter === "failed") {
        params.success = false
      }

      const data = await windmillAdmin.listJobs(params)
      setJobs(data)
    } catch (e) {
      console.error("Failed to fetch jobs:", e)
      setError(e instanceof Error ? e.message : "Failed to fetch jobs")
    }
  }, [filter])

  useEffect(() => {
    fetchJobs().finally(() => setIsLoading(false))
  }, [fetchJobs])

  // Auto-refresh for running jobs
  useEffect(() => {
    const hasRunning = jobs.some((j) => j.running)
    if (!hasRunning) return

    const interval = setInterval(() => {
      fetchJobs()
    }, 5000) // Refresh every 5 seconds when jobs are running

    return () => clearInterval(interval)
  }, [jobs, fetchJobs])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchJobs()
    setIsRefreshing(false)
  }

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job)
    setDetailsOpen(true)
  }

  const runningCount = jobs.filter((j) => j.running).length
  const completedCount = jobs.filter((j) => j.success === true).length
  const failedCount = jobs.filter((j) => j.success === false).length

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    paginateData,
  } = usePagination(jobs.length, 25)

  const paginatedJobs = paginateData(jobs)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Windmill Jobs</h1>
          <p className="text-muted-foreground">
            Monitor and manage background job execution.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <a href="http://localhost/user/runs" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Windmill
            </a>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={`cursor-pointer transition-colors ${filter === "all" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilter("all")}
        >
          <CardHeader className="pb-2">
            <CardDescription>Total Jobs</CardDescription>
            <CardTitle className="text-3xl">{jobs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${filter === "running" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilter("running")}
        >
          <CardHeader className="pb-2">
            <CardDescription>Running</CardDescription>
            <CardTitle className="text-3xl text-blue-500">{runningCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${filter === "completed" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilter("completed")}
        >
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-green-500">{completedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${filter === "failed" ? "ring-2 ring-primary" : ""}`}
          onClick={() => setFilter("failed")}
        >
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl text-red-500">{failedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>
            {jobs.length} jobs loaded. Click on a row to view details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Script</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No jobs found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedJobs.map((job) => (
                  <TableRow
                    key={job.id}
                    className="cursor-pointer"
                    onClick={() => handleViewDetails(job)}
                  >
                    <TableCell>
                      <JobStatusBadge job={job} />
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm truncate max-w-[300px]">
                        {job.script_path || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{job.created_by}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {job.started_at ? formatTime(job.started_at) : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDuration(job.duration_ms)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {jobs.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={jobs.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </CardContent>
      </Card>

      <JobDetailsDialog
        job={selectedJob}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  )
}
