let logs = document.getElementById('logs');
function log(text) {
  logs.value += text+'\n'
}

function readType(val) {
  if (!isNaN(val)) {
    return {
      value: Number(val.split(' ')[0]),
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
  return {
    value: val,
    type: 'UNKNOWN'
  }
}

function interpret(code) {
  logs.value = '';
  log('start> preprocess');
  let preprocess = code
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length>0);
  log('end> preprocess');
  log('start> run');
  let vars = {};
  for (let i = 0; i < preprocess.length; i++) {
    log('start> line '+i);
    let args = preprocess[i].split(' ').map(t=>t.trim()).filter(t=>t.length>0);
    switch (preprocess[i].match(/^[a-zA-Z0-9]+/m)[0]) {
      case 'let':
      case 'const':
        if(args[2] !== '=') {
          log('error> expected = recived '+args[2]);
          continue;
        }
        let con = readType(args.slice(3, args.length).join(' '));
        if (con.type === 'UNKNOWN') {
          log('error> unknown type suplied, recived '+con.value);
          continue;
        }
        vars[args[1]] = { value: con.value, type: con.type, mut: args[0] };
      default:
        log('error> unknown keyword')
    }
    log('end> line '+i);
  }
  log('end> run');
}

document.getElementById('run').onclick = function(){
  interpret(document.getElementById('code').value)
}
