import { useCalculatorStore } from '../../store/calculatorStore';
import './Calculator.css';

export function FloatingCalculatorButton() {
  const { toggleOpen, memory } = useCalculatorStore();

  return (
    <button
      className="floating-calculator-btn"
      onClick={toggleOpen}
      title="Open Calculator (Ctrl+K)"
      aria-label="Open Calculator"
    >
      <span className="calculator-icon">🧮</span>
      {memory !== 0 && <span className="memory-badge">M</span>}
      <span className="calculator-tooltip">
        Calculator
        <kbd>Ctrl+K</kbd>
      </span>
    </button>
  );
}