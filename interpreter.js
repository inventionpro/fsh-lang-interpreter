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
      if (vars[val.split('(')[0]]?.type === 'function') {
        let newvars = {};
        let passed = val.slice(val.indexOf('('),-1).split(',');
        let arg = vars[val.split('(')[0]].args;
        for (let i = 0; i<arg.length; i++) {
          newvars[arg[i]] = passed[1] || { value:null, type:'null' };
        }
        let con = interpret(vars[val.split('(')[0]].value, 'function', newvars);
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
      case 'print':
        if(args[1]) {
          log('error> unknown exta data passed after print');
          output('Error: Unknown exta data passed after print');
          continue;
        }
        if ((args[0].match(/^print\([^¬]*\)$/m)||[false])[0]) {
          con = readType(args[0].slice(6,-1));
          if (con.type === 'UNKNOWN') {
            log('error> unknown type suplied, recived '+con.value);
            output('Error: Unknown type suplied, recived '+con.value);
            continue;
          }
          output(con.value);
        } else {
          log('error> unknown data suplied, recived '+args[0]);
          output('Error: Unknown data suplied, recived '+args[0]);
          continue;
        }
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
        log('error> unknown keyword')
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
