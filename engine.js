(function (root) {
  'use strict';
  var STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var URL_ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function encode(bytes, opt) {
    opt = opt || {}; var A = opt.url ? URL_ : STD, out = '', i;
    for (i = 0; i + 2 < bytes.length; i += 3) { var n = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2]; out += A[n >> 18] + A[n >> 12 & 63] + A[n >> 6 & 63] + A[n & 63]; }
    var r = bytes.length - i;
    if (r === 1) { out += A[bytes[i] >> 2] + A[(bytes[i] & 3) << 4] + (opt.nopad ? '' : '=='); }
    else if (r === 2) { var m = bytes[i] << 8 | bytes[i + 1]; out += A[m >> 10] + A[m >> 4 & 63] + A[(m & 15) << 2] + (opt.nopad ? '' : '='); }
    if (opt.wrap) { var lines = []; for (var j = 0; j < out.length; j += opt.wrap) lines.push(out.slice(j, j + opt.wrap)); out = lines.join('\r\n'); }
    return out;
  }
  // Strict decode (RFC 4648 section 3.3: reject anything outside the alphabet).
  // padding 'required' (section 4) or 'optional' (section 5 allows omitting it when the spec says so).
  function strict(s, url, padding) {
    var A = url ? URL_ : STD, i, body = s, pads = 0;
    var m = /=*$/.exec(s); pads = m[0].length; body = s.slice(0, s.length - pads);
    for (i = 0; i < body.length; i++) if (A.indexOf(body[i]) < 0) return { error: 'Character ' + JSON.stringify(body[i]) + ' at position ' + (i + 1) + ' is not in the ' + (url ? 'URL-safe' : 'standard') + ' alphabet' + (STD.indexOf(body[i]) >= 0 || URL_.indexOf(body[i]) >= 0 ? ' (it belongs to the other one)' : '') + '.' };
    if (body.length % 4 === 1) return { error: 'Length leaves a single leftover character, which can never be valid.' };
    var need = (4 - body.length % 4) % 4;
    if (pads) { if (pads !== need) return { error: pads + ' padding characters, expected ' + need + '.' }; }
    else if (need && padding === 'required') return { error: 'Missing ' + need + ' padding character' + (need > 1 ? 's' : '') + ' (length must be a multiple of 4).' };
    return decodeBody(body, A);
  }
  function decodeBody(body, A) {
    var out = [], acc = 0, bits = 0, i;
    for (i = 0; i < body.length; i++) { acc = (acc << 6) | A.indexOf(body[i]); bits += 6; if (bits >= 8) { bits -= 8; out.push((acc >> bits) & 255); acc &= (1 << bits) - 1; } }
    return { bytes: Uint8Array.from(out), canonical: acc === 0 };
  }
  // Lenient decode in the style of Node's Buffer.from(s, 'base64'): both alphabets, skips anything else, stops at the first "=".
  function lenient(s) {
    var body = '', i, c; for (i = 0; i < s.length; i++) { c = s[i]; if (c === '=') break; if (STD.indexOf(c) >= 0 || c === '-' || c === '_') body += c === '-' ? '+' : c === '_' ? '/' : c; }
    if (body.length % 4 === 1) body = body.slice(0, -1);
    var r = decodeBody(body, STD); return { bytes: r.bytes, canonical: r.canonical, skipped: s.replace(/=+$/, '').length - body.length };
  }
  function hex(b) { return Array.prototype.map.call(b, function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join(''); }
  function text(b) { try { return new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (e) { return null; } }
  var api = { encode: encode, strict: strict, lenient: lenient, hex: hex, text: text, STD: STD, URL: URL_ };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.B64Why = api;
})(typeof window !== 'undefined' ? window : this);
