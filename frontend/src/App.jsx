import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import TrolleyUI from "./TrolleyUI.jsx";
import StartScreen from "./StartScreen.jsx";

const MODELS = ["deepseek", "chatgpt", "claude"];

function pretty(label) {
  return (label || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
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
  const [started, setStarted] = useState(false);

  const [playerId] = useState(makeAnonId);

  const [problemIds, setProblemIds] = useState([]);
  const [index, setIndex] = useState(0);
  const [problem, setProblem] = useState(null);   // { text, choices }

  const [decisions, setDecisions] = useState([]);
  const [aiMode, setAiMode] = useState(false);    // false = play phase, true = AI phase
  const [humanDone, setHumanDone] = useState(false);
  const [aiResults, setAiResults] = useState({}); // { [promptId]: { chatgpt, deepseek, claude } }

  const [revealed, setRevealed] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  const [allowSave, setAllowSave] = useState(true);
  const [autosaveEvery, setAutosaveEvery] = useState(10);

  const progress = useMemo(() => {
    if (problemIds.length === 0) return "0 / 0";
    return `${index + 1} / ${problemIds.length}`;
  }, [index, problemIds]);

  // Load IDs on mount, then the first problem
  useEffect(() => {
    (async () => {
      try {
        const idsRes = await fetch("/api/problems/ids");
        const ids = await idsRes.json();
        setProblemIds(ids || []);
        if (ids && ids.length > 0) await loadProblem(ids[0]);
      } catch {
        setProblem({ text: "Error loading problem list.", choices: [] });
      }
    })();
  }, []);

  async function loadProblem(id) {
    setProblem(null);
    setRevealed(false);
    try {
      const res = await fetch(`/api/problem/${id}`);
      const data = await res.json();
      setProblem(data);
    } catch {
      setProblem({ text: "Error loading problem.", choices: [] });
    }
  }

  // PLAY PHASE: record human choice and move on. Do not call AI here.
  async function handleChoice(choiceId) {
    if (!problem || problemIds.length === 0 || aiMode) return;
    const promptId = problemIds[index];

    const baseRecord = {
      player_id: playerId,
      scenario_id: promptId,
      human_choice: pretty(choiceId),
      models: {},
      prompt_version: "v1",
      timestamp: new Date().toISOString()
    };
    setDecisions(prev => [...prev, baseRecord]);

    try {
      await fetch("/api/submit-human-choice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId, choice: choiceId })
      });
    } catch {}

    if (index < problemIds.length - 1) {
      const nextIndex = index + 1;
      setIndex(nextIndex);
      loadProblem(problemIds[nextIndex]); 
    } else {
      // switch to AI phase after last human scenario
      setHumanDone(true);
      setIndex(0);
      loadProblem(problemIds[0]);
    }

  }

  // AI PHASE: when aiMode is on and a problem is loaded, fetch AI result for that prompt

  function startAiPhase() {
    if(!humanDone) return;
    setAiMode(true);
    setRevealed(false)

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

      let chatgptChoice = "unknown";
      try {
        const res = await fetch("/api/get-ai-choice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId })
        });
        const data = await res.json();
        chatgptChoice = data.aiChoice || "unknown";
      } catch {
        chatgptChoice = "backend error";
      }

      const pick = () =>
        Math.random() < 0.6 ? problem.choices[0] : problem.choices[1];

      const outputs = {
        ChatGpt: { choice: pretty(chatgptChoice), rationale: "Server response" },
        Grok: { choice: pretty(pick()), rationale: "Placeholder" },
        Claude:   { choice: pretty(pick()), rationale: "Placeholder" }
      };

      setAiResults(prev => ({ ...prev, [promptId]: outputs }));

      // attach model outputs to the matching decision
      setDecisions(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(r => r.scenario_id === promptId);
        if (idx !== -1) copy[idx] = { ...copy[idx], models: outputs };
        return copy;
      });

      setLoadingModels(false);
      setRevealed(true);
    })();
  }, [aiMode, problem, index, problemIds]); // runs only in AI phase

  function nextScenario() {
    if (problemIds.length === 0) return;
    const nextIndex = (index + 1) % problemIds.length;
    setIndex(nextIndex);
    loadProblem(problemIds[nextIndex]);
  }

  function restart() {
    if (problemIds.length === 0) return;
    setAiMode(false);          // back to play phase
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

  if(!started) {
    return <StartScreen onStart={() => setStarted(true)} />
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
      humanDone = {humanDone}
      startAiPhase = {startAiPhase}
      currentScenarioId={problemIds[index]}
      exportJSON={exportJSON}
      exportJSONL={exportJSONL}
    />
  );
}
