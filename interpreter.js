let logs = document.getElementById('logs');
function log(text) {
  logs.value += text+'\n';
}

let out = document.getElementById('output');
function output(text) {
  out.value += text+'\n';
}

function interpret(code) {
  logs.value = '';
  out.value = '';
  let vars = {};
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
      if (vars[val].type) {
        return {
          value: vars[val].value,
          type: vars[val].type
        }
      }
    }
    return {
      value: val,
      type: 'UNKNOWN'
    }
  }
  log('start> preprocess');
  let preprocess = code
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length>0);
  log('end> preprocess');
  log('start> run');
  for (let i = 0; i < preprocess.length; i++) {
    log('start> line '+i);
    let args = preprocess[i].split(' ').map(t=>t.trim()).filter(t=>t.length>0);
    switch (preprocess[i].match(/^[a-zA-Z0-9]+/m)[0]) {
      case 'let':
      case 'const':
        if(args[2] !== '=') {
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
        let con = readType(args.slice(3, args.length).join(' '));
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
          let con = readType(args[0].slice(6,-1));
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
      default:
        log('error> unknown keyword')
        break;
    }
    log('end> line '+i);
  }
  log('end> run');
}

document.getElementById('run').onclick = function(){
  interpret(document.getElementById('code').value)
}
