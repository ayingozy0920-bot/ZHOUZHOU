const fs = require('fs');

function fixFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  // replace .then(  with .catch(err => console.error("IDB get error:", err)).then( 
  // only for get(...) calls.
  code = code.replace(/get\(([^)]+)\)\.then\(/g, 'get($1).catch(err => console.error("IDB get error:", err)).then(');
  fs.writeFileSync(file, code);
}

fixFile('src/App.tsx');
fixFile('src/components/Apps/CheckPhoneApp.tsx');
fixFile('src/components/Apps/ParallelUniverseApp.tsx');
