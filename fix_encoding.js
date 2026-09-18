const fs = require('fs');
const path = 'src/app/page.tsx';
let code = fs.readFileSync(path);
// readFileSync without encoding reads a Buffer. If it's UTF-16LE, we can decode it.
// Actually, let's just write a new valid UTF-8 file!
