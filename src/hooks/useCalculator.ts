import { useCallback, useEffect } from 'react';
import { useCalculatorStore } from '../store/calculatorStore';
import { ExpressionEvaluator } from '../utils/expressionEvaluator';

export function useCalculator() {
  const {
    display,
    memory,
    history,
    isOpen,
    setDisplay,
    appendToDisplay,
    clearDisplay,
    backspace,
    addToHistory,
    clearHistory,
    setMemory,
    addToMemory,
    subtractFromMemory,
    clearMemory,
    toggleOpen,
    setOpen,
    activeInputId,
    setActiveInput,
  } = useCalculatorStore();

  const handleNumberClick = useCallback(
    (num: string) => {
      appendToDisplay(num);
    },
    [appendToDisplay]
  );

  const handleOperatorClick = useCallback(
    (operator: string) => {
      appendToDisplay(operator);
    },
    [appendToDisplay]
  );

  const handleDecimalClick = useCallback(() => {
    // Only add decimal if current number doesn't have one
    const parts = display.split(/[+\-*/]/);
    const lastPart = parts[parts.length - 1];
    if (!lastPart.includes('.')) {
      appendToDisplay('.');
    }
  }, [display, appendToDisplay]);

  const handleClear = useCallback(() => {
    clearDisplay();
  }, [clearDisplay]);

  const handleBackspace = useCallback(() => {
    backspace();
  }, [backspace]);

  const handleEquals = useCallback(() => {
    try {
      const result = ExpressionEvaluator.evaluate(display);
      const formattedResult = ExpressionEvaluator.formatResult(result);
      addToHistory(display, result);
      setDisplay(formattedResult);
      return result;
    } catch (error) {
      setDisplay('Error');
      setTimeout(() => setDisplay('0'), 1500);
      return null;
    }
  }, [display, setDisplay, addToHistory]);

  const handleMemoryRecall = useCallback(() => {
    setDisplay(memory.toString());
  }, [memory, setDisplay]);

  const handleMemoryClear = useCallback(() => {
    clearMemory();
  }, [clearMemory]);

  const handleMemoryAdd = useCallback(() => {
    try {
      const result = ExpressionEvaluator.evaluate(display);
      addToMemory(result);
    } catch {
      // Invalid expression, ignore
    }
  }, [display, addToMemory]);

  const handleMemorySubtract = useCallback(() => {
    try {
      const result = ExpressionEvaluator.evaluate(display);
      subtractFromMemory(result);
    } catch {
      // Invalid expression, ignore
    }
  }, [display, subtractFromMemory]);

  const insertIntoActiveInput = useCallback(
    (value: string) => {
      if (activeInputId) {
        const input = document.getElementById(activeInputId) as HTMLInputElement;
        if (input) {
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.focus();
        }
      }
    },
    [activeInputId]
  );

  const handleUseResult = useCallback(() => {
    const result = handleEquals();
    if (result !== null) {
      insertIntoActiveInput(ExpressionEvaluator.formatResult(result));
      setOpen(false);
    }
  }, [handleEquals, insertIntoActiveInput, setOpen]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(display);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [display]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to toggle calculator
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleOpen();
        return;
      }

      // Only handle other keys if calculator is open
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          setOpen(false);
          break;
        case 'Enter':
          e.preventDefault();
          handleEquals();
          break;
        case 'Backspace':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleBackspace();
          }
          break;
        case 'Delete':
          e.preventDefault();
          handleClear();
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            copyToClipboard();
          } else {
            handleClear();
          }
          break;
        case '+':
        case '-':
        case '*':
        case '/':
          e.preventDefault();
          handleOperatorClick(e.key);
          break;
        case '.':
          e.preventDefault();
          handleDecimalClick();
          break;
        default:
          if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            handleNumberClick(e.key);
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    toggleOpen,
    setOpen,
    handleEquals,
    handleBackspace,
    handleClear,
    handleNumberClick,
    handleOperatorClick,
    handleDecimalClick,
    copyToClipboard,
  ]);

  return {
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
    toggleOpen,
    setOpen,
    clearHistory,
    setActiveInput,
  };
}