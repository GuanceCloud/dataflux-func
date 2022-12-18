# -*- coding: utf-8 -*-

# Built-in Modules
import os
import sys
import psutil
import itertools
import re
import uuid
import time
import json
import datetime
import hashlib
import random
from collections import OrderedDict, deque
import binascii
import base64
import math
import pprint

try:
    from urllib import urlencode
    from urlparse import urlsplit, urlparse, parse_qs
except ImportError:
    from urllib.parse import urlsplit, urlparse, urlencode, parse_qs

# 3rd-party Modules
import six
import simplejson, ujson
import arrow
from dateutil import parser as dateutil_parser
import nanoid
from Cryptodome.Cipher import AES

SHORT_UNIX_TIMESTAMP_OFFSET = 1503982020

MIN_UNIX_TIMESTAMP    = 0;
MIN_UNIX_TIMESTAMP_MS = MIN_UNIX_TIMESTAMP * 1000
MAX_UNIX_TIMESTAMP    = 2145888000 # 2038-01-01 00:00:00
MAX_UNIX_TIMESTAMP_MS = MAX_UNIX_TIMESTAMP * 1000

RE_HTTP_BASIC_AUTH_MASK         = re.compile('://.+:.+@')
RE_HTTP_BASIC_AUTH_MASK_REPLACE = '://***:***@'

def print_var(v, name=None):
    print('[VAR] `{}` type=`{}`, value=`{}`, obj_size=`{}`'.format(name or '<NO NAME>', type(v), str(v), get_obj_size(v)))

def get_obj_size(o, handlers={}):
    '''
    获取内存占用大小
    参考：https://code.activestate.com/recipes/577504/
    '''
    dict_handler = lambda d: itertools.chain.from_iterable(d.items())
    all_handlers = {
        tuple    : iter,
        list     : iter,
        deque    : iter,
        dict     : dict_handler,
        set      : iter,
        frozenset: iter,
    }

    all_handlers.update(handlers)     # user handlers take precedence
    seen = set()                      # track which object id's have already been seen
    default_size = sys.getsizeof(0)       # estimate sizeof object without __sizeof__

    def sizeof(o):
        if id(o) in seen:       # do not double count the same object
            return 0

        seen.add(id(o))
        s = sys.getsizeof(o, default_size)

        for typ, handler in all_handlers.items():
            if isinstance(o, typ):
                s += sum(map(sizeof, handler(o)))
                break

        return s

    return sizeof(o)

def get_memory_usage():
    '''
    获取内存使用量
    '''
    pid = os.getpid()
    p = psutil.Process(pid)
    memory_usage = p.memory_full_info().uss
    return memory_usage

def get_attr(obj, attr, default=None):
    if hasattr(obj, attr):
        return obj.__getattribute__(attr)

    return default

def gen_uuid():
    return str(uuid.uuid4())

