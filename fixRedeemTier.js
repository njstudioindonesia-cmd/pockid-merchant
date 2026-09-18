const fs = require('fs');
const path = 'src/app/settings/page.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "proType: codeData.tier === 'enterprise' ? 'permanent' : codeData.tier,",
  "proType: codeData.tier,"
);

fs.writeFileSync(path, code);
