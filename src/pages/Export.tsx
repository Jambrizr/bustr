import React, { useState } from 'react';
import { StepIndicator } from '@/components/StepIndicator';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, FileJson, Download, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

// Sample cleaned data for export simulation
const cleanedData = [
  { id: 1, name: 'John Smith', email: 'john@example.com', phone: '+15550123' },
  { id: 2, name: 'Jane Doe', email: 'jane.doe@example.com', phone: '+15550124' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+15550125' },
];

export default function Export() {
  const navigate = useNavigate();
  const [isSubheadingVisible, setIsSubheadingVisible] = useState(false);
  const [activeExport, setActiveExport] = useState<string | null>(null);

  // Show subheading with slight delay for animation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsSubheadingVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const simulateExport = async (format: string) => {
    setActiveExport(format);

    try {
      switch (format) {
        case 'csv': {
          // Simulate CSV export
          const headers = Object.keys(cleanedData[0]);
          const csvContent = [
            headers.join(','),
            ...cleanedData.map(row => 
              headers.map(header => row[header as keyof typeof row]).join(',')
            )
          ].join('\n');
          
          console.log('Simulated CSV Export:', csvContent);
          break;
        }
        
        case 'xlsx': {
          // Simulate XLSX export using SheetJS
          const worksheet = XLSX.utils.json_to_sheet(cleanedData);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Cleaned Data');
          
          console.log('Simulated XLSX Export:', workbook);
          break;
        }
        
        case 'json': {
          // Simulate JSON export
          const jsonContent = JSON.stringify(cleanedData, null, 2);
          console.log('Simulated JSON Export:', jsonContent);
          break;
        }
      }

      // Simulate download delay
      await new Promise(resolve => setTimeout(resolve, 800));
    } finally {
      setActiveExport(null);
    }
  };

  const handleBack = () => {
    navigate('/preview');
  };

  const handleFinish = () => {
    navigate('/');
  };

  return (
    <div className="space-y-8">
      <StepIndicator currentStep={5} totalSteps={5} className="mb-12" />

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header Section */}
        <div>
          <h1 
            className="text-h1 font-bold bg-gradient-to-r from-coral-500 to-teal-500 bg-clip-text text-transparent"
            role="heading" 
            aria-level={1}
          >
            Export Your Data
          </h1>

          <p 
            className={`text-lg text-text-light/60 dark:text-text-dark/60 transition-all duration-500 ease-out ${
              isSubheadingVisible ? 'opacity-100 transform-none' : 'opacity-0 translate-y-2'
            }`}
            aria-live="polite"
          >
            Choose your preferred export format
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CSV Export */}
          <Card className="relative group hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-coral-500" />
                CSV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-light/60 dark:text-text-dark/60 mb-4">
                Export as comma-separated values. Perfect for spreadsheet software.
              </p>
              <Button
                onClick={() => simulateExport('csv')}
                className="w-full group/button relative"
                disabled={!!activeExport}
              >
                {activeExport === 'csv' ? (
                  <span className="inline-flex items-center">
                    <Download className="h-4 w-4 mr-2 animate-bounce" />
                    Exporting...
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    <Download className="h-4 w-4 mr-2 transition-transform group-hover/button:-translate-y-1" />
                    Export CSV
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* XLSX Export */}
          <Card className="relative group hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-teal-500" />
                Excel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-light/60 dark:text-text-dark/60 mb-4">
                Export as Excel workbook with formatted data and columns.
              </p>
              <Button
                onClick={() => simulateExport('xlsx')}
                className="w-full group/button relative"
                disabled={!!activeExport}
              >
                {activeExport === 'xlsx' ? (
                  <span className="inline-flex items-center">
                    <Download className="h-4 w-4 mr-2 animate-bounce" />
                    Exporting...
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    <Download className="h-4 w-4 mr-2 transition-transform group-hover/button:-translate-y-1" />
                    Export Excel
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* JSON Export */}
          <Card className="relative group hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-coral-500" />
                JSON
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-light/60 dark:text-text-dark/60 mb-4">
                Export as structured JSON data. Ideal for developers.
              </p>
              <Button
                onClick={() => simulateExport('json')}
                className="w-full group/button relative"
                disabled={!!activeExport}
              >
                {activeExport === 'json' ? (
                  <span className="inline-flex items-center">
                    <Download className="h-4 w-4 mr-2 animate-bounce" />
                    Exporting...
                  </span>
                ) : (
                  <span className="inline-flex items-center">
                    <Download className="h-4 w-4 mr-2 transition-transform group-hover/button:-translate-y-1" />
                    Export JSON
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6">
          <Button
            onClick={handleBack}
            variant="outline"
            className="group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>
          <Button
            onClick={handleFinish}
            className="group bg-coral-500 hover:bg-coral-hover transition-colors"
          >
            <span className="inline-flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
              Finish
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}