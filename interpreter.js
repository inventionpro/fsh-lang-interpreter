// Write info to user
let logs = document.getElementById('logs');
function log(text) {
  logs.value += text+'\n';
}

let out = document.getElementById('output');
function output(text) {
  out.value += text+'\n';
}

// Run the code
function isFunction(val) {
  return (val.match(/^[a-zA-Z0-9_]+\([^¬]*\)$/m)||[false])[0]
}

function interpret(code, world, vars = {}) {
  log('world> '+world)
  // Internal functions
  if (world === 'internal_function') {
    return eval(code);
  }

  // Default vars
  if (!vars['print']) vars['print'] = { value: '(()=>{output(vars["text"]);return {value:null,type:"null"}})()', type: 'internal_function', args: ['text'] }

  // Useful functions
  function readType(val) {
    if (!isNaN(val)) {
      return {
        value: Number(val),
        type: 'number'
      };
    }
    if (!val) {
      return {
        value: null,
        type: 'null'
      };
    }
    if ((val.match(/^'[^']*'$/m)||[false])[0] || (val.match(/^"[^"]*"$/m)||[false])[0] || (val.match(/^`[^`]*`$/m)||[false])[0]) {
      return {
        value: val.slice(1,-1),
        type: 'string'
      };
    }
    if (!val.includes(' ')) {
      if (vars[val]?.type) {
        return {
          value: vars[val].value,
          type: vars[val].type
        }
      }
    }
    if (isFunction(val)) {
      if (['function', 'internal_function'].includes(vars[val.split('(')[0]]?.type)) {
        let newvars = {};
        let passed = val.slice(val.indexOf('(')+1,-1).split(',');
        let arg = vars[val.split('(')[0]].args;
        for (let i = 0; i<arg.length; i++) {
          if (passed[i]) {
            let co = readType(passed[i]);
            newvars[arg[i]] = co;
          } else {
            newvars[arg[i]] = { value: null, type: 'null' };
          }
        }
        let con = interpret(vars[val.split('(')[0]].value, vars[val.split('(')[0]].type, newvars);
        if (con.type === 'UNKNOWN') {
          log('error> unknown type suplied, recived '+con.value);
          output('Error: Unknown type suplied, recived '+con.value);
          return con;
        }
        return con;
      } else {
        log('error> '+val.split('(')[0]+' is not a function');
        output('Error: '+val.split('(')[0]+' is not a function');
        return {
          value: val,
          type: 'UNKNOWN'
        }
      }
    }
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
    switch (preprocess[i].match(/^[a-zA-Z0-9_]+/m)[0]) {
      case 'let':
      case 'const':
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
      case 'return':
        if (world !== 'function') {
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
      default:
        readType(preprocess[i]);
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
  logs.value = '';
  out.value = '';
  interpret(document.getElementById('code').value, 'main')
}
