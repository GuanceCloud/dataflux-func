s = 'def load_default_certs(self, purpose=Purpose.SERVER_AUTH):'
s2 = '''def load_default_certs(self, purpose=Purpose.SERVER_AUTH):
        print('>>>>>', purpose, repr(purpose))
        print('>>>>>', _ASN1Object, repr(_ASN1Object))
        print('>>>>>', not isinstance(purpose, _ASN1Object))
'''

src = ''

with open('/usr/lib/python3.8/ssl.py', 'r') as _f:
    src = _f.read()

src = src.replace(s, s2)

with open('/usr/lib/python3.8/ssl.py', 'w') as _f:
    _f.write(src)
