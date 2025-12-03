// src/lib/api.js

const FRIENDLY_TO_BACKEND_MODEL = {
  chatgpt: "gpt",
  claude: "claude",
  grok: "grok"
};

// Local problem bank so we do not hit missing routes
const LOCAL_IDS = ["problem_1", "problem_2"];
const LOCAL_PROBLEMS = {
  problem_1: {
    text:
      "A runaway trolley is headed toward five people. You can pull a lever to divert it to a side track with one person.",
    choices: ["pull_lever", "do_nothing"]
  },
  problem_2: {
    text:
      "A trolley approaches a fork. Diverting saves a group but harms one worker on the side track.",
    choices: ["pull_lever", "do_nothing"]
  }
};

// -------------- Problems --------------
export async function fetchProblemIds() {
  return LOCAL_IDS;
}
export async function fetchProblem(id) {
  return LOCAL_PROBLEMS[id];
}

// -------------- Logging --------------
export async function submitHumanChoice({ promptId, choice }) {
  // Try to log if your backend has this route. If not, ignore errors.
  try {
    const r = await fetch("/api/submit-human-choice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promptId, choice })
    });
    if (r.ok) return await r.json();
  } catch {}
  return { ok: true, localOnly: true };
}

// -------------- AI choice with rationale --------------
function inferChoiceFromText(text, choices = ["pull_lever", "do_nothing"]) {
  const low = (text || "").toLowerCase();
  if (low.includes("do_nothing")) return "do_nothing";
  if (low.includes("pull_lever")) return "pull_lever";
  return choices[0];
}
function tryParseJSON(text) {
  try { return JSON.parse(text); } catch {}
  const m = (text || "").match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

export async function getAiChoice({ promptId, problem, preferredModel = "chatgpt" }) {
  const model = FRIENDLY_TO_BACKEND_MODEL[preferredModel] || "gpt";

  const instruction =
    `You are deciding in a trolley problem.\n` +
    `Scenario: ${problem?.text}\n` +
    `Choices: ${problem?.choices?.join(", ")}\n\n` +
    `Return ONLY a single-line JSON object with keys "choice" and "rationale".\n` +
    `Allowed "choice" values: "pull_lever" or "do_nothing".\n` +
    `"rationale" should be 1 to 2 sentences.\n` +
    `Example: {"choice":"pull_lever","rationale":"..."}`;

  const r = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt: instruction })
  });

  const out = r.ok ? await r.json() : { result: "" };
  const text = typeof out?.result === "string" ? out.result : JSON.stringify(out?.result || "");
  const parsed = tryParseJSON(text);

  const aiChoice = parsed?.choice || inferChoiceFromText(text, problem?.choices);
  const rationale = parsed?.rationale || text.trim();

  return { aiChoice, raw: text, rationale };
}
