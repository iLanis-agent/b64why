# B64Why

Decodes base64 with a strict RFC 4648 decoder (standard and URL-safe) and a lenient Node-style decoder, tells you exactly what is wrong when one rejects the input, and encodes text in standard, URL-safe and MIME-wrapped forms.

Open `app.html` (static, client-side). Run `node test-engine.js` (needs python3) for the checks.

## Sources
RFC 4648: https://www.rfc-editor.org/rfc/rfc4648.txt, fetched and read directly for sections 3.2 (padding is required unless the referring specification says otherwise), 3.3 (non-alphabet characters), 3.5 (canonical encoding), 5 (URL-safe alphabet table) and 10 (test vectors, base 64 ones used). Accepting URL-safe input without padding is a documented choice under 3.2, since many specs (JWT for one) omit it. MIME wrapping (76 characters, CRLF) is from memory of RFC 2045 and was not fetched.

## Checks
- RFC 4648 section 10 vectors for base 64, both directions.
- 4000 random byte strings encoded (both alphabets, padded or not, wrapped) vs Python base64.
- 6000 mutated strings (inserted, deleted and replaced characters, whitespace, padding) vs Python `b64decode(validate=True)` for standard and URL-safe (URL-safe oracle also rejects + and /).
- Same 6000 vs Node `Buffer.from(s, 'base64')` for the lenient decoder.
- Known deviation, counted in the test output: Python 3.10 accepts surplus padding; the strict decoder here does not, following RFC 4648 section 4.
- Not checked: Python 3.11+ strict_mode, other languages' decoders.
