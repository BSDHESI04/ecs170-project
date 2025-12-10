export const FRAMEWORKS = ["utilitarianism", "virtue", "egoism_altruism", "deontology"];

export const PROBLEM_POINTS = {
  problem_1: {
    weight: 1,
    choices: {
      pull_lever: { utilitarianism: +1, virtue: +1, egoism_altruism: +1, deontology: -1 },
      do_nothing: { utilitarianism: -1, virtue: 0,  egoism_altruism: -1, deontology: +1 }
    }
  },
  problem_2: {
    weight: 1,
    choices: {
      pull_lever: { utilitarianism: +1, virtue: +1, egoism_altruism: +1, deontology: -1 },
      do_nothing: { utilitarianism: -1, virtue: 0,  egoism_altruism: -1, deontology: +1 }
    }
  }
  // more problems will be added here
};

export function normalizeChoiceKey(s = "") {
  const t = s.toLowerCase();
  if (t.includes("pull")) return "pull_lever";
  if (t.includes("do") || t.includes("nothing")) return "do_nothing";
  return t;
}

// fetch the framework points for a given scenario and choice, and apply that scenario’s weight
export function scoreChoice(problemId, choiceKey) {
  const p = PROBLEM_POINTS[problemId];
  if (!p) return null;
  const w = p.weight ?? 1;
  const src = p.choices[choiceKey] || {};
  const out = {};
  for (const k of Object.keys(src)) out[k] = src[k] * w;
  return out;
}
