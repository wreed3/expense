/**
 * Safe math expression evaluator
 * Supports: +, -, *, /, (), decimals
 */
export class ExpressionEvaluator {
  private static readonly OPERATORS = {
    '+': (a: number, b: number) => a + b,
    '-': (a: number, b: number) => a - b,
    '*': (a: number, b: number) => a * b,
    '/': (a: number, b: number) => {
      if (b === 0) throw new Error('Division by zero');
      return a / b;
    },
  };

  private static readonly PRECEDENCE = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  };

  /**
   * Evaluate a math expression safely
   */
  static evaluate(expression: string): number {
    try {
      // Remove whitespace
      expression = expression.replace(/\s/g, '');

      // Validate characters
      if (!/^[0-9+\-*/.()]+$/.test(expression)) {
        throw new Error('Invalid characters in expression');
      }

      // Convert to postfix notation and evaluate
      const postfix = this.toPostfix(expression);
      return this.evaluatePostfix(postfix);
    } catch (error) {
      throw new Error(`Invalid expression: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if expression is valid without evaluating
   */
  static isValid(expression: string): boolean {
    try {
      this.evaluate(expression);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Format number for display
   */
  static formatResult(value: number): string {
    // Round to 2 decimal places for currency
    const rounded = Math.round(value * 100) / 100;
    return rounded.toFixed(2);
  }

  /**
   * Convert infix expression to postfix (Reverse Polish Notation)
   */
  private static toPostfix(expression: string): string[] {
    const output: string[] = [];
    const operators: string[] = [];
    let number = '';

    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];

      if (this.isDigit(char) || char === '.') {
        number += char;
      } else if (char === '(') {
        operators.push(char);
      } else if (char === ')') {
        if (number) {
          output.push(number);
          number = '';
        }
        while (operators.length && operators[operators.length - 1] !== '(') {
          output.push(operators.pop()!);
        }
        operators.pop(); // Remove '('
      } else if (this.isOperator(char)) {
        if (number) {
          output.push(number);
          number = '';
        }

        // Handle negative numbers
        if (char === '-' && (i === 0 || this.isOperator(expression[i - 1]) || expression[i - 1] === '(')) {
          number = '-';
          continue;
        }

        while (
          operators.length &&
          operators[operators.length - 1] !== '(' &&
          this.PRECEDENCE[operators[operators.length - 1] as keyof typeof this.PRECEDENCE] >=
            this.PRECEDENCE[char as keyof typeof this.PRECEDENCE]
        ) {
          output.push(operators.pop()!);
        }
        operators.push(char);
      }
    }

    if (number) {
      output.push(number);
    }

    while (operators.length) {
      output.push(operators.pop()!);
    }

    return output;
  }

  /**
   * Evaluate postfix expression
   */
  private static evaluatePostfix(postfix: string[]): number {
    const stack: number[] = [];

    for (const token of postfix) {
      if (this.isOperator(token)) {
        const b = stack.pop();
        const a = stack.pop();
        if (a === undefined || b === undefined) {
          throw new Error('Invalid expression');
        }
        const result = this.OPERATORS[token as keyof typeof this.OPERATORS](a, b);
        stack.push(result);
      } else {
        const num = parseFloat(token);
        if (isNaN(num)) {
          throw new Error('Invalid number');
        }
        stack.push(num);
      }
    }

    if (stack.length !== 1) {
      throw new Error('Invalid expression');
    }

    return stack[0];
  }

  private static isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private static isOperator(char: string): boolean {
    return char in this.OPERATORS;
  }
}