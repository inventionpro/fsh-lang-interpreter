export default function evaluate(expression) {
  // Step 1: Tokenize the expression
  function tokenize(exp) {
    const tokens = [];
    let buffer = '';
    let i = 0;
    
    while (i < exp.length) {
      let char = exp[i];

      // If the character is part of a number, build a number or part of a string
      if (/\d/.test(char)) {
        buffer += char;
        i++;
      } else if (/["]/.test(char)) {
        // Handle strings by detecting quotes
        if (buffer.length > 0) {
          tokens.push(buffer);
          buffer = '';
        }
        i++;
        let stringToken = '';
        while (exp[i] !== '"') {
          stringToken += exp[i];
          i++;
        }
        tokens.push(stringToken);
        i++;  // Skip closing quote
      } else {
        if (buffer.length > 0) {
          tokens.push(Number(buffer));
          buffer = '';
        }
        
        // Handle multi-character operators like <=, >=, ==
        if (exp[i] === '<' || exp[i] === '>' || exp[i] === '=') {
          let nextChar = exp[i + 1];
          if (nextChar === '=') {
            tokens.push(char + nextChar);  // Handle <=, >=, ==
            i += 2;
          } else {
            tokens.push(char);  // Handle <, >
            i++;
          }
        } else if (/[+\-*/%^()]/.test(char)) {
          tokens.push(char);  // Handle single-character operators
          i++;
        } else {
          i++;
        }
      }
    }

    if (buffer.length > 0) {
      tokens.push(Number(buffer));
    }

    return tokens;
  }

  // Step 2: Convert to Reverse Polish Notation (Shunting Yard Algorithm)
  function toRPN(tokens) {
    const outputQueue = [];
    const operatorStack = [];
    
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3, '<': 0, '>': 0, '<=': 0, '>=': 0, '==': 0 };
    const associativity = { '+': 'L', '-': 'L', '*': 'L', '/': 'L', '%': 'L', '^': 'R', '<': 'L', '>': 'L', '<=': 'L', '>=': 'L', '==': 'L' };

    for (let token of tokens) {
      if (typeof token === 'number' || typeof token === 'string') {
        outputQueue.push(token);
      } else if (/[+\-*/%^<>=]/.test(token)) {
        while (
          operatorStack.length &&
          /[+\-*/%^<>=]/.test(operatorStack[operatorStack.length - 1]) &&
          (
            (associativity[token] === 'L' && precedence[token] <= precedence[operatorStack[operatorStack.length - 1]]) ||
            (associativity[token] === 'R' && precedence[token] < precedence[operatorStack[operatorStack.length - 1]])
          )
        ) {
          outputQueue.push(operatorStack.pop());
        }
        operatorStack.push(token);
      } else if (token === '(') {
        operatorStack.push(token);
      } else if (token === ')') {
        while (operatorStack.length && operatorStack[operatorStack.length - 1] !== '(') {
          outputQueue.push(operatorStack.pop());
        }
        operatorStack.pop(); // Pop the '('
      }
    }

    while (operatorStack.length) {
      outputQueue.push(operatorStack.pop());
    }

    return outputQueue;
  }

  // Step 3: Evaluate the RPN expression
  function evaluateRPN(rpn) {
    const stack = [];
    
    for (let token of rpn) {
      if (typeof token === 'number' || typeof token === 'string') {
        stack.push(token);
      } else if (/[+\-*/%^<>=]/.test(token)) {
        const b = stack.pop();
        const a = stack.pop();
        switch (token) {
          case '+': 
            stack.push(typeof a === 'string' || typeof b === 'string' ? String(a) + String(b) : a + b); 
            break;
          case '-': stack.push(a - b); break;
          case '*': stack.push(a * b); break;
          case '/': stack.push(a / b); break;
          case '%': stack.push(a % b); break;
          case '^': stack.push(Math.pow(a, b)); break;
          case '<': stack.push(a < b); break;
          case '>': stack.push(a > b); break;
          case '<=': stack.push(a <= b); break;
          case '>=': stack.push(a >= b); break;
          case '==': stack.push(a == b); break;
        }
      }
    }

    if (typeof stack[0] === 'string') {
      return {
        value: stack[0],
        type: 'string'
      };
    }
    if (typeof stack[0] === 'boolean') {
      return {
        value: stack[0],
        type: 'boolean'
      };
    }
    return {
      value: stack[0],
      type: 'number'
    };
  }

  const tokens = tokenize(expression);
  const rpn = toRPN(tokens);
  return evaluateRPN(rpn);
}
