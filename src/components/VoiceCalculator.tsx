/**
 * Voice Calculator Component
 * Phase 2: Integrates voice input with calculator functionality
 */

import React, { useState, useEffect } from 'react';
import { VoiceButton } from './VoiceButton';
import { parseMathExpression, calculateExpression, parseAndCalculate } from '../utils/mathParser';
import './VoiceCalculator.css';

interface CalculationHistory {
  id: string;
  transcript: string;
  expression: string;
  result: number | null;
  timestamp: Date;
  error?: string;
}

export const VoiceCalculator: React.FC = () => {
  const [currentExpression, setCurrentExpression] = useState<string>('');
  const [currentResult, setCurrentResult] = useState<string>('0');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const handleTranscript = (transcript: string, isFinal: boolean) => {
    if (!isFinal) {
      // Show interim transcript
      setInterimTranscript(transcript);
      
      // Try to parse it in real-time for preview
      const parsed = parseMathExpression(transcript);
      if (parsed.isValid) {
        setCurrentExpression(parsed.expression);
      }
      return;
    }

    // Clear interim transcript
    setInterimTranscript('');

    // Process final transcript
    const calculation = parseAndCalculate(transcript);

    if (calculation.error) {
      // Show error briefly
      setCurrentExpression(transcript);
      setCurrentResult(`Error: ${calculation.error}`);
      
      // Add to history
      setHistory(prev => [{
        id: `${Date.now()}-${Math.random()}`,
        transcript,
        expression: calculation.expression || transcript,
        result: null,
        timestamp: new Date(),
        error: calculation.error,
      }, ...prev]);

      // Reset after 2 seconds
      setTimeout(() => {
        setCurrentExpression('');
        setCurrentResult('0');
      }, 2000);
      return;
    }

    // Valid calculation
    setCurrentExpression(calculation.expression);
    setCurrentResult(calculation.result?.toString() || '0');

    // Add to history
    setHistory(prev => [{
      id: `${Date.now()}-${Math.random()}`,
      transcript,
      expression: calculation.expression,
      result: calculation.result,
      timestamp: new Date(),
    }, ...prev]);
  };

  const clearCalculator = () => {
    setCurrentExpression('');
    setCurrentResult('0');
    setInterimTranscript('');
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="voice-calculator">
      <div className="calculator-display">
        <div className="display-expression">
          {currentExpression || (interimTranscript && `Listening: ${interimTranscript}`) || 'Say a math expression'}
        </div>
        <div className="display-result">
          {currentResult}
        </div>
      </div>

      <div className="calculator-controls">
        <VoiceButton onTranscript={handleTranscript} />
        <button className="clear-button" onClick={clearCalculator} title="Clear display">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      </div>

      <div className="calculator-examples">
        <h3>Try saying:</h3>
        <ul>
          <li>"five plus three"</li>
          <li>"twenty minus eight"</li>
          <li>"six times seven"</li>
          <li>"fifteen divided by three"</li>
        </ul>
      </div>

      <div className="calculator-history-section">
        <button 
          className="toggle-history-button"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'Hide' : 'Show'} History ({history.length})
        </button>

        {showHistory && (
          <div className="calculator-history">
            <div className="history-header">
              <h3>Calculation History</h3>
              {history.length > 0 && (
                <button className="clear-history-button" onClick={clearHistory}>
                  Clear All
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="history-empty">
                <p>No calculations yet. Start speaking to perform calculations!</p>
              </div>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className={`history-item ${item.error ? 'error' : ''}`}>
                    <div className="history-item-header">
                      <span className="history-transcript">"{item.transcript}"</span>
                      <span className="history-timestamp">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="history-item-content">
                      <div className="history-expression">{item.expression}</div>
                      {item.error ? (
                        <div className="history-error">{item.error}</div>
                      ) : (
                        <div className="history-result">= {item.result}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};