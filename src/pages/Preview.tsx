import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StepIndicator } from '@/components/StepIndicator'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Check,
  AlertTriangle,
  RotateCw,
  Edit,
  Save,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@/components/ui/tooltip'

// Sample data: Original vs. Cleaned
const sampleData = {
  original: [
    { id: 1, name: 'John smith', email: 'JOHN@example.com', phone: '555-0123' },
    { id: 2, name: 'jane DOE', email: 'jane.doe@example.com', phone: '5550124' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '(555) 0125' },
  ],
  cleaned: [
    { id: 1, name: 'John Smith', email: 'john@example.com', phone: '+15550123' },
    { id: 2, name: 'Jane Doe', email: 'jane.doe@example.com', phone: '+15550124' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+15550125' },
  ],
}

export default function Preview() {
  const navigate = useNavigate()

  // Fade in subheading
  const [isSubheadingVisible, setIsSubheadingVisible] = useState(false)

  // Track which rows are reverted to the original
  const [revertedRows, setRevertedRows] = useState<number[]>([])

  // Inline editing states
  // phoneEdits[rowId] => current value of the phone input
  const [phoneEdits, setPhoneEdits] = useState<{ [key: number]: string }>({})
  // isEditingRow[rowId] => whether that row is in "edit" mode
  const [isEditingRow, setIsEditingRow] = useState<{ [key: number]: boolean }>({})

  useEffect(() => {
    const timer = setTimeout(() => setIsSubheadingVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  // Helper to find the "original" vs. "cleaned" data for a row
  function getOriginalRow(rowId: number) {
    return sampleData.original.find((r) => r.id === rowId)
  }
  function getCleanedRow(rowId: number) {
    return sampleData.cleaned.find((r) => r.id === rowId)
  }

  // If row is reverted, show original; otherwise show cleaned
  function getDisplayRow(rowId: number) {
    const originalRow = getOriginalRow(rowId)
    const cleanedRow = getCleanedRow(rowId)
    if (!originalRow || !cleanedRow) return null

    return revertedRows.includes(rowId) ? originalRow : cleanedRow
  }

  function handleRevertRow(rowId: number) {
    setRevertedRows((prev) =>
      prev.includes(rowId)
        ? prev.filter((id) => id !== rowId)
        : [...prev, rowId]
    )
  }

  // Start editing phone
  function handleStartEdit(rowId: number) {
    const displayRow = getDisplayRow(rowId)
    if (!displayRow) return

    // Initialize phoneEdits with current displayed phone
    setPhoneEdits((prev) => ({ ...prev, [rowId]: displayRow.phone }))
    // Mark row as editing
    setIsEditingRow((prev) => ({ ...prev, [rowId]: true }))
  }

  // Save phone changes
  function handleSaveEdit(rowId: number) {
    // In a real app, you'd update the data in your backend or global store
    // For now, just exit edit mode
    setIsEditingRow((prev) => ({ ...prev, [rowId]: false }))
  }

  // For each cell, show "original → cleaned" if there's a difference
  // or just one value if it's the same.
  function renderCell(rowId: number, field: 'name' | 'email' | 'phone') {
    const originalRow = getOriginalRow(rowId)
    const cleanedRow = getCleanedRow(rowId)
    if (!originalRow || !cleanedRow) return '-'

    const originalVal = originalRow[field]
    const cleanedVal = cleanedRow[field]

    // If row is reverted, display the original
    if (revertedRows.includes(rowId)) {
      return <span>{originalVal}</span>
    }

    // If row is editing phone, show input
    if (field === 'phone' && isEditingRow[rowId]) {
      const editVal = phoneEdits[rowId] ?? cleanedVal
      return (
        <input
          className="border border-border-light dark:border-border-dark
            bg-transparent px-2 py-1 text-sm font-mono
            focus:outline-none focus:ring-1 focus:ring-coral-500"
          value={editVal}
          onChange={(e) =>
            setPhoneEdits((prev) => ({
              ...prev,
              [rowId]: e.target.value,
            }))
          }
        />
      )
    }

    // If original != cleaned, show "original → cleaned"
    if (originalVal !== cleanedVal) {
      return (
        <span>
          <span className="text-xs text-muted-foreground mr-1">{originalVal}</span>
          <span className="text-xs text-muted-foreground">→</span>{' '}
          <span className="font-bold">{cleanedVal}</span>
        </span>
      )
    } else {
      // Otherwise they match
      return <span>{cleanedVal}</span>
    }
  }

  function handleBack() {
    navigate('/dataCleaning')
  }
  function handleNext() {
    navigate('/export')
  }

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Step Indicator */}
        <StepIndicator currentStep={4} totalSteps={5} className="mb-12" />

        <div className="max-w-7xl mx-auto space-y-4">
          {/* Heading & Subheading */}
          <div>
            <h1
              className="text-h1 font-bold bg-gradient-to-r from-coral-500 to-teal-500 bg-clip-text text-transparent"
              role="heading"
              aria-level={1}
            >
              Preview & Final Review
            </h1>
            <p
              className={`
                text-lg transition-all duration-500 ease-out
                text-text-light/60 dark:text-text-dark/60
                ${isSubheadingVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
              `}
            >
              Review your original and cleaned data in one place
            </p>
          </div>

          {/* Stats Cards (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                      Total Records
                    </p>
                    <p className="text-2xl font-bold">1,234</p>
                  </div>
                  <FileText className="h-8 w-8 text-coral-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                      Cleaned Records
                    </p>
                    <p className="text-2xl font-bold text-status-success">1,180</p>
                  </div>
                  <Check className="h-8 w-8 text-status-success" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-text-light/60 dark:text-text-dark/60">
                      Issues Found
                    </p>
                    <p className="text-2xl font-bold text-status-warning">54</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-status-warning" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Single Table for Both Original & Cleaned */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-coral-500" />
                Merged View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full" role="grid">
                  <thead>
                    <tr className="border-b border-border-light dark:border-border-dark">
                      <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.cleaned.map((row) => {
                      const displayRow = getDisplayRow(row.id)
                      if (!displayRow) return null // In case data mismatch

                      return (
                        <tr
                          key={row.id}
                          className="border-b border-border-light dark:border-border-dark"
                        >
                          {/* Name Cell */}
                          <td className="px-4 py-3 text-sm">
                            {renderCell(row.id, 'name')}
                          </td>
                          {/* Email Cell */}
                          <td className="px-4 py-3 text-sm font-mono">
                            {renderCell(row.id, 'email')}
                          </td>
                          {/* Phone Cell */}
                          <td className="px-4 py-3 text-sm font-mono">
                            {renderCell(row.id, 'phone')}
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRevertRow(row.id)}
                                    className="flex items-center gap-1"
                                  >
                                    <RotateCw className="w-4 h-4" />
                                    {revertedRows.includes(row.id) ? 'Undo' : 'Revert'}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Toggle between original and cleaned data
                                </TooltipContent>
                              </Tooltip>

                              {/* Edit / Save Phone */}
                              {!isEditingRow[row.id] ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleStartEdit(row.id)}
                                      className="flex items-center gap-1"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Edit phone number
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSaveEdit(row.id)}
                                      className="flex items-center gap-1"
                                    >
                                      <Save className="w-4 h-4" />
                                      Save
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Save phone changes
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Wizard Navigation Buttons */}
          <div className="flex justify-between items-center pt-6">
            <Button onClick={handleBack} variant="outline" className="group">
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back
            </Button>
            <Button onClick={handleNext} className="group">
              Next
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
