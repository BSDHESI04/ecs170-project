import { useEffect, useState } from "react";

export default function LeverSwapPanel({
  problem,
  promptId,
  onChoice,
  consequences,
  normalSrc = "/visuals/lever.png",
  flippedSrc = "/visuals/lever-flipped.png",
  initial = "normal",
}) {
  const choices = problem?.choices || [];

  const EXECUTE_KEY =
    choices.find((c) => c.toLowerCase().includes("pull")) ||
    choices[0] ||
    "execute_action";

  const HOLD_KEY =
    choices.find((c) => c.toLowerCase().includes("do")) ||
    choices[1] ||
    "hold_position";

  const [state, setState] = useState(initial);
  const [toast, setToast] = useState(null);
  const [lastChoice, setLastChoice] = useState(null);

  function showToast(msg, key) {
    setLastChoice(key);
    setToast(msg);
    setTimeout(() => setToast(null), 1650);
  }

  function handleExecute() {
    setState("flipped");
    onChoice(EXECUTE_KEY);
    showToast("Action executed.", "execute");
  }

  function handleHold() {
    setState("normal");
    onChoice(HOLD_KEY);
    showToast("Position held.", "hold");
  }

  return (
    <div className="lever-wrap">
      <img
        src={state === "normal" ? normalSrc : flippedSrc}
        className="lever-img-swap"
        alt="Lever"
        onClick={handleExecute}
      />

      <div className="row lever-buttons">
        <button className="primary-btn" onClick={handleExecute}>
          Pull lever
        </button>

        <button className="secondary-btn" onClick={handleHold}>
          Do Nothing
        </button>
      </div>

      {toast && (
        <div className={`choice-toast ${lastChoice}`} key={toast}>
          <span className="toast-icon">
            {lastChoice === "execute" ? "✦" : "△"}
          </span>
          <span className="toast-text">{toast}</span>
        </div>
      )}
    </div>
  );
}