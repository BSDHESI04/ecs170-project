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
      "A trolley is going down a track. Do you pull the lever to let it run over your family or do nothing to allow the trolley to run straight over two random families",
    choices: ["pull_lever", "do_nothing"]
  },
  problem_2: {
    text:
      "Run over a criminal instead of an innocent civilian?",
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

export async function getAiChoice({ promptId, problem, preferredModel = "chatgpt", humanStats }) {
  const model = FRIENDLY_TO_BACKEND_MODEL[preferredModel] || "gpt";

  const counts = humanStats?.counts || { pull_lever: 0, do_nothing: 0 };
  const examples = humanStats?.examples || [];

  const humanSection =
    `Human data (this session):\n` +
    `- pull_lever: ${counts.pull_lever}\n` +
    `- do_nothing: ${counts.do_nothing}\n` +
    (examples.length ? `Recent human choices: ${examples.join(", ")}\n` : ``);

  const instruction =
    `You are deciding in a trolley problem.\n` +
    `Scenario: ${problem?.text}\n` +
    `Choices: ${problem?.choices?.join(", ")}\n\n` +
    humanSection +
    `Use the human data as a weak prior. You may disagree if your ethical reasoning justifies it.\n` +
    `Return ONLY a single-line JSON object with keys "choice" and "rationale".\n` +
    `Allowed "choice" values: "pull_lever" or "do_nothing".\n` +
    `"rationale" should be 2 sentences.\n` +
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
