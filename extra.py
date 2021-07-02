f = '/usr/lib/python3.8/ssl.py'
s = 'def load_default_certs(self, purpose=Purpose.SERVER_AUTH):'
s2 = '''def load_default_certs(self, purpose=Purpose.SERVER_AUTH):
        print('>>>>>', _ASN1Object)
        print('>>>>>', type(_ASN1Object))
        print('>>>>>', repr(_ASN1Object))

        print('>>>>>', purpose)
        print('>>>>>', type(purpose))
        print('>>>>>', repr(purpose))
        print('>>>>>', purpose.__class__.__bases__)
        print('>>>>>', not isinstance(purpose, _ASN1Object))

        print('>>>>>', Purpose.SERVER_AUTH)
        print('>>>>>', type(Purpose.SERVER_AUTH))
        print('>>>>>', repr(Purpose.SERVER_AUTH))
        print('>>>>>', Purpose.SERVER_AUTH.__class__.__bases__)
        print('>>>>>', not isinstance(Purpose.SERVER_AUTH, _ASN1Object))
'''

src = ''
with open(f, 'r') as _f:
    src = _f.read().replace(s, s2)

with open(f, 'w') as _f:
    _f.write(src)


f = '/usr/local/lib/python3.8/dist-packages/urllib3/connection.py'
s = 'context.load_default_certs()'
s2 = 'context.load_default_certs(ssl.Purpose.SERVER_AUTH)'

src = ''
with open(f, 'r') as _f:
    src = _f.read().replace(s, s2)

with open(f, 'w') as _f:
    _f.write(src)
