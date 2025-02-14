// src/components/FuzzySlider.tsx

import React from 'react'
import { Percent, AlertTriangle, Users } from 'lucide-react'

interface FuzzySliderProps {
  threshold: number
  onChange: (value: number) => void
  duplicateCount: number
  min?: number
  max?: number
  isDragging: boolean
  isUpdating: boolean
}

/**
 * A dedicated slider component for controlling fuzzy threshold.
 * All styling handled via Tailwind classes.
 */
export function FuzzySlider({
  threshold,
  onChange,
  duplicateCount,
  min = 80,
  max = 95,
  isDragging,
  isUpdating,
}: FuzzySliderProps) {
  // For a linear background fill from min..max:
  const fillPercent = ((threshold - min) / (max - min)) * 100
  const sliderBg = `linear-gradient(to right, #F2994A 0%, #F2994A ${fillPercent}%, #E2E2E2 ${fillPercent}%, #E2E2E2 100%)`

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(Number(e.target.value))
  }

  return (
    <div className="space-y-4">
      {/* Label & Display */}
      <div className="flex items-center justify-between flex-wrap">
        <label
          htmlFor="fuzzy-slider"
          className="text-sm font-medium flex items-center gap-2"
        >
          <Percent className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
          Similarity Threshold
        </label>
        <span
          className={`
            px-3 py-1 rounded-full text-sm font-bold text-[#F2994A]
            ${isDragging ? 'bg-[#F2994A]/20' : 'bg-[#F2994A]/10'}
            transition-all duration-200
            ${isUpdating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
          `}
        >
          {threshold}%
        </span>
      </div>

      {/* Range Input */}
      <input
        id="fuzzy-slider"
        type="range"
        min={min}
        max={max}
        step={1}
        value={threshold}
        onChange={handleSlider}
        style={{ background: sliderBg }}
        className="
          appearance-none w-full h-2 rounded-full outline-none cursor-pointer
          focus:ring-2 focus:ring-offset-2 focus:ring-orange-400
        "
        aria-label="Similarity Threshold"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={threshold}
      />

      {/* Duplicate Count */}
      <div
        className={`
          p-3 rounded-lg border border-neutral-200 dark:border-neutral-700
          bg-neutral-100 dark:bg-neutral-800
          transition-all duration-200
          ${isUpdating ? 'opacity-50 scale-[0.99]' : 'opacity-100 scale-100'}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
            <span className="text-sm font-medium">Potential duplicates detected:</span>
          </div>
          <span className="font-bold text-[#F2994A] text-sm">{duplicateCount}</span>
        </div>
        <p className="text-xs mt-2 text-neutral-500 dark:text-neutral-400">
          Records with similarity above {threshold}% will be flagged as potential duplicates
        </p>
      </div>

      {/* Explanation */}
      <div className="text-sm text-neutral-600 dark:text-neutral-300">
        Weighted 40% Name, 60% Email.
      </div>

      {/* Warning Below 85% */}
      {threshold < 85 && (
        <div
          className="
            flex items-start gap-2 p-3 rounded-lg
            bg-[#F2C94C]/10 text-[#F2C94C] border border-[#F2C94C]/40
            mt-4
          "
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">High threshold recommended</p>
            <p className="mt-1 text-[#F2C94C]/80">
              Going below 85% might introduce more false positives.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
