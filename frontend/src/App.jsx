// src/App.jsx
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

const MODELS = ["gpt", "grok", "claude"];

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

export default function App() {
  const [playerId] = useState(makeAnonId);

  // Title screen
  const [started, setStarted] = useState(false);

  // Scenario state
  const [problemIds, setProblemIds] = useState([]);
  const [index, setIndex] = useState(0);
  const [problem, setProblem] = useState(null);   // { text, choices, outcomes? }

  // Phase state
  const [decisions, setDecisions] = useState([]); // [{ scenario_id, human_choice, models, ... }]
  const [aiMode, setAiMode] = useState(false);    // false = play, true = AI
  const [humanDone, setHumanDone] = useState(false);

  // AI results cache so we do not refetch for a prompt twice
  const [aiResults, setAiResults] = useState({}); // { [promptId]: { modelName: { choice, rationale, raw? } } }

  // UI flags
  const [revealed, setRevealed] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Export controls
  const [allowSave, setAllowSave] = useState(true);
  const [autosaveEvery, setAutosaveEvery] = useState(10);

  const progress = useMemo(() => {
    if (problemIds.length === 0) return "0 / 0";
    return `${index + 1} / ${problemIds.length}`;
  }, [index, problemIds]);

  // Load IDs on mount, then first problem
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
    } catch {
      setProblem({ text: "Error loading problem.", choices: [] });
    }
  }

  // Player chooses during play phase
  async function handleChoice(choiceId) {
    if (!problem || problemIds.length === 0 || aiMode) return;
    const promptId = problemIds[index];

    const baseRecord = {
      player_id: playerId,
      scenario_id: promptId,
      human_choice: pretty(choiceId),
      models: {},
      prompt_version: "v1",
      timestamp: new Date().toISOString(),
    };
    setDecisions(prev => [...prev, baseRecord]);

    // Log to backend if available
    await submitHumanChoice({ promptId, choice: choiceId }).catch(() => {});

    // Next scenario or end of play phase
    if (index < problemIds.length - 1) {
      const nextIndex = index + 1;
      setIndex(nextIndex);
      loadProblem(problemIds[nextIndex]);
    } else {
      setHumanDone(true);
      setIndex(0);
      if (problemIds.length > 0) loadProblem(problemIds[0]);
    }

    // Optional autosave cadence
    if (allowSave && autosaveEvery > 0) {
      const count = decisions.length + 1;
      if (count % autosaveEvery === 0) {
        // add your local export hook if you want
      }
    }
  }

  // Start AI phase manually from the controls panel
  function startAiPhase() {
    if (!humanDone) return;
    setAiMode(true);
    setRevealed(false);
    if (problemIds.length > 0) loadProblem(problemIds[0]);
  }

  // AI phase: fetch choices for each model for the current prompt
  useEffect(() => {
    (async () => {
      if (!aiMode || !problem || problemIds.length === 0) return;

      const promptId = problemIds[index];

      // Already have results for this prompt
      if (aiResults[promptId]) {
        setRevealed(true);
        return;
      }

      setLoadingModels(true);
      setRevealed(false);

      // Query each model through the adapter
      // deepseek maps to GPT in the adapter so UI labels can remain unchanged
      const pairs = [];
      for (const model of MODELS) {
        try {
          const { aiChoice, raw, rationale } = await getAiChoice({
            promptId,
            problem,
            preferredModel: model,
          });
          pairs.push([model, { choice: pretty(aiChoice), rationale , raw }]);
        } catch {
          pairs.push([model, { choice: "unknown", rationale: "Backend error" }]);
        }
      }

      const outputs = Object.fromEntries(pairs);

      setAiResults(prev => ({ ...prev, [promptId]: outputs }));

      // Attach outputs to the matching human record for this scenario
      setDecisions(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(r => r.scenario_id === promptId);
        if (idx !== -1) copy[idx] = { ...copy[idx], models: outputs };
        return copy;
      });

      setLoadingModels(false);
      setRevealed(true);
    })();
  }, [aiMode, problem, index, problemIds]); // run on each AI scenario

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
    setStarted(false); // back to title screen
    loadProblem(problemIds[0]);
  }

  // Export helpers
  function decisionsToJSON() { return JSON.stringify(decisions, null, 2); }
  function decisionsToJSONL() { return decisions.map(d => JSON.stringify(d)).join("\n"); }
  function exportJSON() { downloadText("decisions.json", decisionsToJSON()); }
  function exportJSONL() { downloadText("decisions.jsonl", decisionsToJSONL()); }

  // Title screen
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
