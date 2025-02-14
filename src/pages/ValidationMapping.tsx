import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { StepIndicator } from '@/components/StepIndicator';
import { AlertTriangle, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Column {
  id: number;
  name: string;
  detectedType: string;
  mappedType: string;
  sampleValue: string;
  isChanging?: boolean;
  warning?: string;
}

type FieldType = 
  // Contact Information
  | "Email"
  | "Phone"
  // Name Fields
  | "First Name"
  | "Last Name"
  | "Full Name"
  | "Name"
  // Professional Information
  | "Company"
  | "Job Title"
  | "Department"
  // Address Fields
  | "Address Line 1"
  | "Address Line 2"
  | "City"
  | "State"
  | "Zip Code"
  | "Country"
  // Other
  | "Other"
  | "Ignore";

interface FieldGroup {
  label: string;
  options: {
    value: FieldType;
    label: string;
    description?: string;
  }[];
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    label: "Contact Information",
    options: [
      { value: "Email", label: "Email Address" },
      { value: "Phone", label: "Phone Number" },
    ]
  },
  {
    label: "Name Fields",
    options: [
      { 
        value: "First Name", 
        label: "First Name",
        description: "Individual's first/given name"
      },
      { 
        value: "Last Name", 
        label: "Last Name",
        description: "Individual's last/family name"
      },
      { 
        value: "Full Name", 
        label: "Full Name",
        description: "Complete name in a single field"
      },
      { 
        value: "Name", 
        label: "Generic Name",
        description: "Unspecified name format"
      }
    ]
  },
  {
    label: "Professional",
    options: [
      { value: "Company", label: "Company Name" },
      { value: "Job Title", label: "Job Title" },
      { value: "Department", label: "Department" }
    ]
  },
  {
    label: "Address",
    options: [
      { value: "Address Line 1", label: "Address Line 1" },
      { value: "Address Line 2", label: "Address Line 2" },
      { value: "City", label: "City" },
      { value: "State", label: "State/Province" },
      { value: "Zip Code", label: "Zip/Postal Code" },
      { value: "Country", label: "Country" }
    ]
  },
  {
    label: "Other",
    options: [
      { value: "Other", label: "Other Field" },
      { value: "Ignore", label: "Ignore Column" }
    ]
  }
];

const initialColumns: Column[] = [
  { 
    id: 1, 
    name: 'email', 
    detectedType: 'Email', 
    mappedType: 'Email', 
    sampleValue: 'user@example.com',
    warning: undefined
  },
  { 
    id: 2, 
    name: 'phone_number', 
    detectedType: 'Phone', 
    mappedType: 'Phone', 
    sampleValue: 'ABC-123-4567',
    warning: 'This column may not contain valid phone numbers'
  },
  { 
    id: 3, 
    name: 'first_name', 
    detectedType: 'Name', 
    mappedType: 'First Name', 
    sampleValue: 'John',
    warning: undefined
  },
  { 
    id: 4, 
    name: 'last_name', 
    detectedType: 'Name', 
    mappedType: 'Last Name', 
    sampleValue: 'Smith',
    warning: undefined
  },
  { 
    id: 5, 
    name: 'company', 
    detectedType: 'Company', 
    mappedType: 'Company', 
    sampleValue: 'Acme Corp',
    warning: undefined
  },
];

