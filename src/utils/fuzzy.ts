// src/utils/fuzzy.ts

/**
 * Define a record type that includes at least a name and email.
 * Extend or modify as needed for your data model.
 */
export interface RecordData {
  name: string
  email: string
}

/**
 * Basic string similarity function:
 * Returns 1 if strings are exactly equal,
 * 0.8 if one contains the other,
 * else ratio of shared characters to total unique characters.
 */
export function calcSim(a: string, b: string): number {
  const s1 = a.toLowerCase()
  const s2 = b.toLowerCase()
  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.8

  const set1 = new Set(s1)
  const set2 = new Set(s2)
  const common = new Set([...set1].filter((x) => set2.has(x)))

  return common.size / Math.max(set1.size, set2.size)
}

/**
 * Simulates how many duplicates are detected above a certain threshold.
 * Weighted 40% Name, 60% Email.
 */
export function simulateDuplicates(
  threshold: number,
  records: RecordData[]
): number {
  let count = 0
  const tVal = threshold / 100

  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const r1 = records[i]
      const r2 = records[j]
      const nameSim = calcSim(r1.name, r2.name)
      const emailSim = calcSim(r1.email, r2.email)
      const overall = nameSim * 0.4 + emailSim * 0.6

      if (overall > tVal) count++
    }
  }
  return count
}