def gen_data_id(prefix=None):
    prefix = prefix or 'data'
    return prefix + '-' + nanoid.generate('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 12)

def gen_time_serial_seq(d=None, rand_length=4):
    if not d:
        d = time.time()
    elif isinstance(d, datetime.datetime):
        d = time.mktime(d.timetuple())

    if not rand_length:
        rand_length = 4

    rand_pow_base = pow(10, rand_length)

    offsetted_timestamp = int(d * 1000 - SHORT_UNIX_TIMESTAMP_OFFSET * 1000) * rand_pow_base
    rand_int = int(random.random() * rand_pow_base)

    return offsetted_timestamp + rand_int

def get_first_part(s, sep='-', count=2):
    return sep.join(s.split(sep)[0:count])

def json_find(j, path, safe=False):
    if j is None:
        if safe:
            return None
        else:
            e = Exception('json_find() - hit `None`')
            raise e

    if not isinstance(path, six.string_types):
        if safe:
            return None
        else:
            e = Exception('json_find() - Path must be a string or unicode')
            raise e

    curr_path = '<TOP>'
    sub_j = j
    steps = path.split('.')
    for step in steps:
        curr_path = '.'.join([curr_path, step])

        if not isinstance(sub_j, (dict, OrderedDict)):
            if safe:
                return None
            else:
                e = Exception('json_find() - hit non-dict at `{}`'.format(curr_path))
                raise e

            break

        sub_j = sub_j.get(step)

    return sub_j

def json_smart_find(j, key, safe=False):
    if j is None:
        if safe:
            return None
        else:
            e = Exception('json_smart_find() - hit `None`')
            raise e

    if not isinstance(key, six.string_types):
        if safe:
            return None
        else:
            e = Exception('json_smart_find() - Key must be a string or unicode')
            raise e

    ret = None
    if key in j:
        return j[key]

    for k, v in j.items():
        if isinstance(v, (dict, OrderedDict)):
            ret = json_smart_find(v, key, safe)
            if ret is not None:
                break

    return ret

def json_override(s, d):
    if not s:
        return d

    for k in s.keys():
        if k not in d:
            d[k] = s[k]
        elif isinstance(s[k], (tuple, list)):
            d[k] = s[k]
        elif s[k] is None:
            d[k] = s[k]
        elif isinstance(s[k], dict):
            json_override(s[k], d[k])
        else:
            d[k] = s[k]

    return d

def json_pick(j, keys=None):
    if keys is None:
        return {}

    picked = {}
    for k in keys:
        picked[k] = j[k]

    return picked

def json_update_by_keys(s, d, keys=None):
    if keys is None:
        return d

    picked = json_pick(d, keys)
    d.update(picked)

    return d

def json_dumps_default(v):
    if isinstance(v, datetime.datetime):
        return to_iso_datetime(v)
    elif isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    else:
        return pprint.saferepr(v)

def json_dumps(v, **kwargs):
    kwargs['allow_nan'] = False
    kwargs['indent'] = kwargs.get('indent') or 0

    try:
        return ujson.dumps(v, **kwargs)

    except Exception as e:
        print('Warning: ujson.dumps(...) failed, use simplejson.dumps(...) instead: ', repr(e))

        kwargs['indent'] = kwargs['indent'] or None
        if not kwargs['indent']:
            kwargs['separators'] = (',', ':')
        return simplejson.dumps(v, default=json_dumps_default, ignore_nan=True, **kwargs)

def json_loads(s):
    return ujson.loads(s)

def json_copy(j):
    return ujson.loads(json_dumps(j))

def no_duplication(arr):
    return list(set(arr))

def is_none_or_empty(o):
    if o is None:
        return True

    if isinstance(o, six.string_types) and len(o) == 0:
        return True

    return False

def is_none_or_white_space(o):
    if is_none_or_empty(o):
        return True

    if isinstance(o, six.string_types) and len(o.strip()) == 0:
        return True

    return False

def no_none_or_white_space(o):
    return dict([(k,v) for k, v in o.items() if not is_none_or_white_space(v)])

def get_date_string(d=None, f=None):
    if not d:
        d = time.time()
    elif isinstance(d, six.string_types):
        d = to_unix_timestamp(d)
    elif isinstance(d, datetime.datetime):
        d = time.mktime(d.timetuple())

    if not f:
        f = '%Y-%m-%d'
    return time.strftime(f, time.localtime(d))

def get_time_string(d=None, f=None):
    if not d:
        d = time.time()
    elif isinstance(d, six.string_types):
        d = to_unix_timestamp(d)
    elif isinstance(d, datetime.datetime):
        d = time.mktime(d.timetuple())

    if not f:
        f = '%H:%M:%S'
    return time.strftime(f, time.localtime(d))

def get_datetime_string(d=None, f=None):
    if not d:
        d = time.time()
    elif isinstance(d, six.string_types):
        d = to_unix_timestamp(d)
    elif isinstance(d, datetime.datetime):
        d = time.mktime(d.timetuple())

    if not f:
        f = '%Y-%m-%d %H:%M:%S'
    return time.strftime(f, time.localtime(d))

def to_arrow(d):
    d_arrow = None
    if isinstance(d, (six.integer_types, float)):
        # UNIX Timstamp in number type
        if d > MAX_UNIX_TIMESTAMP:
            d = int(d / 1000)

        d_arrow = arrow.get(d)

    elif isinstance(d, six.string_types) and d.isdigit():
        # UNIX Timstamp in string type
        if len(d) > len(str(MAX_UNIX_TIMESTAMP)):
            d = d[0:-3]

        d_arrow = arrow.get(d)

    else:
        # Normal
        try:
            d_arrow = arrow.get(d)
        except Exception as e:
            d_arrow = arrow.get(dateutil_parser.parse(d))

    return d_arrow

def to_datetime(d):
    d_arrow = to_arrow(d)
    return d_arrow.datetime

def to_unix_timestamp(d):
    d_arrow = to_arrow(d)
    return d_arrow.timestamp

def to_unix_timestamp_ms(d):
    timestamp = to_unix_timestamp(d)
    return timestamp * 1000

def to_iso_datetime(d):
    d_arrow = to_arrow(d)
    return d_arrow.isoformat()

def to_boolean(o):
    if isinstance(o, bool):
        return o

    if isinstance(o, (int, float)):
        return o > 0

    if isinstance(o, str):
        if o.lower() in ['true',  '1', 'o', 'y', 'yes', 'ok', 'on' ]:
            return True
        if o.lower() in ['false', '0', 'x', 'n', 'no',  'ng', 'off']:
            return False

    return None

def is_past_datetime(d):
    ts = to_unix_timestamp(d)
    return ts > time.time()

def get_days_from_now(d):
    ts = to_unix_timestamp(d)
    days = float(ts - time.time()) / 3600 / 24
    return days

def get_md5(s):
    h = hashlib.md5()
    h.update(six.ensure_binary(s))

    return h.hexdigest()

def get_sha1(s):
    h = hashlib.sha1()
    h.update(six.ensure_binary(s))

    return h.hexdigest()

def get_sha512(s):
    h = hashlib.sha512()
    h.update(six.ensure_binary(s))

    return h.hexdigest()

def _pad_length(text, length):
    text = six.ensure_binary(text)

    count = len(text)
    add_count = length - (count % length)
    text += six.ensure_binary(' ' * add_count)
    return text

def cipher_by_aes(text, key):
    text = six.ensure_binary(text)
    key  = six.ensure_binary(key)

    text = _pad_length(text, 16)
    key = _pad_length(key, 32)[:32]

    c = AES.new(key, AES.MODE_CBC, six.ensure_binary('\0' * 16))
    bin_data = c.encrypt(text)
    data = binascii.b2a_base64(bin_data)

    return data.strip()

def decipher_by_aes(data, key):
    key = six.ensure_binary(key)

    key = _pad_length(key, 32)[:32]

    c = AES.new(key, AES.MODE_CBC, six.ensure_binary('\0' * 16))
    bin_data = binascii.a2b_base64(data)
    text = c.decrypt(bin_data)

    print(repr(text))
    return six.ensure_str(text).strip()

def get_base64(s):
    s = six.ensure_binary(s)

    encoded = base64.b64encode(s)
    encoded = six.ensure_str(encoded)

    return encoded

def from_base64(s):
    s = six.ensure_binary(s)

    decoded = base64.b64decode(s)
    decoded = six.ensure_str(decoded)
    return decoded

def gen_rand_string(length=None, chars=None):
    if not length:
        length = 32

    samples = chars or '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    rand_string = ''
    for i in range(length):
        rand_string += ''.join(random.sample(samples, 1))

    return rand_string

def _get_cache_key(topic, name, tags=None):
    if not topic:
        e = Exception('WAT: Can not use a topic with `{}`'.format(topic))
        raise e

    if not name:
        e = Exception('WAT: Can not use a name with `{}`'.format(name))
        raise e

    if not tags:
        cache_key = '{}@{}'.format(topic, name)
        return cache_key

    else:
        parts = [str(tag) for tag in tags]
        cache_key = '{}@{}:{}:'.format(topic, name, ':'.join(parts))
        return cache_key

def _parse_cache_key(cache_key):
    topic_rest_parts = cache_key.split('@')
    topic = topic_rest_parts[0]
    rest  = '@'.join(topic_rest_parts[1:])

    name_rest_parts = rest.rstrip(':').split(':')
    name    = name_rest_parts[0]
    tag_kvs = name_rest_parts[1:]

    cache_key_info = {
        'topic': topic,
        'name' : name,
        'tags' : {},
    }
    for i in range(0, len(tag_kvs), 2):
        if i + 1 >= len(tag_kvs):
            cache_key_info['tags'][tag_kvs[i]] = None
        else:
            cache_key_info['tags'][tag_kvs[i]] = tag_kvs[i + 1]

    return cache_key_info

def _get_worker_queue(name):
    if not isinstance(name, int) and not name:
        e = Exception('WAT: Queue name not specified.')
        raise e

    return 'workerQueue@{}'.format(name)

def as_array(o):
    if o is None:
        return o

    elif isinstance(o, (list, tuple, set)):
        return list(o)

    else:
        return [o]

def as_array_str(o):
    if isinstance(o, six.string_types):
        return o

    arr = as_array(o)
    if arr is None:
        return arr
    else:
        return ','.join(arr)

def gen_reg_exp_by_wildcard(pattern):
    reg_exp = pattern.replace('.', '\\.') \
                        .replace('|', '\\|') \
                        .replace('**', '[^\\.\\|]+') \
                        .replace('*', '[^\\.\\|]+')

    if pattern.endswith('**'):
        reg_exp = '^{}'.format(reg_exp)
    else:
        reg_exp = '^{}$'.format(reg_exp)

    return reg_exp

def match_wildcard(value, pattern):
    reg_exp = gen_reg_exp_by_wildcard(pattern);

    if re.match(reg_exp, value):
        return True
    else:
        return False

def match_wildcards(value, patterns):
    if not value or not patterns:
        return False

    patterns = as_array(patterns)

    for p in patterns:
        if match_wildcard(value, p):
            return True

    return False

def limit_text(s, max_length=30, show_length=None, length_title=None):
    length_title = length_title or 'Length'
    if len(s) <= max_length:
        return s
    else:
        limited = s[0:max_length - 3] + '...'

        if show_length == 'newLine':
            limited += '\n <{}: {}>'.format(length_title, len(s))
        elif show_length:
            limited += ' <{}: {}>'.format(length_title, len(s))

        return limited

def merge_query(url, query):
    merged_query = {}

    splited_url = urlsplit(url)
    if splited_url.query:
        merged_query = parse_qs(splited_url.query)

    if isinstance(query, dict):
        merged_query.update(query)

    scheme = six.ensure_str(splited_url.scheme)
    netloc = six.ensure_str(splited_url.netloc)
    path   = six.ensure_str(splited_url.path)
    merged_url = '{}://{}{}'.format(splited_url.scheme, splited_url.netloc, splited_url.path)
    if merged_query:
        next_query = {}
        for k, v in merged_query.items():
            if v is None:
                continue

            is_multi = isinstance(v, (list, tuple))
            if is_multi and len(v) <= 0:
                continue

            if is_multi:
                next_query[k] = v[0]
            else:
                next_query[k] = v

        sorted_query = sorted(next_query.items(), key=lambda x: x[1])
        merged_url += '?' + urlencode(sorted_query)

    return merged_url

def to_short_unix_timestamp(t):
    return t - SHORT_UNIX_TIMESTAMP_OFFSET

def from_short_unix_timestamp(t):
    return t + SHORT_UNIX_TIMESTAMP_OFFSET

class FakeTaskRequest(object):
    def __init__(self, fake_task_id=None):
        self.called_directly = False
        self.id              = fake_task_id or 'TASK-' + gen_rand_string(4).upper()
        self.delivery_info   = { 'routing_key': 'WORKER-INTERNAL@NONE' }
        self.origin          = 'WORKER-INTERNAL'

class FakeTask(object):
    def __init__(self, fake_task_id=None):
        self.request = FakeTaskRequest(fake_task_id)
        self.name    = 'WORKER-INTERNAL'

class IgnoreCaseDict(dict):
    def __lower_key(self, key):
        if isinstance(key, str):
            return key.lower()
        return key

    def __init__(self, *args, **kwargs):
        d = dict(*args, **kwargs)
        for k, v in d.items():
            self[k] = v

    def __setitem__(self, key, value):
        super(IgnoreCaseDict, self).__setitem__(self.__lower_key(key), value)

    def __getitem__(self, item):
        return super(IgnoreCaseDict, self).__getitem__(self.__lower_key(item))

    def __delitem__(self, key):
        super(IgnoreCaseDict, self).__delitem__(self.__lower_key(key))

    def update(self, another=None, **kwargs):
        for k, v in another.items():
            self.__setitem__(k, v)

    def __repr__(self):
        return '{0}({1})'.format(type(self).__name__, super(IgnoreCaseDict, self).__repr__())

class LocalCache(object):
    def __init__(self, expires=None, clean_interval=60):
        self.__last_clean = time.time()
        self.__data = {
            # <Key>: {
            #     "ts" : <Timestamp>,
            #     "dat": <Data>,
            # }
        }

        self.expires        = expires
        self.clean_interval = clean_interval

    def refresh(self, key):
        if not self.expires:
            return

        if key in self.__data:
            self.__data[key]['ts'] = time.time() + self.expires

    def clean(self):
        now = time.time()

        if not self.expires:
            return now

        if now - self.__last_clean < self.clean_interval:
            return now

        for key in list(self.__data.keys()):
            elem = self.__data.get(key)
            if now - elem['ts'] > self.expires:
                try:
                    self.__data[key]
                except KeyError as e:
                    pass

        return now

    def keys(self):
        return self.__data.keys()

    def __len__(self):
        self.clean()

        return len(self.__data)

    def __setitem__(self, key, data):
        now = self.clean()

        elem = {
            'ts' : now,
            'dat': data,
        }
        self.__data[key] = elem

    def __getitem__(self, key):
        now = self.clean()

        elem = self.__data.get(key)
        if not elem:
            return None

        elif self.expires and now - elem['ts'] > self.expires:
            self.__data.pop(key, None)
            return None

        else:
            return elem['dat']

    def __delitem__(self, key):
        try:
            del self.__data[key]
        except KeyError as e:
            pass

def mask_sensitive_info(s):
    try:
        return RE_HTTP_BASIC_AUTH_MASK.sub(RE_HTTP_BASIC_AUTH_MASK_REPLACE, s)
    except Exception as e:
        return s