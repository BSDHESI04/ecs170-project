import LeverPanel from "./components/LeverPanel";

export default function TrolleyUI({
  playerId,
  progress,
  problem,
  handleChoice,
  loadingModels,
  pretty,
  revealed,
  decisions,
  MODELS,
  nextScenario,
  restart,
  allowSave,
  setAllowSave,
  autosaveEvery,
  setAutosaveEvery,
  aiMode,
  humanDone,
  startAiPhase,
  currentScenarioId,
  exportJSON,
  exportJSONL,
}) {
  // Human phase
  const showChoices = !!problem && !aiMode;

  // Reveal phase (fixed logic)
  const showReveal = !!problem && aiMode;

  // Decision fallback (prevents UI from breaking)
  const currentDecision =
    decisions.find((r) => r.scenario_id === currentScenarioId) ||
    decisions[decisions.length - 1];

  return (
    <div className="page">
      {/* ===== HEADER ===== */}
      <header
        className="header"
        style={{
          textShadow: "0 0 8px #0ff, 0 0 12px #0ff",
          borderBottom: "1px solid #333",
        }}
      >
        <h1 className="glitch-title">⚡ TROLLEY CONTROL INTERFACE</h1>

        <div className="row">
          <span>Operator: {playerId}</span>

          <span className="progress">
            {aiMode
              ? `AI Module Active • ${progress}`
              : `Human Phase • ${progress}`}
          </span>
        </div>
      </header>

      {/* ===== HUMAN PHASE ===== */}
      {showChoices && (
        <>
          <section
            className="card"
            style={{
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(0, 255, 255, 0.2)",
            }}
          >
            <h2
              style={{
                color: "#0ff",
                textShadow: "0 0 6px #0ff",
                letterSpacing: "2px",
              }}
            >
              ▣ SCENARIO BRIEFING
            </h2>

            <p className="scenario-text">{problem.text}</p>
          </section>

          {/* Lever Panel (fixed props so it works again) */}
          <LeverPanel
            problem={problem}
            onChoice={handleChoice}
            promptId={currentScenarioId}
            normalSrc="/visuals/lever.png"
            flippedSrc="/visuals/lever-flipped.png"
            initial="normal"
          />

          <section
            className="panel controls"
            style={{
              paddingTop: "15px",
              borderTop: "1px solid rgba(0,255,255,0.2)",
            }}
          >
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted">
                ⟳ Complete all missions to unlock AI Module
              </span>

              <button
                className="primary-btn start-ai-btn"
                onClick={startAiPhase}
                disabled={!humanDone || aiMode}
              >
                Activate AI Module
              </button>
            </div>
          </section>
        </>
      )}

      {/* ===== AI PHASE ===== */}
      {showReveal && (
        <section
          className="panel"
          style={{
            border: "1px solid rgba(255,0,255,0.2)",
            boxShadow: "0 0 10px rgba(255,0,255,0.3)",
          }}
        >
          <h3
            style={{
              textShadow: "0 0 6px #f0f",
              color: "#f0f",
            }}
          >
            OUTCOME COMPARISON — AI MODULE
          </h3>

          <table className="table">
            <tbody>
              <tr>
                <td className="cell-label">Human Decision</td>
                <td>{currentDecision?.human_choice || "N/A"}</td>
              </tr>

              {MODELS.map((m) => (
                <tr key={m}>
                  <td className="cell-label">{m}</td>
                  <td>
                    {currentDecision?.models?.[m]?.choice || "—"}
                    <span className="rationale">
                      {currentDecision?.models?.[m]?.rationale ||
                        "Loading reasoning..."}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            className="row"
            style={{
              marginTop: "20px",
              justifyContent: "space-between",
              display: "flex",
            }}
          >
            <button className="secondary-btn" onClick={restart}>
              Reset Mission
            </button>

            <button
              className="primary-btn"
              onClick={nextScenario}
              disabled={loadingModels}
            >
              Next Scenario
            </button>
          </div>

          <div
            className="row"
            style={{
              marginTop: "20px",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="secondary-btn"
              onClick={exportJSON}
              disabled={!allowSave || decisions.length === 0}
              style={{ marginRight: "10px" }}
            >
              Export JSON
            </button>

            <button
              className="secondary-btn"
              onClick={exportJSONL}
              disabled={!allowSave || decisions.length === 0}
            >
              Export JSONL
            </button>
          </div>
        </section>
      )}
    </div>
  );
}