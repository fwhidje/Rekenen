import type { Operation, SemanticForm } from '../curriculum/types'

// ─── Error taxonomy ───────────────────────────────────────────────────────────
// Source of truth: rekenen_v2_skill_exercise_map.md. `errorType` is null on a
// correct answer; `classifyError` only ever returns a concrete tag.
export type ErrorType =
  | 'off-by-one'
  | 'reversal'
  | 'semantic-narrow'
  | 'near-miss'
  | 'tienvriend-mismatch'
  | 'unclassified'

// ─── Per-question record ──────────────────────────────────────────────────────
export interface AnswerRecord {
  timestamp: number
  skillId: string
  exerciseId: string
  tierId?: string
  op: Operation
  semanticForm?: SemanticForm
  operandA: number
  operandB: number
  correctAnswer: number
  givenAnswer?: number          // present when the exercise reports it
  correct: boolean
  errorType: ErrorType | null   // null when correct
  responseTimeMs?: number
  tapCount?: number             // multi-step exercises (counter / collect)
}

// Everything the classifier needs to tag a wrong answer.
export type ClassifierInput = Pick<
  AnswerRecord,
  'skillId' | 'op' | 'semanticForm' | 'operandA' | 'operandB' | 'correctAnswer' | 'givenAnswer'
>

// Classify a *wrong* answer. Returns 'unclassified' when there isn't enough
// signal (notably when the exercise didn't report a given answer).
export function classifyError(input: ClassifierInput): ErrorType {
  const { skillId, op, semanticForm, operandA, operandB, correctAnswer, givenAnswer } = input

  if (givenAnswer === undefined) return 'unclassified'

  if (Math.abs(givenAnswer - correctAnswer) === 1) return 'off-by-one'

  // Semantic narrowing: a verschil/aanvullen problem solved as if it were a
  // simpler operation. Checked before generic reversal so the tag is specific.
  if (semanticForm === 'verschil' || semanticForm === 'aanvullen') {
    if (givenAnswer === operandA + operandB) return 'semantic-narrow' // treated as addition
    if (semanticForm === 'aanvullen' && givenAnswer === operandA - operandB) return 'semantic-narrow' // treated as wegnemen
  }

  // Reversal: operands applied the wrong way round.
  if (op === '-' && (givenAnswer === operandB - operandA || givenAnswer === operandA + operandB)) {
    return 'reversal'
  }
  if (op === 'split' && givenAnswer === operandA + operandB - correctAnswer && correctAnswer !== givenAnswer) {
    return 'reversal' // gave the complementary part
  }

  // Tienvrienden: the pair doesn't make ten.
  if (skillId === 'tienvrienden' && givenAnswer + operandA !== 10) return 'tienvriend-mismatch'

  // Regurgitated one of the operands.
  if (givenAnswer === operandA || givenAnswer === operandB) return 'near-miss'

  return 'unclassified'
}

// ─── Sink ─────────────────────────────────────────────────────────────────────
// The seam between answer capture and storage. This pass ships an in-memory
// implementation only; a LocalStorageDiagnosticsSink can be dropped in later
// without touching the capture sites.
export interface DiagnosticsSink {
  record(r: AnswerRecord): void
  getAll(): AnswerRecord[]
  clear(): void
}

class InMemoryDiagnosticsSink implements DiagnosticsSink {
  private records: AnswerRecord[] = []
  record(r: AnswerRecord): void {
    this.records.push(r)
  }
  getAll(): AnswerRecord[] {
    return this.records
  }
  clear(): void {
    this.records = []
  }
}

// Process-wide singleton for the current session.
export const diagnostics: DiagnosticsSink = new InMemoryDiagnosticsSink()
