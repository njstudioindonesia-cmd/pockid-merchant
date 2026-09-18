const fs = require('fs');
const path = 'src/app/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "{branches.length > 0 && (",
  ""
);
code = code.replace(
  "</select>\n            )}",
  "</select>"
);

fs.writeFileSync(path, code, 'utf8');
