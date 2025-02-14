// src/pages/DataCleaning.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { StepIndicator } from '@/components/StepIndicator'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Type,
  Building2,
  Briefcase,
  Save,
  Download,
  Trash2,
} from 'lucide-react'
import { FuzzySlider } from '@/components/FuzzySlider'
import { simulateDuplicates, RecordData } from '@/utils/fuzzy'

// Sample data for dedup
const sampleRecords: RecordData[] = [
  { name: 'John Smith', email: 'john@example.com' },
  { name: 'Jon Smith', email: 'jon@example.com' },
  { name: 'John Smith', email: 'johnsmith@example.com' },
  { name: 'Jane Doe', email: 'jane@example.com' },
]

// SummaryLine: tiny helper for "Off" or bullet summaries
function SummaryLine({
  enabled,
  details,
}: {
  enabled: boolean
  details: (string | null)[]
}) {
  if (!enabled) {
    return <p className="text-xs text-yellow-500 mt-1">(Off)</p>
  }
  const filtered = details.filter(Boolean) as string[]
  if (!filtered.length) return null
  return (
    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
      {filtered.join(' • ')}
    </p>
  )
}

/**
 * We create a custom trigger to show a plus/minus using .PlusMinus class.
 * The actual plus/minus is in an external CSS file:
 * [data-state="open"] .PlusMinus::before { content: '-'; }
 * [data-state="closed"] .PlusMinus::before { content: '+'; }
 */
function CustomAccordionTrigger({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <AccordionTrigger>
      <div
        className={`
          relative flex w-full items-start justify-between
          p-4 text-sm font-semibold 
          hover:bg-orange-100 dark:hover:bg-orange-800/40
          ${className ?? ''}
        `}
      >
        {children}
        <div className="PlusMinus w-4 h-4 text-center text-sm font-bold shrink-0" />
      </div>
    </AccordionTrigger>
  )
}

// Normalization toggles
interface NormalizationSettings {
  email: {
    enabled: boolean
    lowercase: boolean
    trimWhitespace: boolean
  }
  phone: {
    enabled: boolean
    format: 'e164' | 'national' | 'international'
    removeSpaces: boolean
    addCountryCode: boolean
  }
  name: {
    enabled: boolean
    casing: 'title' | 'upper' | 'lower' | 'none'
    trimWhitespace: boolean
    removeMiddleName: boolean
  }
  company: {
    enabled: boolean
    removeInc: boolean
    removeLLC: boolean
  }
  jobTitle: {
    enabled: boolean
    casing: 'title' | 'upper' | 'lower' | 'none'
  }
}

const DEFAULT_NORMALIZATION: NormalizationSettings = {
  email: {
    enabled: false,
    lowercase: true,
    trimWhitespace: true,
  },
  phone: {
    enabled: false,
    format: 'e164',
    removeSpaces: true,
    addCountryCode: true,
  },
  name: {
    enabled: false,
    casing: 'title',
    trimWhitespace: true,
    removeMiddleName: false,
  },
  company: {
    enabled: false,
    removeInc: true,
    removeLLC: false,
  },
  jobTitle: {
    enabled: false,
    casing: 'title',
  },
}

// For saving templates
interface Template {
  name: string
  settings: NormalizationSettings
}

