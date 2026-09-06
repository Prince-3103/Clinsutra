import { COMPLAINTS, RED_FLAG_RULES } from "@/data"
import type {
  Answer,
  ClinicalSignal,
  ComplaintId,
  Priority,
  Question,
  RedFlagAssessment,
} from "@/types"

const PRIORITY_ORDER: Record<Priority, number> = { P1: 0, P2: 1, P3: 2 }

/** Collects the signals carried by every option the patient selected. */
export function collectSignals(
  questions: Question[],
  answers: Answer[],
): ClinicalSignal[] {
  const selected = new Set(answers.flatMap((answer) => answer.optionIds))
  const signals = new Set<ClinicalSignal>()

  for (const question of questions) {
    for (const option of question.options) {
      if (!selected.has(option.id)) continue
      for (const signal of option.signals ?? []) signals.add(signal)
    }
  }

  return [...signals]
}

/**
 * Runs the demo triage rules.
 *
 * This produces a queue priority and a list of human-readable reasons. It is
 * explicitly not a diagnosis and never suggests treatment — callers must render
 * `NOT_A_DIAGNOSIS_NOTICE` alongside any result. The backend will replace this
 * with a clinically governed service; the return shape stays the same.
 */
export function evaluateRedFlags(
  complaintId: ComplaintId | null,
  answers: Answer[],
): RedFlagAssessment {
  if (!complaintId) {
    return { triggered: false, priority: "P3", ruleIds: [], reasons: [] }
  }

  const questions = COMPLAINTS[complaintId].followUps
  const signals = new Set(collectSignals(questions, answers))

  const fired = RED_FLAG_RULES.filter((rule) => {
    if (rule.complaint && rule.complaint !== complaintId) return false
    return rule.requires.every((signal) => signals.has(signal))
  })

  if (fired.length === 0) {
    return { triggered: false, priority: "P3", ruleIds: [], reasons: [] }
  }

  const priority = fired.reduce<Priority>(
    (highest, rule) =>
      PRIORITY_ORDER[rule.priority] < PRIORITY_ORDER[highest] ? rule.priority : highest,
    "P3",
  )

  return {
    triggered: true,
    priority,
    ruleIds: fired.map((rule) => rule.id),
    reasons: fired.map((rule) => rule.reason),
  }
}
