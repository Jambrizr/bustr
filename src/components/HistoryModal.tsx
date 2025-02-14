import * as React from 'react';
// If you have the older version of ShadCN, your import paths might differ:
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CleaningJob {
  id: string;
  fileName: string;
  timestamp: Date;
  status: "completed" | "failed" | "in_progress";
  metrics: {
    totalRows: number;
    duplicatesRemoved: number;
    cleanedRows: number;
    duration: number;
    accuracy: number;
  };
  tags?: string[];
}

interface HistoryModalProps {
  open: boolean;                 // Controlled open state
  onOpenChange: (open: boolean) => void; // Callback to toggle
  jobs: CleaningJob[];
}

export function HistoryModal({ open, onOpenChange, jobs }: HistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The <DialogContent> is where the modal is rendered */}
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Full Upload History</DialogTitle>
          <DialogDescription>
            Below is a table of all prior uploads and their cleaning stats.
          </DialogDescription>
        </DialogHeader>

        {/* Table / List Content */}
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
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, idx) => (
                <tr
                  key={job.id}
                  className={
                    idx % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800"
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter className="mt-6">
          {/* <DialogClose> is provided by shadcn/ui to close the dialog */}
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
