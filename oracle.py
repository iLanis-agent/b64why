import json, sys, base64, binascii
req = json.load(sys.stdin)
out = []
def pad(s):
    return s + '=' * ((4 - len(s) % 4) % 4)
for c in req:
    k = c['k']
    try:
        if k == 'enc':
            b = bytes.fromhex(c['hex'])
            r = base64.b64encode(b).decode() if not c.get('url') else base64.urlsafe_b64encode(b).decode()
            if c.get('nopad'): r = r.rstrip('=')
            if c.get('wrap'):
                r = '\n'.join(r[i:i + c['wrap']] for i in range(0, len(r), c['wrap']))
            out.append(r)
        elif k == 'std':
            out.append(base64.b64decode(c['s'], validate=True).hex())
        elif k == 'url':
            s = c['s']
            if '+' in s or '/' in s: raise ValueError('standard alphabet char')
            if '=' not in s:
                if len(s) % 4 == 1: raise ValueError('len')
                s = pad(s)
            out.append(base64.b64decode(s, altchars='-_', validate=True).hex() if True else '')
    except Exception as e:
        out.append('ERR')
json.dump(out, sys.stdout)
