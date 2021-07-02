s = 'def load_default_certs(self, purpose=Purpose.SERVER_AUTH):'
s2 = '''def load_default_certs(self, purpose=Purpose.SERVER_AUTH):
        print('>>>>>', _ASN1Object)
        print('>>>>>', type(_ASN1Object))
        print('>>>>>', repr(_ASN1Object))

        print('>>>>>', purpose)
        print('>>>>>', type(purpose))
        print('>>>>>', repr(purpose))
        print('>>>>>', not isinstance(purpose, _ASN1Object))

        print('>>>>>', Purpose.SERVER_AUTH)
        print('>>>>>', type(Purpose.SERVER_AUTH))
        print('>>>>>', repr(Purpose.SERVER_AUTH))
        print('>>>>>', not isinstance(Purpose.SERVER_AUTH, _ASN1Object))

        print('>>>>>', purpose == Purpose.SERVER_AUTH, purpose is Purpose.SERVER_AUTH)
'''

src = ''

with open('/usr/lib/python3.8/ssl.py', 'r') as _f:
    src = _f.read()

src = src.replace(s, s2)

with open('/usr/lib/python3.8/ssl.py', 'w') as _f:
    _f.write(src)
