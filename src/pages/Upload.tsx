import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFileParsing } from '@/hooks/useFileParsing';
import { StepIndicator } from '@/components/StepIndicator';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, FileText, FileSpreadsheet, FileJson, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Upload() {
  const navigate = useNavigate();
  const {
    fileData,
    error,
    processing,
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileInput,
    resetFile,
  } = useFileParsing();

  // Called when user wants to proceed to the next step
  const handleNext = () => {
    const simulatedFileId = Math.random().toString(36).substring(7);
    navigate(`/validationMapping?fileId=${simulatedFileId}`);
  };

  return (
    <div className="flex flex-col max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8">
      {/* Step Indicator */}
      <StepIndicator currentStep={1} totalSteps={5} className="mb-8" />

      {/* Title and Subtitle */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold mb-2 dark:text-text-dark">Upload Your File</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Please upload a valid CSV, XLSX, or JSON file (max 50MB).
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 relative flex items-center gap-3 px-4 py-3 rounded-lg bg-status-warning/20 text-status-warning border border-status-warning/30"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={() => resetFile()}
            className="absolute right-2 top-2 p-1 hover:bg-status-warning/20 rounded-full transition-colors"
            aria-label="Dismiss error message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Zone or File Details */}
      {!fileData ? (
        // Show Drop Zone if no file is uploaded
        <div
          role="button"
          tabIndex={0}
          className={`
            relative flex items-center justify-center w-full h-72
            border-2 border-dashed 
            bg-background-light dark:bg-[#2A2A2A]
            rounded-lg
            cursor-pointer
            transition-all duration-200 ease-out
            hover:border-coral-400 hover:bg-coral-500/[0.02]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2
            ${isDragging ? 'border-coral-500 bg-coral-500/10' : 'border-border-light dark:border-border-dark'}
            ${processing.isProcessing ? 'pointer-events-none' : ''}
          `}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-label="File Upload Area"
        >
          {processing.isProcessing ? (
            /* Loading Overlay when processing */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-[#2A2A2A]/80 backdrop-blur-sm rounded-lg">
              <div className="w-64 space-y-4">
                <div className="h-2 bg-background-light dark:bg-background-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-coral-500 transition-all duration-300 ease-out"
                    style={{ width: `${processing.progress}%` }}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(processing.progress)}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-500 dark:text-gray-200">
                    Processing file...
                  </p>
                  <p className="font-medium text-coral-500">
                    {Math.round(processing.progress)}%
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Default Instruction */
            <div className="text-center space-y-2">
              <svg 
                className="w-12 h-12 mx-auto mb-2 text-text-light/40 dark:text-text-dark/40" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
              <p className="text-base font-medium text-text-light dark:text-text-dark">
                Drag and drop your file here
              </p>
              <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                or click below to select
              </p>

              {/* File input button */}
              <button
                type="button"
                onClick={() => document.getElementById('file-input')?.click()}
                className="mt-2 bg-coral-500 text-white px-4 py-2 rounded-md hover:bg-coral-600 transition-colors"
              >
                Choose File
              </button>
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls,.json"
                onChange={(e) => handleFileInput(e.target.files)}
              />
            </div>
          )}
        </div>
      ) : (
        // Show file details if a file is already uploaded
        <>
          <Card className="shadow-md">
            <CardHeader className="p-4">
              <div className="flex items-center space-x-3">
                {/* File type icons */}
                {fileData.type === 'CSV' && (
                  <FileText className="h-6 w-6 text-coral-500" />
                )}
                {(fileData.type === 'XLSX' || fileData.type === 'XLS') && (
                  <FileSpreadsheet className="h-6 w-6 text-teal-500" />
                )}
                {fileData.type === 'JSON' && (
                  <FileJson className="h-6 w-6 text-coral-500" />
                )}

                {/* File name as title */}
                <CardTitle className="text-lg font-semibold dark:text-white">
                  {fileData.name}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">File Size</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {fileData.size}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Rows</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {fileData.rowCount?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Columns</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {fileData.headers?.length || 0}
                  </p>
                </div>
              </div>

              {/* Detected Columns */}
              {fileData.headers && fileData.headers.length > 0 && (
                <div className="mt-4 border-t border-border-light dark:border-border-dark pt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Detected Columns
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {fileData.headers.map((header, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-full bg-background-light dark:bg-[#333] text-xs font-medium text-text-light dark:text-gray-100"
                      >
                        {header}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => resetFile()}
            >
              Re-upload File
            </Button>
            <Button 
              onClick={handleNext}
              className="group flex items-center"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
