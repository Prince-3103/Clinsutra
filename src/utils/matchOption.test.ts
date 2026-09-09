import { describe, expect, it } from "vitest"
import { matchSpokenOption } from "./matchOption"
import { CHIEF_COMPLAINT_QUESTION } from "@/data"

const options = CHIEF_COMPLAINT_QUESTION.options

describe("matchSpokenOption", () => {
  it("selects the single clearly-matching option (English)", () => {
    expect(matchSpokenOption("I have fever", options, "en")).toEqual({
      status: "match",
      optionId: "fever",
    })
    // "chest pain" hits chest+pain (2) vs stomach's pain (1) — a clear winner.
    expect(matchSpokenOption("chest pain", options, "en")).toEqual({
      status: "match",
      optionId: "chest-pain",
    })
  })

  it("matches a verbatim full label", () => {
    expect(matchSpokenOption("Something else", options, "en")).toEqual({
      status: "match",
      optionId: "other",
    })
  })

  it("reports ambiguity when options tie on shared keywords", () => {
    // "pain" appears in both "Chest pain…" and "Stomach pain…".
    expect(matchSpokenOption("pain", options, "en")).toEqual({
      status: "ambiguous",
      optionId: null,
    })
  })

  it("reports no match for unrelated speech", () => {
    expect(matchSpokenOption("hello there", options, "en")).toEqual({
      status: "none",
      optionId: null,
    })
    expect(matchSpokenOption("   ", options, "en")).toEqual({
      status: "none",
      optionId: null,
    })
  })

  it("matches in Hindi, respecting the selected language", () => {
    // "I have fever" in Hindi -> the fever option.
    expect(matchSpokenOption("मुझे बुखार है", options, "hi")).toEqual({
      status: "match",
      optionId: "fever",
    })
  })
})
