import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FileData {
  name: string;
  size: string;
  type: string;
  headers?: string[];
  rowCount?: number;
}

export interface ParsingState {
  isProcessing: boolean;
  progress: number;
  status: 'idle' | 'processing' | 'complete' | 'error';
}

export function useFileParsing() {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<ParsingState>({
    isProcessing: false,
    progress: 0,
    status: 'idle'
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragCountRef = useRef(0);

  const simulateProgress = useCallback(() => {
    setProcessing({ isProcessing: true, progress: 0, status: 'processing' });
    const interval = setInterval(() => {
      setProcessing((prev) => {
        const newProgress = prev.progress + (100 - prev.progress) * 0.2;
        if (newProgress >= 99) {
          clearInterval(interval);
          return { ...prev, progress: 99 };
        }
        return { ...prev, progress: newProgress };
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  function cleanup(intervalFn: ReturnType<typeof simulateProgress>) {
    setProcessing({ isProcessing: false, progress: 100, status: 'complete' });
    intervalFn();
  }

  const isValidFileSize = (size: number) => size <= 50 * 1024 * 1024;

  const parseCSV = async (file: File) => {
    const cleanupFn = simulateProgress();
    Papa.parse(file, {
      header: true,
      preview: 10000,
      complete: (results) => {
        if (!results.meta.fields || !results.meta.fields.length) {
          setError('No valid headers found. Please ensure the file has a header row.');
          setProcessing({ isProcessing: false, progress: 0, status: 'error' });
          cleanupFn();
          return;
        }
        setFileData({
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          type: 'CSV',
          headers: results.meta.fields,
          rowCount: results.data.length,
        });
        cleanup(cleanupFn);
      },
      error: (err) => {
        console.error(err);
        setError('Failed to parse CSV file. Please check the format and try again.');
        setProcessing({ isProcessing: false, progress: 0, status: 'error' });
        cleanupFn();
      },
    });
  };

  const parseXLSX = async (file: File) => {
    const cleanupFn = simulateProgress();
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { sheetStubs: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      if (!data[0] || data[0].length === 0) {
        throw new Error('No valid headers in Excel file.');
      }
      const headers = data[0] as string[];
      const totalRows = data.length - 1;

      setFileData({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: 'XLSX',
        headers,
        rowCount: totalRows,
      });
      cleanup(cleanupFn);
    } catch (err) {
      console.error(err);
      setError('Failed to parse Excel file. Ensure it has headers and try again.');
      setProcessing({ isProcessing: false, progress: 0, status: 'error' });
      cleanupFn();
    }
  };

  const parseJSON = async (file: File) => {
    const cleanupFn = simulateProgress();
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      let headers: string[] = [];
      let rowCount = 1;

      if (Array.isArray(data)) {
        rowCount = data.length;
        if (data[0] && typeof data[0] === 'object') {
          headers = Object.keys(data[0]);
        }
      } else if (typeof data === 'object') {
        headers = Object.keys(data);
      } else {
        throw new Error('JSON must be an object or array of objects.');
      }

      if (!headers.length) {
        throw new Error('No valid headers found in JSON.');
      }

      setFileData({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: 'JSON',
        headers,
        rowCount,
      });
      cleanup(cleanupFn);
    } catch (err) {
      console.error(err);
      setError('Failed to parse JSON. Ensure its an array or object with valid fields.');
      setProcessing({ isProcessing: false, progress: 0, status: 'error' });
      cleanupFn();
    }
  };

  const handleFileInput = (fileList?: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null); 
    const file = fileList[0];
    if (!isValidFileSize(file.size)) {
      setError('File size exceeds 50 MB limit. Please upload a smaller file.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['csv', 'xlsx', 'xls', 'json'].includes(ext)) {
      setError('Unsupported file type. Only CSV, XLSX, XLS, and JSON are allowed.');
      return;
    }

    switch (ext) {
      case 'csv':
        parseCSV(file);
        break;
      case 'xls':
      case 'xlsx':
        parseXLSX(file);
        break;
      case 'json':
        parseJSON(file);
        break;
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current += 1;
    if (dragCountRef.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current -= 1;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCountRef.current = 0;
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileInput(e.dataTransfer.files);
      }
    },
    [handleFileInput]
  );

  const resetFile = () => {
    setFileData(null);
    setError(null);
    setProcessing({ isProcessing: false, progress: 0, status: 'idle' });
  };

  return {
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
  };
}