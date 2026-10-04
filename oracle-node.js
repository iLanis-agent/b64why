// stdin: JSON list of strings. Prints Node's lenient Buffer.from(s, 'base64') as hex.
var data = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(JSON.stringify(data.map(function (s) { return Buffer.from(s, 'base64').toString('hex'); })));