export default function DataCleaning() {
  const navigate = useNavigate()
  const { toast } = useToast()

  // Subheading fade in
  const [isSubheadingVisible, setIsSubheadingVisible] = useState(false)

  // Consolidated slider state
  const [threshold, setThreshold] = useState(95)
  const [duplicateCount, setDuplicateCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Normalization toggles
  const [normalization, setNormalization] = useState<NormalizationSettings>(DEFAULT_NORMALIZATION)

  // Processing steps
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  // TEMPLATES in localStorage
  const [templates, setTemplates] = useState<Template[]>(() => {
    const saved = localStorage.getItem('dcTemplates')
    return saved ? JSON.parse(saved) : []
  })
  const [templateName, setTemplateName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Effects
  useEffect(() => {
    const t = setTimeout(() => setIsSubheadingVisible(true), 300)
    return () => clearTimeout(t)
  }, [])

  // Fuzzy duplicates effect
  useEffect(() => {
    setIsUpdating(true)
    const timer = setTimeout(() => {
      const dupes = simulateDuplicates(threshold, sampleRecords)
      setDuplicateCount(dupes)
      setIsUpdating(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [threshold])

  // Handling the slider
  const handleThresholdChange = (value: number) => {
    setThreshold(value)
  }

  // Normalization toggles
  function handleNormalizationChange(
    type: keyof NormalizationSettings,
    field: string,
    value: boolean | string
  ) {
    setNormalization((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }))
    if (field === 'enabled') {
      const msg = value
        ? `${type.toUpperCase()} Normalization Enabled`
        : `${type.toUpperCase()} Normalization Disabled`
      toast({
        title: 'Normalization Updated',
        description: msg,
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      })
    }
  }

  // Save / Load template
  const handleSaveTemplate = (e?: React.FormEvent) => {
    e?.preventDefault()
    const name = templateName.trim()
    if (!name) {
      toast({
        title: 'Template Name Required',
        description: 'Please enter a name for the template.',
        icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
      })
      return
    }
    const newTmpl: Template = { name, settings: normalization }
    const existingIndex = templates.findIndex((t) => t.name === name)
    let updated: Template[]
    if (existingIndex >= 0) {
      updated = templates.map((t, i) => (i === existingIndex ? newTmpl : t))
    } else {
      updated = [...templates, newTmpl]
    }
    setTemplates(updated)
    localStorage.setItem('dcTemplates', JSON.stringify(updated))
    setSelectedTemplate(name)

    toast({
      title: 'Template Saved',
      description: `Template "${name}" saved successfully.`,
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    })
  }

  const handleLoadTemplate = (tmplName: string) => {
    const tmpl = templates.find((t) => t.name === tmplName)
    if (!tmpl) return
    setNormalization(tmpl.settings)
    setSelectedTemplate(tmplName)
    toast({
      title: 'Template Loaded',
      description: `Loaded template "${tmplName}".`,
      icon: <Download className="w-5 h-5 text-green-500" />,
    })
  }

  const handleDeleteTemplate = (tmplName: string) => {
    const filtered = templates.filter((t) => t.name !== tmplName)
    setTemplates(filtered)
    localStorage.setItem('dcTemplates', JSON.stringify(filtered))
    if (selectedTemplate === tmplName) {
      setSelectedTemplate(null)
    }
    toast({
      title: 'Template Deleted',
      description: `Template "${tmplName}" removed.`,
      icon: <Trash2 className="w-5 h-5 text-red-600" />,
    })
  }

  // Next => simulate cleaning
  const timerRef = useRef<number | null>(null)
  const handleNext = () => {
    setIsProcessing(true)
    setProgress(0)

    const steps = [
      { p: 25, delay: 800 },
      { p: 50, delay: 1000 },
      { p: 75, delay: 600 },
      { p: 100, delay: 400 },
    ]
    let i = 0

    function run() {
      if (i < steps.length) {
        const s = steps[i]
        setProgress(s.p)
        i++
        timerRef.current = window.setTimeout(run, s.delay)
      } else {
        timerRef.current = window.setTimeout(() => {
          setIsProcessing(false)
          navigate('/preview')
        }, 500)
      }
    }
    run()
  }

  const handleBack = () => navigate('/somePreviousPage')

  useEffect(() => {
    return () => {
      // Cleanup any leftover timeouts to prevent memory leaks
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  function getProcessMessage() {
    if (progress < 25) return 'Initializing...'
    if (progress < 50) return 'Normalizing data...'
    if (progress < 75) return 'Removing duplicates...'
    if (progress < 100) return 'Validating results...'
    return 'Complete!'
  }

  return (
    <ToastProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 px-4 py-6 sm:px-6 md:px-8 lg:px-16 space-y-8">
          <StepIndicator currentStep={3} totalSteps={5} className="mb-6" />

          <div className="max-w-4xl mx-auto space-y-3">
            <h1
              className="
                text-3xl sm:text-4xl font-bold
                bg-gradient-to-r from-orange-400 to-teal-500
                bg-clip-text text-transparent
              "
            >
              Data Cleaning
            </h1>
            <p
              className={`
                text-base md:text-lg transition-all duration-500 ease-out
                ${
                  isSubheadingVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2'
                }
                text-neutral-500 dark:text-neutral-400
              `}
            >
              Configure deduplication and normalization settings
            </p>
          </div>

          {/* Fuzzy Slider: threshold + duplicate count */}
          <div
            className="
              max-w-4xl mx-auto rounded-xl border border-neutral-200 dark:border-neutral-700
              bg-white dark:bg-neutral-800 shadow-sm p-4
            "
          >
            <h2 className="text-xl font-semibold mb-4">Fuzzy Matching Settings</h2>
            <FuzzySlider
              threshold={threshold}
              onChange={handleThresholdChange}
              duplicateCount={duplicateCount}
              isDragging={isDragging}
              isUpdating={isUpdating}
            />
          </div>

          {/* Normalization Accordion */}
          <Accordion
            type="single"
            collapsible={false}
            className="max-w-4xl mx-auto flex flex-col space-y-4 mt-6"
          >
            {/* EMAIL */}
            <AccordionItem
              value="email"
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg"
            >
              <CustomAccordionTrigger>
                <div className="flex flex-col">
                  <span className="flex items-center gap-2">
                    <div
                      className={`
                        p-2 rounded-lg
                        ${
                          normalization.email.enabled
                            ? 'bg-orange-400 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300'
                        }
                      `}
                    >
                      <Mail className="h-5 w-5" />
                    </div>
                    <span>Email</span>
                  </span>
                  <SummaryLine
                    enabled={normalization.email.enabled}
                    details={[
                      normalization.email.enabled
                        ? `Lowercase: ${normalization.email.lowercase ? 'On' : 'Off'}`
                        : null,
                      normalization.email.enabled
                        ? `Trim: ${normalization.email.trimWhitespace ? 'On' : 'Off'}`
                        : null,
                    ]}
                  />
                </div>
              </CustomAccordionTrigger>
              <AccordionContent className="p-4 space-y-4">
                <div className="flex items-center justify-between bg-orange-100 dark:bg-orange-900/30 rounded-md p-2">
                  <label className="text-sm font-medium">Enable Email Normalization</label>
                  <Switch
                    checked={normalization.email.enabled}
                    onCheckedChange={(val) =>
                      handleNormalizationChange('email', 'enabled', val)
                    }
                    className="data-[state=checked]:bg-orange-400"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Lowercase</label>
                  <Switch
                    checked={normalization.email.lowercase}
                    onCheckedChange={(val) =>
                      handleNormalizationChange('email', 'lowercase', val)
                    }
                    disabled={!normalization.email.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Trim whitespace</label>
                  <Switch
                    checked={normalization.email.trimWhitespace}
                    onCheckedChange={(val) =>
                      handleNormalizationChange('email', 'trimWhitespace', val)
                    }
                    disabled={!normalization.email.enabled}
                  />
                </div>

                {/* Preview */}
                <div className="bg-neutral-100 dark:bg-neutral-700 rounded-lg p-3">
                  <h4 className="text-sm font-semibold mb-2">Preview</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Original
                      </p>
                      <code className="text-sm">User.Name@EXAMPLE.com</code>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Normalized
                      </p>
                      <code
                        className={`text-sm ${
                          normalization.email.enabled ? 'text-orange-500' : ''
                        }`}
                      >
                        {normalization.email.enabled
                          ? `${
                              normalization.email.lowercase
                                ? 'user.name'
                                : 'User.Name'
                            }@example.com`
                          : 'User.Name@EXAMPLE.com'}
                      </code>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* PHONE */}
            <AccordionItem
              value="phone"
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg"
            >
              <CustomAccordionTrigger>
                <div className="flex flex-col">
                  <span className="flex items-center gap-2">
                    <div
                      className={`
                        p-2 rounded-lg
                        ${
                          normalization.phone.enabled
                            ? 'bg-orange-400 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300'
                        }
                      `}
                    >
                      <Phone className="h-5 w-5" />
                    </div>
                    <span>Phone</span>
                  </span>
                  <SummaryLine
                    enabled={normalization.phone.enabled}
                    details={[
                      normalization.phone.enabled
                        ? `Format: ${normalization.phone.format}`
                        : null,
                      normalization.phone.enabled
                        ? `Spaces: ${normalization.phone.removeSpaces ? 'On' : 'Off'}`
                        : null,
                      normalization.phone.enabled
                        ? `Country: ${
                            normalization.phone.addCountryCode ? 'On' : 'Off'
                          }`
                        : null,
                    ]}
                  />
                </div>
              </CustomAccordionTrigger>

              <AccordionContent className="p-4 space-y-4">
                <div className="flex items-center justify-between bg-orange-100 dark:bg-orange-900/30 rounded-md p-2">
                  <label className="text-sm font-medium">Enable Phone Normalization</label>
                  <Switch
                    checked={normalization.phone.enabled}
                    onCheckedChange={(val) =>
                      handleNormalizationChange('phone', 'enabled', val)
                    }
                    className="data-[state=checked]:bg-orange-400"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Format</label>
                  <Select
                    value={normalization.phone.format}
                    onValueChange={(val) =>
                      handleNormalizationChange('phone', 'format', val)
                    }
                    disabled={!normalization.phone.enabled}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="e164">E.164 (+12345678900)</SelectItem>
                      <SelectItem value="national">(234) 567-8900</SelectItem>
                      <SelectItem value="international">+1 234-567-8900</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Remove spaces</label>
                  <Switch
                    checked={normalization.phone.removeSpaces}
                    onCheckedChange={(val) =>
                      handleNormalizationChange('phone', 'removeSpaces', val)
                    }
                    disabled={!normalization.phone.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Add country code</label>
                  <Switch
                    checked={normalization.phone.addCountryCode}
                    onCheckedChange={(val) =>
                      handleNormalizationChange('phone', 'addCountryCode', val)
                    }
                    disabled={!normalization.phone.enabled}
                  />
                </div>

                <div className="bg-neutral-100 dark:bg-neutral-700 rounded-lg p-3">
                  <h4 className="text-sm font-semibold mb-2">Preview</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Original
                      </p>
                      <code className="text-sm">(555) 123-4567</code>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Normalized
                      </p>
                      <code
                        className={`text-sm ${
                          normalization.phone.enabled ? 'text-orange-500' : ''
                        }`}
                      >
                        {normalization.phone.enabled
                          ? normalization.phone.format === 'e164'
                            ? '+15551234567'
                            : normalization.phone.format === 'national'
                            ? '(555) 123-4567'
                            : '+1 555-123-4567'
                          : '(555) 123-4567'}
                      </code>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* NAME */}
            <AccordionItem
              value="name"
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg"
            >
              <CustomAccordionTrigger>
                <div className="flex flex-col">
                  <span className="flex items-center gap-2">
                    <div
                      className={`
                        p-2 rounded-lg
                        ${
                          normalization.name.enabled
                            ? 'bg-orange-400 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300'
                        }
                      `}
                    >
                      <Type className="h-5 w-5" />
                    </div>
                    <span>Name</span>
                  </span>
                  <SummaryLine
                    enabled={normalization.name.enabled}
                    details={[
                      normalization.name.enabled
                        ? `Casing: ${normalization.name.casing}`
                        : null,
                      normalization.name.enabled
                        ? `Trim: ${normalization.name.trimWhitespace ? 'On' : 'Off'}`
                        : null,
                      normalization.name.enabled
                        ? `Middle: ${
                            normalization.name.removeMiddleName ? 'Removed' : 'Keep'
                          }`
                        : null,
                    ]}
                  />
                </div>
              </CustomAccordionTrigger>

              <AccordionContent className="p-4 space-y-4">
                <div className="flex items-center justify-between bg-orange-100 dark:bg-orange-900/30 rounded-md p-2">
                  <label className="text-sm font-medium">Enable Name Normalization</label>
                  <Switch
                    checked={normalization.name.enabled}
                    onCheckedChange={(val) =>
                      handleNormalizationChange('name', 'enabled', val)
                    }
                    className="data-[state=checked]:bg-orange-400"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Casing</label>
                  <Select
                    value={normalization.name.casing}
                    onValueChange={(val) =>
                      handleNormalizationChange('name', 'casing', val)
                    }
                    disabled={!normalization.name.enabled}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Title Case</SelectItem>
                      <SelectItem value="upper">UPPERCASE</SelectItem>
                      <SelectItem value="lower">lowercase</SelectItem>
                      <SelectItem value="none">No Change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Trim whitespace</label>
                  <Switch
                    checked={normalization.name.trimWhitespace}
                    onCheckedChange={(val) =>
                      handleNormalizationChange('name', 'trimWhitespace', val)
                    }
                    disabled={!normalization.name.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Remove middle name</label>
                  <Switch
                    checked={normalization.name.removeMiddleName}
                    onCheckedChange={(val) =>
                      handleNormalizationChange('name', 'removeMiddleName', val)
                    }
                    disabled={!normalization.name.enabled}
                  />
                </div>

                <div className="bg-neutral-100 dark:bg-neutral-700 rounded-lg p-3">
                  <h4 className="text-sm font-semibold mb-2">Preview</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Original
                      </p>
                      <code className="text-sm">john michael smith</code>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Normalized
                      </p>
                      <code
                        className={`text-sm ${
                          normalization.name.enabled ? 'text-orange-500' : ''
                        }`}
                      >
                        {normalization.name.enabled
                          ? (() => {
                              let nm = 'john michael smith'
                              if (normalization.name.removeMiddleName) {
                                nm = 'john smith'
                              }
                              switch (normalization.name.casing) {
                                case 'title':
                                  return nm
                                    .split(' ')
                                    .map(
                                      (w) => w.charAt(0).toUpperCase() + w.slice(1)
                                    )
                                    .join(' ')
                                case 'upper':
                                  return nm.toUpperCase()
                                case 'lower':
                                  return nm.toLowerCase()
                                default:
                                  return nm
                              }
                            })()
                          : 'john michael smith'}
                      </code>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* COMPANY */}
            <AccordionItem
              value="company"
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg"
            >
              <CustomAccordionTrigger>
                <div className="flex flex-col">
                  <span className="flex items-center gap-2">
                    <div
                      className={`
                        p-2 rounded-lg
                        ${
                          normalization.company.enabled
                            ? 'bg-orange-400 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300'
                        }
                      `}
                    >
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span>Company</span>
                  </span>
                  <SummaryLine
                    enabled={normalization.company.enabled}
                    details={[
                      normalization.company.enabled
                        ? `Remove Inc: ${
                            normalization.company.removeInc ? 'Yes' : 'No'
                          }`
                        : null,
                      normalization.company.enabled
                        ? `Remove LLC: ${
                            normalization.company.removeLLC ? 'Yes' : 'No'
                          }`
                        : null,
                    ]}
                  />
                </div>
              </CustomAccordionTrigger>
              <AccordionContent className="p-4 space-y-4">
                <div className="flex items-center justify-between bg-orange-100 dark:bg-orange-900/30 rounded-md p-2">
                  <label className="text-sm font-medium">Enable Company Normalization</label>
                  <Switch
                    checked={normalization.company.enabled}
                    onCheckedChange={(val) =>
                      handleNormalizationChange('company', 'enabled', val)
                    }
                    className="data-[state=checked]:bg-orange-400"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Remove "Inc."</label>
                  <Switch
                    checked={normalization.company.removeInc}
                    onCheckedChange={(val) =>
                      handleNormalizationChange('company', 'removeInc', val)
                    }
                    disabled={!normalization.company.enabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Remove "LLC"</label>
                  <Switch
                     checked={normalization.company.removeLLC}
                    onCheckedChange={(val) =>
                      handleNormalizationChange('company', 'removeLLC', val)
                    }
                    disabled={!normalization.company.enabled}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* JOB TITLE */}
            <AccordionItem
              value="jobTitle"
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg"
            >
              <CustomAccordionTrigger>
                <div className="flex flex-col">
                  <span className="flex items-center gap-2">
                    <div
                      className={`
                        p-2 rounded-lg
                        ${
                          normalization.jobTitle.enabled
                            ? 'bg-orange-400 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300'
                        }
                      `}
                    >
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <span>Job Title</span>
                  </span>
                  <SummaryLine
                    enabled={normalization.jobTitle.enabled}
                    details={[
                      normalization.jobTitle.enabled
                        ? `Casing: ${normalization.jobTitle.casing}`
                        : null,
                    ]}
                  />
                </div>
              </CustomAccordionTrigger>
              <AccordionContent className="p-4 space-y-4">
                <div className="flex items-center justify-between bg-orange-100 dark:bg-orange-900/30 rounded-md p-2">
                  <label className="text-sm font-medium">Enable Job Title Normalization</label>
                  <Switch
                    checked={normalization.jobTitle.enabled}
                    onCheckedChange={(val) =>
                      handleNormalizationChange('jobTitle', 'enabled', val)
                    }
                    className="data-[state=checked]:bg-orange-400"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Casing</label>
                  <Select
                    value={normalization.jobTitle.casing}
                    onValueChange={(val) =>
                      handleNormalizationChange('jobTitle', 'casing', val)
                    }
                    disabled={!normalization.jobTitle.enabled}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Title Case</SelectItem>
                      <SelectItem value="upper">UPPERCASE</SelectItem>
                      <SelectItem value="lower">lowercase</SelectItem>
                      <SelectItem value="none">No Change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Save / Load Templates */}
          <div
            className="
              max-w-4xl mx-auto mt-6 p-4 border border-neutral-200 dark:border-neutral-700
              rounded-xl bg-white dark:bg-neutral-800 shadow-sm
            "
          >
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Save className="h-5 w-5" />
              Save/Load Templates
            </h3>

            {selectedTemplate && (
              <p className="text-sm text-green-600 mb-2">
                Currently loaded: <span className="font-medium">{selectedTemplate}</span>
              </p>
            )}

            <form onSubmit={handleSaveTemplate} className="flex items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="Template name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="
                  border border-neutral-200 dark:border-neutral-700
                  bg-transparent rounded-md px-3 py-2 text-sm
                  focus:outline-none focus:ring-1 focus:ring-orange-400
                  w-52
                "
              />
              <Button type="submit" className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save
              </Button>
            </form>

            {templates.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Load or manage a saved template:
                </p>
                <div className="flex flex-col gap-2">
                  {templates.map((t) => (
                    <div key={t.name} className="flex items-center justify-between gap-4">
                      <Button
                        variant="outline"
                        onClick={() => handleLoadTemplate(t.name)}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {t.name}
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteTemplate(t.name)}
                        className="flex items-center gap-1 text-sm px-2 py-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons + Processing */}
          <div className="max-w-4xl mx-auto pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <Button
                onClick={handleBack}
                variant="outline"
                className="group transition-all duration-200 hover:border-orange-400 text-sm px-4 py-2"
                disabled={isProcessing}
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="group transition-all duration-200 min-w-[100px] text-sm px-4 py-2"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {progress}%
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>

            {isProcessing && (
              <div
                className="
                  p-4 rounded-lg border border-neutral-200 dark:border-neutral-700
                  bg-neutral-100 dark:bg-neutral-800
                  transition-all duration-300 ease-in-out
                "
                role="status"
                aria-live="polite"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-neutral-300 dark:border-neutral-700 pb-2">
                    <div className="text-neutral-600 dark:text-neutral-400">
                      <p>1. Normalizing Data</p>
                      <p>2. Removing Duplicates</p>
                      <p>3. Validating Results</p>
                      <p>4. Finalizing</p>
                    </div>
                    <span className="text-orange-400 font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 bg-neutral-300 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {getProcessMessage()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </ToastProvider>
  )
}