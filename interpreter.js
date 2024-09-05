let logs = document.getElementById('logs');
function log(text) {
  logs.innerHTML += text+'<br>'
}

function readType(val) {
  if (!val) {
    return {
      value: null,
      type: 'null'
    }
  }
  return {}
}

function interpret(code) {
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
        if(args[2] !== '=') {
          log('error> expected = revived '+args[2])
        }
        let con = readType(args.slice(3, args.length).join(' '))
        vars[args[1]] = { value: con.value, type: con.type, mut: 'let' };
    }
    log('end> line '+i);
  }
  log('end> run');
}

document.getElementById('run').onclick = function(){
  interpret(document.getElementById('code').value)
}
