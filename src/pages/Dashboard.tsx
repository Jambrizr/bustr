import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brush,
  Clock,
  FileCheck,
  AlertTriangle,
  ChevronRight,
  BarChart2,
  Calendar,
  Users,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';

// Recharts imports
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// ShadCN/UI dialog imports
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

/* --------------------------------------------------------------
   Types
-------------------------------------------------------------- */
type CleaningJob = {
  id: string;
  fileName: string;
  timestamp: Date;
  status: 'completed' | 'failed' | 'in_progress';
  metrics: {
    totalRows: number;
    duplicatesRemoved: number;
    cleanedRows: number;
    duration: number;
    accuracy: number;
  };
  tags?: string[];
};

/* ------------------------------------------------------------------
   1) HISTORY MODAL WITH TAG FILTER, z-index fix for blur overlay
------------------------------------------------------------------ */
interface HistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: CleaningJob[];
}

function HistoryModal({ open, onOpenChange, jobs }: HistoryModalProps) {
  // Tag filter state
  const [selectedTag, setSelectedTag] = useState('');

  // Get all unique tags from the jobs
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    jobs.forEach((job) => {
      job.tags?.forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, [jobs]);

  // Filter jobs by selected tag
  const filteredJobs = useMemo(() => {
    if (!selectedTag) return jobs;
    return jobs.filter(
      (job) => job.tags && job.tags.includes(selectedTag)
    );
  }, [jobs, selectedTag]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        {/* 
          z-40 ensures the overlay is behind the modal content.
          backdrop-blur-sm adds the blur effect.
        */}
        <DialogOverlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        
        {/* 
          z-50 ensures the dialog is *above* the overlay.
          Also centered with top-1/2 left-1/2 transforms.
        */}
        <DialogContent
          className="
            fixed z-50 
            top-1/2 left-1/2 
            w-full max-w-4xl
            -translate-x-1/2 -translate-y-1/2 
            rounded-md 
            bg-white dark:bg-neutral-900 
            p-6 shadow-lg 
            focus:outline-none
          "
        >
          <DialogHeader>
            <DialogTitle>Full Upload History</DialogTitle>
            <DialogDescription>
              Below is a table of all prior uploads, filtered by tag if desired.
            </DialogDescription>
          </DialogHeader>

          {/* Tag Filter */}
          <div className="mt-2">
            <label className="text-sm font-medium mb-1 block">Filter by Tag:</label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Jobs Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/20">
                  <th className="p-3 text-left font-semibold">File Name</th>
                  <th className="p-3 text-left font-semibold">Uploaded At</th>
                  <th className="p-3 text-left font-semibold">Status</th>
                  <th className="p-3 text-left font-semibold">Total Rows</th>
                  <th className="p-3 text-left font-semibold">Duplicates</th>
                  <th className="p-3 text-left font-semibold">Accuracy</th>
                  <th className="p-3 text-left font-semibold">Tags</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job, idx) => (
                  <tr
                    key={job.id}
                    className={
                      idx % 2 === 0
                        ? 'bg-white dark:bg-gray-900'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }
                  >
                    <td className="p-3 whitespace-nowrap">{job.fileName}</td>
                    <td className="p-3 whitespace-nowrap">
                      {job.timestamp.toLocaleString()}
                    </td>
                    <td className="p-3 whitespace-nowrap capitalize">
                      {job.status}
                    </td>
                    <td className="p-3 whitespace-nowrap text-right">
                      {job.metrics.totalRows.toLocaleString()}
                    </td>
                    <td className="p-3 whitespace-nowrap text-right">
                      {job.metrics.duplicatesRemoved.toLocaleString()}
                    </td>
                    <td className="p-3 whitespace-nowrap text-right">
                      {job.metrics.accuracy}%
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {job.tags?.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DialogFooter className="mt-6 flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

/* ------------------------------------------------------------------
   2) DASHBOARD DATA
------------------------------------------------------------------ */
const recentJobs: CleaningJob[] = [
  {
    id: '1',
    fileName: 'customer_data_march.csv',
    timestamp: new Date('2024-03-15T10:30:00'),
    status: 'completed',
    metrics: {
      totalRows: 5000,
      duplicatesRemoved: 127,
      cleanedRows: 4873,
      duration: 45,
      accuracy: 98.5
    },
    tags: ['customers', 'monthly', 'marketing']
  },
  {
    id: '2',
    fileName: 'sales_report_q1.xlsx',
    timestamp: new Date('2024-03-14T15:45:00'),
    status: 'completed',
    metrics: {
      totalRows: 3200,
      duplicatesRemoved: 84,
      cleanedRows: 3116,
      duration: 32,
      accuracy: 97.8
    },
    tags: ['sales', 'quarterly']
  },
  {
    id: '3',
    fileName: 'inventory_update.json',
    timestamp: new Date('2024-03-14T09:15:00'),
    status: 'failed',
    metrics: {
      totalRows: 1500,
      duplicatesRemoved: 0,
      cleanedRows: 0,
      duration: 5,
      accuracy: 0
    },
    tags: ['inventory']
  },
  {
    id: '4',
    fileName: 'employee_records.csv',
    timestamp: new Date('2024-03-13T16:20:00'),
    status: 'completed',
    metrics: {
      totalRows: 850,
      duplicatesRemoved: 12,
      cleanedRows: 838,
      duration: 15,
      accuracy: 99.2
    },
    tags: ['employees', 'hr']
  },
  {
    id: '5',
    fileName: 'product_catalog.xlsx',
    timestamp: new Date('2024-03-13T11:05:00'),
    status: 'completed',
    metrics: {
      totalRows: 2700,
      duplicatesRemoved: 95,
      cleanedRows: 2605,
      duration: 28,
      accuracy: 96.5
    },
    tags: ['products', 'catalog']
  }
];

/* 
   Trend data focusing on:
   - cleanedRows
   - duplicatesRemoved
   - totalRows
*/
const trendData = [
  { date: '03/10', cleanedRows: 2500, duplicatesRemoved: 75, totalRows: 3000 },
  { date: '03/11', cleanedRows: 3100, duplicatesRemoved: 92, totalRows: 3400 },
  { date: '03/12', cleanedRows: 2800, duplicatesRemoved: 88, totalRows: 3150 },
  { date: '03/13', cleanedRows: 3500, duplicatesRemoved: 105, totalRows: 4000 },
  { date: '03/14', cleanedRows: 4700, duplicatesRemoved: 127, totalRows: 5000 },
  { date: '03/15', cleanedRows: 5000, duplicatesRemoved: 142, totalRows: 5200 }
];

/* ------------------------------------------------------------------
   CUSTOM TOOLTIP
------------------------------------------------------------------ */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-md">
        <p className="text-sm mb-2 font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs">
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ------------------------------------------------------------------
   STATUS BADGE
------------------------------------------------------------------ */
const StatusBadge = ({ status }: { status: CleaningJob['status'] }) => {
  const statusConfig = {
    completed: {
      icon: FileCheck,
      text: 'Completed',
      className: 'bg-status-success/10 text-status-success'
    },
    failed: {
      icon: AlertTriangle,
      text: 'Failed',
      className: 'bg-status-error/10 text-status-error'
    },
    in_progress: {
      icon: Clock,
      text: 'In Progress',
      className: 'bg-status-warning/10 text-status-warning'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.text}
    </span>
  );
};

/* ------------------------------------------------------------------
   DASHBOARD COMPONENT
------------------------------------------------------------------ */
export default function Dashboard() {
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = useState(false);

  // Metrics selection for the main line chart
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'cleanedRows',
    'duplicatesRemoved',
    'totalRows'
  ]);

  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricKey)
        ? prev.filter((m) => m !== metricKey)
        : [...prev, metricKey]
    );
  };

  const handleNewCleaning = () => {
    navigate('/upload');
  };

  // Format relative time (e.g., "2 days ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  // Calculate a simple "trend" for rows & duplicates
  const calculateTrend = (data: typeof trendData) => {
    if (data.length < 2) return { rows: 0, duplicates: 0 };
    const lastIndex = data.length - 1;
    const rowsTrend =
      data[lastIndex].cleanedRows - data[lastIndex - 1].cleanedRows;
    const duplicatesTrend =
      data[lastIndex].duplicatesRemoved -
      data[lastIndex - 1].duplicatesRemoved;

    return { rows: rowsTrend, duplicates: duplicatesTrend };
  };
  const trends = calculateTrend(trendData);

  // Metric options for the line chart
  const AVAILABLE_METRICS = [
    { key: 'cleanedRows', label: 'Cleaned Rows', color: '#F2994A' },
    { key: 'duplicatesRemoved', label: 'Duplicates Removed', color: '#00BFA5' },
    { key: 'totalRows', label: 'Total Rows', color: '#9C27B0' }
  ];

  return (
    <div className="space-y-8 p-4">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-h1 font-bold bg-gradient-to-r from-coral-500 to-teal-500 bg-clip-text text-transparent">
            Welcome, User!
          </h1>
          <p className="text-text-light/60 dark:text-text-dark/60 mt-2">
            Start cleaning your data with just a few clicks
          </p>
        </div>

        {/* New Cleaning Button */}
        <Button
          onClick={handleNewCleaning}
          className="group relative overflow-hidden bg-coral-500 hover:bg-coral-hover transition-all duration-200 ease-out"
          aria-label="Start new data cleaning process"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Brush className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" />
            <span>New Cleaning</span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-coral-400/0 via-white/10 to-coral-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </Button>
      </div>

      {/* Data Trends Section (Line Chart) */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <h2 className="text-h2">Data Trends</h2>

          {/* Checkboxes to toggle lines */}
          <div className="flex flex-wrap items-center gap-3">
            {AVAILABLE_METRICS.map((metric) => (
              <label
                key={metric.key}
                className="flex items-center text-sm gap-1"
              >
                <input
                  type="checkbox"
                  checked={selectedMetrics.includes(metric.key)}
                  onChange={() => toggleMetric(metric.key)}
                />
                {metric.label}
              </label>
            ))}
          </div>
        </div>

        {/* Quick summary for cleaned rows & duplicates */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`flex items-center gap-1 ${
                trends.rows > 0 ? 'text-status-success' : 'text-status-error'
              }`}
            >
              {trends.rows > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-medium">
                {Math.abs(trends.rows).toLocaleString()} cleaned
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`flex items-center gap-1 ${
                trends.duplicates > 0
                  ? 'text-status-warning'
                  : 'text-status-success'
              }`}
            >
              {trends.duplicates > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-medium">
                {Math.abs(trends.duplicates)} duplicates
              </span>
            </div>
          </div>
        </div>

        {/* The main line chart */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-coral-500" />
              Cleaning Metrics Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    opacity={0.1}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="currentColor"
                    opacity={0.5}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="currentColor"
                    opacity={0.5}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />

                  {AVAILABLE_METRICS.map(
                    (metric) =>
                      selectedMetrics.includes(metric.key) && (
                        <Line
                          key={metric.key}
                          type="monotone"
                          dataKey={metric.key}
                          name={metric.label}
                          stroke={metric.color}
                          strokeWidth={2}
                          dot={{ r: 4, strokeWidth: 2 }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                        />
                      )
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recent Uploads Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-h2">Recent Uploads</h2>
          <Button
            variant="outline"
            onClick={() => setHistoryOpen(true)}
            className="group focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2"
            aria-expanded={historyOpen}
          >
            View Full History
            <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {recentJobs.map((job, index) => (
            <Card
              key={job.id}
              className="group relative overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus-within:ring-2 focus-within:ring-coral-500"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-coral-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle
                      className="text-h3 font-bold line-clamp-1"
                      title={job.fileName}
                    >
                      {job.fileName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatRelativeTime(job.timestamp)}
                    </CardDescription>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-text-light/60 dark:text-text-dark/60 flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        Total Rows
                      </p>
                      <p className="text-lg font-semibold">
                        {job.metrics.totalRows.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-text-light/60 dark:text-text-dark/60 flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        Duplicates
                      </p>
                      <p className="text-lg font-semibold">
                        {job.metrics.duplicatesRemoved.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Accuracy Progress Bar */}
                  {job.status === 'completed' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-light/60 dark:text-text-dark/60">
                          Accuracy
                        </span>
                        <span className="font-medium">
                          {job.metrics.accuracy}%
                        </span>
                      </div>
                      <div className="h-2 bg-background-light dark:bg-background-dark rounded-full overflow-hidden">
                        <div
                          className="h-full bg-coral-500 rounded-full transition-all duration-300"
                          style={{ width: `${job.metrics.accuracy}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 text-xs font-medium rounded-full bg-background-light dark:bg-background-dark"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* History Modal w/ Tag Filter & correct z-index */}
      <HistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        jobs={recentJobs}
      />
    </div>
  );
}
