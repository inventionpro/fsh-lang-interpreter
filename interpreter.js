// Imports
import evaluate from './math.js'

// Write info to user
let logs = document.getElementById('logs');
function log(text) {
  text = String(text);
  logs.innerHTML += '<p><label style="color:'+(text.startsWith('error> ') ? '#c66' : 'var(--text-2)')+'">'+text.replace('> ','></label> ').replaceAll('\n','<br>')+'</p>';
}

let out = document.getElementById('output');
function output(text) {
  text = String(text);
  out.innerHTML += '<p>'+text.replace('Error: ','<label style="color:#c66">Error:</label> ').replaceAll('\n','<br>')+'</p>';
}

// Run the code
function isFunction(val) {
  return (val.match(/^[a-zA-Z0-9_]+\([^¬]*\)$/m)??[false])[0]
}
function splitTopLevel(str) {
  let result = [];
  let current = '';
  let depth = 0;

  for (let char of str) {
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;
    }
    if (char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function interpret(code, world, vars = {}) {
  log('world> '+world)
  Scheduler.yield ? Scheduler.yield() : '';
  // Internal functions
  if (world === 'internal_function') {
    return eval(code);
  }

  // Default vars
  vars['print'] ??= { value: '(()=>{output(vars["text"].value);return {value:null,type:"null"}})()', type: 'internal_function', args: ['text'] };

  // Useful functions
  function readType(val) {
    // Booleans
    if (['true','false'].includes(val)) {
      return {
        value: (val==='true'? true: false),
        type: 'boolean'
      };
    }
    // Numbers
    if (!isNaN(val)) {
      return {
        value: Number(val),
        type: 'number'
      };
    }
    // No value passed
    if (String(val).length<1) {
      return {
        value: null,
        type: 'null'
      };
    }
    // Null
    if (val==='null') {
      return {
        value: null,
        type: 'null'
      };
    }
    // Strings
    if (/^'[^']*'$/m.test(val) || /^"[^"]*"$/m.test(val) || /^`[^`]*`$/m.test(val)) {
      return {
        value: val.slice(1,-1),
        type: 'string'
      };
    }
    // Function calls
    if (isFunction(val)) {
      let functionName = val.split('(')[0];
      if (['function', 'internal_function'].includes(vars[functionName]?.type)) {
        let newvars = structuredClone(vars);
        let passed = splitTopLevel(val.slice(functionName.length+1,-1)).map(arg => arg.trim());
        let args = vars[functionName].args;

        for (let i = 0; i < args.length; i++) {
          if (passed[i]) {
            let parsedValue = readType(passed[i]);
            newvars[args[i]] = parsedValue;
          } else {
            newvars[args[i]] = { value: null, type: 'null' };
          }
        }

        let result = interpret(vars[functionName].value, vars[functionName].type, newvars);
        if (result.type === 'UNKNOWN') {
          log('error> unknown type supplied, received ' + result.value);
          output('Error: Unknown type supplied, received ' + result.value);
          return result;
        }
        return result;
      } else {
        log('error> ' + functionName + ' is not a function');
        output('Error: ' + functionName + ' is not a function');
        return { value: val, type: 'UNKNOWN' };
      }
    }
    // Variables
    if (vars[val]?.type) {
      if (vars[val].type === 'internal_function') {
        return {
          value: '[Internal Function]',
          type: 'string'
        }
      }
      return {
        value: vars[val].value,
        type: vars[val].type
      }
    }
    // Arithmetic and boolean operations
    if (/[+\-*/%^<>=]/.test(val)) {
      let nval = val;
      nval = nval.replaceAll(/[a-zA-Z_][a-zA-Z0-9_]*/g, function(match){return vars[match]?.value ?? match})
      let result = evaluate(nval)
      return {
        value: result.value,
        type: result.type
      }
    }
    // No known type
    return {
      value: val,
      type: 'UNKNOWN'
    }
  }

  // Start with cleaning input
  log('start> preprocess');
  if (code.includes('¬')) {
    log('error> code must not include ¬')
    output('Error: Code must not include ¬')
    return;
  }
  let preprocess = code
    .replaceAll(/(^let |^const |^)[a-zA-Z0-9_]*.=./gm, function(match){return match.replace('=',' = ').replaceAll('  ',' ')})
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length>0);
  log('end> preprocess');

  // Start running code
  log('start> run');
  for (let i = 0; i < preprocess.length; i++) {
    log('start> line '+i);
    let args = preprocess[i].split(' ').map(t=>t.trim()).filter(t=>t.length>0);
    let con;
    let depth = 0;
    switch ((preprocess[i].match(/^[a-zA-Z0-9_]+/m)??[null])[0]) {
      case 'let':
      case 'const':
        if (!args[1]) {
          log('error> must include variable name');
          output('Error: Must include variable name');
          continue;
        }
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/m.test(args[1])) {
          log('error> invalid variable name, cannot start with number or invalid character');
          output('Error: Invalid variable name, cannot start with number or invalid character');
          continue;
        }
        if (args[2] !== '=') {
          if (!args[3]) {
            if (args[0] === 'const') {
              log('error> tried initializing a constant with no value');
              output('Error: Tried initializing a constant with no value');
              continue;
            }
            vars[args[1]] = { value: null, type: 'null', mut: 'let' };
            continue;
          }
          log('error> expected = recived '+args[2]);
          output('Error: Expected = recived '+args[2]);
          continue;
        }
        con = readType(args.slice(3, args.length).join(' '));
        if (con.type === 'UNKNOWN') {
          log('error> unknown type suplied, recived '+con.value);
          output('Error: Unknown type suplied, recived '+con.value);
          continue;
        }
        vars[args[1]] = { value: con.value, type: con.type, mut: args[0] };
        break;
      case 'function':
        if (isFunction(args.slice(1,-1).join(' '))) {
          con = '';
          i++;
          while ((preprocess[i] !== '}' || depth!==0) && i < preprocess.length) {
            if (preprocess[i].includes('{')) depth++;
            if (preprocess[i] === '}') depth--;
            con += '\n'+preprocess[i];
            i++;
          }
          vars[args[1].split('(')[0]] = {
            value: con,
            type: 'function',
            args: args[1].split('(')[1].slice(0,-1).split(',').map(a=>a.trim())
          }
        } else {
          log('error> function first argument must be name(args)');
          output('Error: Function first argument must be name(args)');
          continue;
        }
        break;
      case 'return':
        if (!['function', 'if'].includes(world)) {
          log('error> cannot use return outside functions');
          output('Error: Cannot use return outside functions');
          continue;
        }
        con = readType(args.slice(1, args.length).join(' '));
        if (con.type === 'UNKNOWN') {
          log('error> unknown type suplied, recived '+con.value);
          output('Error: Unknown type suplied, recived '+con.value);
          return { value: con.value, type: con.type };
        }
        return { value: con.value, type: con.type };
        break;
      case 'if':
        con = args.slice(1,-1).join(' ');
        if (con[0] === '(' && con[con.length - 1] === ')') {
          con = readType(con.slice(1,-1));
          if (con.type !== 'boolean') {
            log('error> argument passed to if did not become boolean');
            output('Error: Argument passed to if did not become boolean');
            continue;
          }
          if (con.value) {
            con = '';
            i++
            while ((preprocess[i] !== '}' || depth!==0) && i < preprocess.length) {
              if (preprocess[i].includes('{')) depth++;
              if (preprocess[i] === '}') depth--;
              con += '\n'+preprocess[i];
              i++;
            }
            depth = con.includes('return');
            con = interpret(con, 'if', structuredClone(vars));
            if (depth) {
              if (!['function', 'if'].includes(world)) {
                log('error> cannot use return outside functions');
                output('Error: Cannot use return outside functions');
                continue;
              }
              return con;
            }
          } else {
            while ((preprocess[i] !== '}' || depth!==0) && i < preprocess.length) {
              if (preprocess[i].includes('{')) depth++;
              if (preprocess[i] === '}') depth--;
              i++;
            }
          }
        } else {
          log('error> second argument in if must be (operation)');
          output('Error: Second argument in if must be (operation)');
          continue;
        }
        break;
      default:
        if (args[1]==='=') {
          if (vars[args[0]]?.type) {
            if (vars[args[0]]?.mut === 'const') {
              log('error> cannot re-asign value of const');
              output('Error: Cannot re-assign value of const');
              continue;
            }
            con = readType(args.slice(2,args.length).join(' '));
            if (con.type === 'UNKNOWN') {
              log('error> unknown type suplied, recived '+con.value);
              output('Error: Unknown type suplied, recived '+con.value);
              continue;
            }
            con.mut = 'let';
            vars[args[0]] = con;
          } else {
            log('error> cannot set uninitialized variable');
            output('Error: Cannot set uninitialized variable');
            continue;
          }
        } else {
          readType(preprocess[i]);
        }
        break;
    }
    log('end> line '+i);
  }
  log('end> run');
  if (world === 'function') {
    return {
      value: null,
      type: 'null'
    };
  }
}

// Event listener
document.getElementById('run').onclick = function(){
  logs.innerHTML = '';
  out.innerHTML = '';
  interpret(document.getElementById('code').value, 'main')
}
