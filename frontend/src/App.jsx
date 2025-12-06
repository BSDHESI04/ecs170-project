import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import StartScreen from "./StartScreen.jsx";
import TrolleyUI from "./TrolleyUI.jsx";

import {
  fetchProblemIds,
  fetchProblem,
  submitHumanChoice,
  getAiChoice,
} from "./api.js";

const MODELS = ["chatgpt", "grok", "claude"];



function pretty(label) {
  return (label || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
function downloadText(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function makeAnonId() {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `anon_${n}`;
}

function normalizeKey(k = "") {
  const s = k.toLowerCase();
  if (s.includes("pull")) return "pull_lever";
  if (s.includes("do") || s.includes("nothing")) return "do_nothing";
  return k;
}
function sessionStatsForPrompt(decisions, promptId) {
  const rows = decisions.filter(d => d.scenario_id === promptId && d.human_choice);
  const counts = { pull_lever: 0, do_nothing: 0 };
  for (const r of rows) counts[normalizeKey(r.human_choice)]++;
  const examples = rows.slice(-3).map(r => normalizeKey(r.human_choice));
  return { counts, examples };
}

export default function App() {
  const [playerId] = useState(makeAnonId);

  const [started, setStarted] = useState(false);

  const [problemIds, setProblemIds] = useState([]);
  const [index, setIndex] = useState(0);
  const [problem, setProblem] = useState(null);
  const [problemStartAt, setProblemStartAt] = useState(null);

  const [decisions, setDecisions] = useState([]);
  const [aiMode, setAiMode] = useState(false);
  const [humanDone, setHumanDone] = useState(false);

  const [aiResults, setAiResults] = useState({});

  const [revealed, setRevealed] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  const [allowSave, setAllowSave] = useState(true);
  const [autosaveEvery, setAutosaveEvery] = useState(10);

  const progress = useMemo(() => {
    if (problemIds.length === 0) return "0 / 0";
    return `${index + 1} / ${problemIds.length}`;
  }, [index, problemIds]);

  useEffect(() => {
    (async () => {
      const ids = await fetchProblemIds();
      setProblemIds(ids || []);
      if (ids && ids.length > 0) await loadProblem(ids[0]);
    })();
  }, []);

  async function loadProblem(id) {
    setProblem(null);
    setRevealed(false);
    try {
      const data = await fetchProblem(id);
      setProblem(data);
      setProblemStartAt(Date.now());
    } catch {
      setProblem({ text: "Error loading problem.", choices: [] });
    }
  }

  async function handleChoice(choiceId) {
    if (!problem || problemIds.length === 0 || aiMode) return;
    const promptId = problemIds[index];

    const ms = Math.max(0, Date.now() - (problemStartAt || Date.now()));
    const reactionS = Number((ms / 1000).toFixed(2));

    const baseRecord = {
      player_id: playerId,
      scenario_id: promptId,
      human_choice: pretty(choiceId),
      models: {},
      reaction_time_s: reactionS
    };
    setDecisions(prev => [...prev, baseRecord]);

    await submitHumanChoice({
      promptId,
      choice: choiceId,
      reaction_time_s: reactionS
    }).catch(() => {});

    if (index < problemIds.length - 1) {
      const nextIndex = index + 1;
      setIndex(nextIndex);
      loadProblem(problemIds[nextIndex]);
    } else {
      setHumanDone(true);
      setIndex(0);
      if (problemIds.length > 0) loadProblem(problemIds[0]);
    }
  }

  function startAiPhase() {
    if (!humanDone) return;
    setAiMode(true);
    setRevealed(false);
    if (problemIds.length > 0) loadProblem(problemIds[0]);
  }

  useEffect(() => {
    (async () => {
      if (!aiMode || !problem || problemIds.length === 0) return;

      const promptId = problemIds[index];

      if (aiResults[promptId]) {
        setRevealed(true);
        return;
      }

      setLoadingModels(true);
      setRevealed(false);

      const sess = sessionStatsForPrompt(decisions, promptId);
      const humanStats = { counts: sess.counts, examples: sess.examples };

      const pairs = [];
      for (const model of MODELS) {
        try {
          const { aiChoice, rationale } = await getAiChoice({
            promptId,
            problem,
            preferredModel: model,
            humanStats
          });
          pairs.push([model, {
            choice: pretty(aiChoice),
            rationale,
          }]);
        } catch {
          pairs.push([model, { choice: "unknown", rationale: "Backend error" }]);
        }
      }
      const outputs = Object.fromEntries(pairs);

      setAiResults(prev => ({ ...prev, [promptId]: outputs }));

      setDecisions(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(r => r.scenario_id === promptId);
        if (idx !== -1) {
          const humanKey = (copy[idx].human_choice || "").toLowerCase().includes("pull")
            ? "pull_lever" : "do_nothing";
          const agreement_by_model = {};
          for (const [m, obj] of Object.entries(outputs)) {
            const mk = (obj.choice || "").toLowerCase().includes("pull") ? "pull_lever" : "do_nothing";
            agreement_by_model[m] = mk === humanKey;
          }
          copy[idx] = { ...copy[idx], models: outputs, agreement_by_model };
        }
        return copy;
      });

      setLoadingModels(false);
      setRevealed(true);
    })();
  }, [aiMode, problem, index, problemIds, decisions]);

  function nextScenario() {
    if (problemIds.length === 0) return;
    const nextIndex = (index + 1) % problemIds.length;
    setIndex(nextIndex);
    loadProblem(problemIds[nextIndex]);
  }

  function restart() {
    if (problemIds.length === 0) return;
    setAiMode(false);
    setHumanDone(false);
    setAiResults({});
    setIndex(0);
    setDecisions([]);
    setRevealed(false);
    setStarted(false);
    loadProblem(problemIds[0]);
  }

  function decisionsToJSON() { return JSON.stringify(decisions, null, 2); }
  function decisionsToJSONL() { return decisions.map(d => JSON.stringify(d)).join("\n"); }
  function exportJSON() { downloadText("decisions.json", decisionsToJSON()); }
  function exportJSONL() { downloadText("decisions.jsonl", decisionsToJSONL()); }

  if (!started) {
    return <StartScreen onStart={() => setStarted(true)} />;
  }

  return (
    <TrolleyUI
      playerId={playerId}
      progress={progress}
      problem={problem}
      handleChoice={handleChoice}
      loadingModels={loadingModels}
      pretty={pretty}
      revealed={revealed}
      decisions={decisions}
      MODELS={MODELS}
      nextScenario={nextScenario}
      restart={restart}
      allowSave={allowSave}
      setAllowSave={setAllowSave}
      autosaveEvery={autosaveEvery}
      setAutosaveEvery={setAutosaveEvery}
      aiMode={aiMode}
      humanDone={humanDone}
      startAiPhase={startAiPhase}
      currentScenarioId={problemIds[index]}
      exportJSON={exportJSON}
      exportJSONL={exportJSONL}
    />
  );
}
