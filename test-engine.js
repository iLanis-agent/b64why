'use strict';
var B = require('./engine.js'), cp = require('child_process');
var checks = 0, fails = 0, report = [];
function eq(a, b, m) { checks++; if (a !== b) { fails++; if (fails < 25) console.log('FAIL', m, JSON.stringify(a), '!=', JSON.stringify(b)); } }
var te = new TextEncoder();
// 1. RFC 4648 section 10 test vectors (base 64), read from the RFC
[['', ''], ['f', 'Zg=='], ['fo', 'Zm8='], ['foo', 'Zm9v'], ['foob', 'Zm9vYg=='], ['fooba', 'Zm9vYmE='], ['foobar', 'Zm9vYmFy']].forEach(function (v) {
  eq(B.encode(te.encode(v[0])), v[1], 'RFC encode ' + v[0]);
  var d = B.strict(v[1], false, 'required'); eq(d.error ? 'ERR' : B.text(d.bytes), v[0], 'RFC decode ' + v[0]);
});
// 2. Named traps
eq(B.encode(Uint8Array.from([0xfb, 0xff]), {}), '+/8=', 'plus slash'); eq(B.encode(Uint8Array.from([0xfb, 0xff]), { url: true, nopad: true }), '-_8', 'url form');
eq(!!B.strict('-_8', false, 'required').error, true, 'url text fails standard decoder'); eq(!!B.strict('Zg', false, 'required').error, true, 'missing padding');
eq(!!B.strict('Zg', true, 'optional').error, false, 'optional padding ok'); eq(!!B.strict('Z', true, 'optional').error, true, 'single char invalid'); eq(B.strict('Zh==', false, 'required').canonical, false, 'non-canonical pad bits');
// 3. Random vs Python and Node
var seed = 11; function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
function ri(n) { return Math.floor(rnd() * n); }
function run(cmd, args, input) { try { return JSON.parse(cp.execFileSync(cmd, args, { input: JSON.stringify(input), maxBuffer: 1 << 28, cwd: __dirname }).toString()); } catch (e) { return null; } }
var N = 4000, encs = [];
for (var i = 0; i < N; i++) { var n = ri(40), b = []; for (var j = 0; j < n; j++) b.push(rnd() < .25 ? pickSpecial() : ri(256)); encs.push({ b: Uint8Array.from(b), url: rnd() < .5, nopad: rnd() < .3, wrap: rnd() < .2 ? 4 + ri(10) : 0 }); }
function pickSpecial() { return [0xfb, 0xff, 0xfe, 0x3e, 0x3f, 0x00][ri(6)]; }
var o = run('python3', ['oracle.py'], encs.map(function (e) { return { k: 'enc', hex: B.hex(e.b), url: e.url, nopad: e.nopad, wrap: e.wrap }; }));
encs.forEach(function (e, i) { eq(B.encode(e.b, { url: e.url, nopad: e.nopad, wrap: e.wrap }).replace(/\r\n/g, '\n'), o[i], 'encode ' + B.hex(e.b)); });
report.push('encode: ' + N + ' random byte strings (both alphabets, padded or not, wrapped) vs Python base64');
// decode inputs: valid encodings mutated at random
var AL = B.STD + '-_=  \n'; var ds = [];
for (i = 0; i < 6000; i++) { var s = B.encode(encs[ri(N)].b, { url: rnd() < .5, nopad: rnd() < .5 }); var k = ri(4); for (var t = 0; t < k; t++) { var p = ri(s.length + 1), r = rnd(); if (r < .4) s = s.slice(0, p) + AL[ri(AL.length)] + s.slice(p); else if (r < .7) s = s.slice(0, p) + s.slice(p + 1); else s = s.slice(0, p) + AL[ri(AL.length)] + s.slice(p + 1); } ds.push(s); }
o = run('python3', ['oracle.py'], ds.map(function (s) { return { k: 'std', s: s }; }));
var surplus = 0;
function cmpStrict(d, ov, s, name) { var mine = d.error ? 'ERR' : B.hex(d.bytes); if (mine === ov) { checks++; return; } if (d.error && /padding characters, expected/.test(d.error) && ov !== 'ERR') { surplus++; return; } eq(mine, ov, name + ' ' + JSON.stringify(s)); }
ds.forEach(function (s, i) { cmpStrict(B.strict(s, false, 'required'), o[i], s, 'strict std'); });
o = run('python3', ['oracle.py'], ds.map(function (s) { return { k: 'url', s: s }; }));
ds.forEach(function (s, i) { cmpStrict(B.strict(s, true, 'optional'), o[i], s, 'strict url'); });
report.push('strict decode: ' + ds.length + ' mutated strings x 2 alphabets vs Python b64decode(validate=True); ' + surplus + ' known Python deviations (it accepts surplus padding, which RFC 4648 section 4 does not allow)');
o = run('node', ['oracle-node.js'], ds);
var agree = 0, bad = 0; ds.forEach(function (s, i) { if (B.hex(B.lenient(s).bytes) === o[i]) { agree++; checks++; } else { bad++; fails++; if (fails < 25) console.log('FAIL lenient', JSON.stringify(s), B.hex(B.lenient(s).bytes), o[i]); } });
report.push('lenient decode: ' + agree + ' of ' + ds.length + ' agree with Node Buffer.from(s, "base64")');
report.forEach(function (l) { console.log(l); }); console.log(checks + ' checks, ' + fails + ' failures'); process.exit(fails ? 1 : 0);
