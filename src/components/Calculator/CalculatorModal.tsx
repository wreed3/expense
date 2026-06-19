import { useCalculator } from '../../hooks/useCalculator';
import { format } from 'date-fns';
import './Calculator.css';

export function CalculatorModal() {
  const {
    display,
    memory,
    history,
    isOpen,
    handleNumberClick,
    handleOperatorClick,
    handleDecimalClick,
    handleClear,
    handleBackspace,
    handleEquals,
    handleMemoryRecall,
    handleMemoryClear,
    handleMemoryAdd,
    handleMemorySubtract,
    handleUseResult,
    copyToClipboard,
    setOpen,
    clearHistory,
  } = useCalculator();

  if (!isOpen) return null;

  const buttons = [
    { label: 'MC', action: handleMemoryClear, className: 'memory' },
    { label: 'MR', action: handleMemoryRecall, className: 'memory' },
    { label: 'M+', action: handleMemoryAdd, className: 'memory' },
    { label: 'M-', action: handleMemorySubtract, className: 'memory' },
    { label: 'C', action: handleClear, className: 'clear' },
    { label: '⌫', action: handleBackspace, className: 'backspace' },
    { label: '÷', action: () => handleOperatorClick('/'), className: 'operator' },
    { label: '7', action: () => handleNumberClick('7'), className: 'number' },
    { label: '8', action: () => handleNumberClick('8'), className: 'number' },
    { label: '9', action: () => handleNumberClick('9'), className: 'number' },
    { label: '×', action: () => handleOperatorClick('*'), className: 'operator' },
    { label: '4', action: () => handleNumberClick('4'), className: 'number' },
    { label: '5', action: () => handleNumberClick('5'), className: 'number' },
    { label: '6', action: () => handleNumberClick('6'), className: 'number' },
    { label: '-', action: () => handleOperatorClick('-'), className: 'operator' },
    { label: '1', action: () => handleNumberClick('1'), className: 'number' },
    { label: '2', action: () => handleNumberClick('2'), className: 'number' },
    { label: '3', action: () => handleNumberClick('3'), className: 'number' },
    { label: '+', action: () => handleOperatorClick('+'), className: 'operator' },
    { label: '0', action: () => handleNumberClick('0'), className: 'number zero' },
    { label: '.', action: handleDecimalClick, className: 'number' },
    { label: '=', action: handleEquals, className: 'equals' },
  ];

  return (
    <div className="calculator-overlay" onClick={() => setOpen(false)}>
      <div className="calculator-modal" onClick={(e) => e.stopPropagation()}>
        <div className="calculator-header">
          <h3>Calculator</h3>
          <div className="calculator-header-actions">
            <span className="keyboard-hint">Ctrl+K</span>
            {memory !== 0 && <span className="memory-indicator">M: {memory}</span>}
            <button className="btn-close" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
        </div>

        <div className="calculator-body">
          <div className="calculator-display-section">
            <div className="calculator-display">
              <div className="display-value">{display}</div>
              <div className="display-actions">
                <button
                  className="display-action-btn"
                  onClick={copyToClipboard}
                  title="Copy (Ctrl+C)"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="calculator-quick-actions">
              <button
                className="quick-action-btn primary"
                onClick={handleUseResult}
                title="Calculate and insert into active field"
              >
                Use Result
              </button>
              <button
                className="quick-action-btn"
                onClick={() => {
                  handleNumberClick('(');
                }}
                title="Add parentheses"
              >
                ( )
              </button>
            </div>
          </div>

          <div className="calculator-grid">
            {buttons.map((btn, index) => (
              <button
                key={index}
                className={`calc-btn ${btn.className}`}
                onClick={btn.action}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {history.length > 0 && (
            <div className="calculator-history">
              <div className="history-header">
                <span>History</span>
                <button className="history-clear-btn" onClick={clearHistory}>
                  Clear
                </button>
              </div>
              <div className="history-list">
                {history.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    className="history-item"
                    onClick={() => {
                      copyToClipboard();
                    }}
                    title="Click to copy result"
                  >
                    <div className="history-expression">{item.expression}</div>
                    <div className="history-result">
                      = {item.result.toFixed(2)}
                    </div>
                    <div className="history-time">
                      {format(item.timestamp, 'HH:mm:ss')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="calculator-tips">
            <div className="tip-item">
              <kbd>Enter</kbd> Calculate
            </div>
            <div className="tip-item">
              <kbd>Esc</kbd> Close
            </div>
            <div className="tip-item">
              <kbd>C</kbd> Clear
            </div>
            <div className="tip-item">
              <kbd>Ctrl+C</kbd> Copy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}