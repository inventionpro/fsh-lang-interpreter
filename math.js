export default function evaluate(expression) {
  // Step 1: Tokenize the expression
  function tokenize(exp) {
    const tokens = [];
    let numberBuffer = '';
    
    for (let char of exp) {
      // If the character is a digit, build a number
      if (/\d/.test(char)) {
        numberBuffer += char;
      } else {
        if (numberBuffer.length > 0) {
          // Push the built number as token
          tokens.push(Number(numberBuffer));
          numberBuffer = '';
        }
        if (/[+\-*/%^()]/.test(char)) {
          // Push operators and parentheses as tokens
          tokens.push(char);
        }
      }
    }
    if (numberBuffer.length > 0) {
      tokens.push(Number(numberBuffer));
    }
    return tokens;
  }

  // Step 2: Convert to Reverse Polish Notation (Shunting Yard Algorithm)
  function toRPN(tokens) {
    const outputQueue = [];
    const operatorStack = [];
    
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };
    const associativity = { '+': 'L', '-': 'L', '*': 'L', '/': 'L', '%': 'L', '^': 'R' };

    for (let token of tokens) {
      if (typeof token === 'number') {
        outputQueue.push(token);
      } else if (/[+\-*/%^]/.test(token)) {
        while (
          operatorStack.length &&
          /[+\-*/%^]/.test(operatorStack[operatorStack.length - 1]) &&
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
      if (typeof token === 'number') {
        stack.push(token);
      } else if (/[+\-*/%^]/.test(token)) {
        const b = stack.pop();
        const a = stack.pop();
        switch (token) {
          case '+': stack.push(a + b); break;
          case '-': stack.push(a - b); break;
          case '*': stack.push(a * b); break;
          case '/': stack.push(a / b); break;
          case '%': stack.push(a % b); break;
          case '^': stack.push(Math.pow(a, b)); break;
        }
      }
    }

    if (isNaN(stack[0])) {
      return 0;
    }
    return stack[0];
  }

  const tokens = tokenize(expression);
  const rpn = toRPN(tokens);
  return evaluateRPN(rpn);
}