export default function ValidationMapping() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubheadingVisible, setIsSubheadingVisible] = useState(false);
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const fileId = searchParams.get('fileId');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSubheadingVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleMappingChange = (columnId: number, newType: string) => {
    setColumns(prevColumns =>
      prevColumns.map(column => {
        if (column.id === columnId) {
          const updatedColumn = { 
            ...column, 
            mappedType: newType, 
            isChanging: true 
          };
          return updatedColumn;
        }
        return column;
      })
    );

    setTimeout(() => {
      setColumns(prevColumns =>
        prevColumns.map(column =>
          column.id === columnId
            ? { ...column, isChanging: false }
            : column
        )
      );
    }, 300);
  };

  const handleBack = () => {
    navigate('/upload');
  };

  const handleNext = () => {
    const mappingData = columns.map(({ id, name, mappedType }) => ({
      id,
      name,
      mappedType,
    }));

    const encodedMapping = encodeURIComponent(JSON.stringify(mappingData));

    navigate(`/dataCleaning?fileId=${fileId}&mapping=${encodedMapping}`);
  };

  const hasFirstName = columns.some(col => col.mappedType === 'First Name');
  const hasLastName = columns.some(col => col.mappedType === 'Last Name');
  const showNameCombineHint = hasFirstName && hasLastName;

  return (
    <div className="space-y-8">
      <StepIndicator currentStep={2} totalSteps={6} className="mb-12" />

      <div className="max-w-4xl mx-auto space-y-4">
        <h1 
          className="text-h1 font-bold bg-gradient-to-r from-coral-500 to-teal-500 bg-clip-text text-transparent"
          role="heading" 
          aria-level={1}
        >
          Validate & Map Your File
        </h1>

        <p 
          className={`text-lg text-text-light/60 dark:text-text-dark/60 transition-all duration-500 ease-out ${
            isSubheadingVisible 
              ? 'opacity-100 transform-none' 
              : 'opacity-0 translate-y-2'
          }`}
          aria-live="polite"
        >
          Review and adjust the detected columns
        </p>

        {fileId ? (
          <>
            <Card className="mt-8">
              <div className="p-6">
                <div className="space-y-6">
                  {showNameCombineHint && (
                    <div className="flex items-start gap-2 p-4 rounded-lg bg-coral-500/10 text-coral-500">
                      <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Name Fields Detected</p>
                        <p className="mt-1 text-coral-500/80">
                          First Name and Last Name fields will be automatically combined when needed. You can also map them separately for more flexibility.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table 
                      className="w-full"
                      role="grid"
                      aria-label="Column mapping table"
                    >
                      <thead>
                        <tr className="border-b border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark">
                          <th scope="col" className="px-6 py-4 text-sm font-semibold text-left">
                            Column Name
                          </th>
                          <th scope="col" className="px-6 py-4 text-sm font-semibold text-left">
                            Detected Type
                          </th>
                          <th scope="col" className="px-6 py-4 text-sm font-semibold text-left">
                            Mapped Type
                          </th>
                          <th scope="col" className="px-6 py-4 text-sm font-semibold text-left">
                            Sample Value
                          </th>
                          <th scope="col" className="px-6 py-4 text-sm font-semibold text-left">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {columns.map((column, index) => (
                          <tr 
                            key={column.id}
                            className={`
                              border-b border-border-light dark:border-border-dark
                              ${index % 2 === 0 
                                ? 'bg-white dark:bg-[#2A2A2A]' 
                                : 'bg-background-light dark:bg-background-dark'
                              }
                              hover:bg-coral-500/5 dark:hover:bg-coral-500/10
                              ${column.isChanging ? 'bg-coral-500/10 dark:bg-coral-500/20' : ''}
                            `}
                          >
                            <td className="px-6 py-4 text-sm">
                              <code className="px-2 py-1 bg-background-light dark:bg-background-dark rounded">
                                {column.name}
                              </code>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-500">
                                {column.detectedType}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <Select
                                defaultValue={column.mappedType}
                                onValueChange={(value) => handleMappingChange(column.id, value)}
                              >
                                <SelectTrigger 
                                  className={`w-[200px] transition-colors duration-300 ${
                                    column.isChanging ? 'border-coral-500 ring-2 ring-coral-500/20' : ''
                                  }`}
                                  aria-label={`Select field mapping for ${column.name}`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent
                                  align="start"
                                  side="bottom"
                                  position="popper"
                                  className="z-[9999] max-h-[300px] overflow-y-auto"
                                >
                                  {FIELD_GROUPS.map((group) => (
                                    <SelectGroup key={group.label}>
                                      <SelectLabel>{group.label}</SelectLabel>
                                      {group.options.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                          className="py-2"
                                        >
                                          <div>
                                            <div className="font-medium">{option.label}</div>
                                            {option.description && (
                                              <div className="text-xs text-text-light/60 dark:text-text-dark/60 mt-0.5">
                                                {option.description}
                                              </div>
                                            )}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-light/60 dark:text-text-dark/60 font-mono">
                              {column.sampleValue}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {column.warning && (
                                <div 
                                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-status-warning/20 text-status-warning"
                                  role="alert"
                                >
                                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                  <span className="text-xs font-medium">
                                    {column.warning}
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                    * Select a type from the dropdown to change the column mapping
                  </p>
                </div>
              </div>
            </Card>

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
                onClick={handleNext}
                className="group"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </>
        ) : (
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-2 text-status-error">
                <span className="text-lg">⚠️</span>
                <p>No file selected. Please upload a file first.</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}