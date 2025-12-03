import "./styles.css";

export default function StartScreen({ onStart }) {
  return (
    <div className="start-screen">
      <div className="start-overlay" />

      <div className="start-content">
        <h1 className="start-title glitch">TROLLEY CONTROL INTERFACE</h1>

        <p className="start-subtitle">
          Initiate simulation to begin decision protocol.
        </p>

        <button className="start-btn" onClick={onStart}>
          ENTER SIMULATION
        </button>
      </div>
    </div>
  );
}