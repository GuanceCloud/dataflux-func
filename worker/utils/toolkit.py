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
import functools

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
from croniter import croniter

SYS_START_TIME = int(time.time())

SHORT_UNIX_TIMESTAMP_OFFSET = 1503982020

MIN_UNIX_TIMESTAMP    = arrow.get('1970-01-01T00:00:00Z').timestamp
MIN_UNIX_TIMESTAMP_MS = MIN_UNIX_TIMESTAMP * 1000
MAX_UNIX_TIMESTAMP    = arrow.get('2099-12-31T23:59:59Z').timestamp
MAX_UNIX_TIMESTAMP_MS = MAX_UNIX_TIMESTAMP * 1000

RE_HTTP_BASIC_AUTH_MASK         = re.compile('://.+:.+@')
RE_HTTP_BASIC_AUTH_MASK_REPLACE = '://***:***@'

MASK_KEYWORDS = [ 'secret', 'password', ]

AES_HEADER = 'AESv2:'

def exception_type(e):
    if not e:
        return None

    return e.__class__.__name__

def exception_text(e):
    if not e:
        return None

    return str(e) or exception_type(e)

def sys_start_time():
    return SYS_START_TIME

def sys_up_time():
    return int(time.time()) - SYS_START_TIME

def sys_exit_ok():
    sys.exit(0)

def sys_exit_error():
    sys.exit(1)

def sys_exit_restart():
    sys.exit(8)

def nope_func(*args, **kwargs):
    pass

def print_var(*args, **kwargs):
    for v in args:
        print(f"[VAR] type=`{type(v)}`, value=`{str(v)}`, obj_size=`{toolkit.get_obj_size(v)}`")

    for name, v in kwargs.items():
        print(f"[VAR] {name}: type=`{type(v)}`, value=`{str(v)}`, obj_size=`{toolkit.get_obj_size(v)}`")

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
    default_size = sys.getsizeof(0)   # estimate sizeof object without __sizeof__

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

def gen_task_id():
    return gen_data_id('task')

def gen_time_serial_seq(d=None, rand_length=4):
    if not d:
        d = get_timestamp(3)
    elif isinstance(d, datetime.datetime):
        d = time.mktime(d.timetuple())

    if not rand_length:
        rand_length = 4

    rand_pow_base = pow(10, rand_length)

    offsetted_timestamp = int(d * 1000 - SHORT_UNIX_TIMESTAMP_OFFSET * 1000) * rand_pow_base
    rand_int = int(random.random() * rand_pow_base)

    return offsetted_timestamp + rand_int

def get_short_id(s, sep='-', count=6):
    if sep in s:
        return s.split(sep)[1][0:count]
    else:
        return s

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
                e = Exception(f'json_find() - hit non-dict at `{curr_path}`')
                raise e

            break

        sub_j = sub_j.get(step)

    return sub_j

def json_find_safe(j, path):
    return json_find(j, path, safe=True)

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

def json_dumps_default(j):
    if isinstance(j, datetime.datetime):
        return to_iso_datetime(j)
    elif isinstance(j, float) and (math.isnan(j) or math.isinf(j)):
        return None
    else:
        return pprint.saferepr(j)

def json_dumps(j, ignore_nothing=False, keep_none=False, **kwargs):
    if j is None and keep_none:
        return None

    kwargs['allow_nan'] = False
    kwargs['indent'] = kwargs.get('indent') or 0

    if ignore_nothing:
        j = no_none_or_whitespace(j)

    try:
        return ujson.dumps(j, **kwargs)

    except Exception as e:
        print(f'Warning: ujson.dumps(...) failed, use simplejson.dumps(...) instead: {repr(e)}')

        kwargs['indent'] = kwargs['indent'] or None
        if not kwargs['indent']:
            kwargs['separators'] = (',', ':')
        return simplejson.dumps(j, default=json_dumps_default, ignore_nan=True, **kwargs)

def json_loads(s):
    return ujson.loads(s)

def json_copy(j):
    return ujson.loads(json_dumps(j))

def json_mask(j):
    masked = {}
    for k, v in j.items():
        masked[k] = j[k]

        for kw in MASK_KEYWORDS:
            if kw in k.lower():
                masked[k] = '*****'
                break

    return masked

def no_duplication(arr):
    return list(set(arr))

def is_none_or_empty(o):
    if o is None:
        return True

    if isinstance(o, six.string_types) and len(o) == 0:
        return True

    return False

def is_none_or_whitespace(o):
    if is_none_or_empty(o):
        return True

    if isinstance(o, six.string_types) and len(o.strip()) == 0:
        return True

    return False

def no_none_or_whitespace(o):
    return dict([(k,v) for k, v in o.items() if not is_none_or_whitespace(v)])

def get_timestamp(ndigits=0):
    if ndigits == 0:
        return int(time.time())
    else:
        return round(time.time(), ndigits)

def get_timestamp_ms():
    return int(time.time() * 1000)

def get_arrow(d=None):
    if isinstance(d, (six.integer_types, float)) or (isinstance(d, six.string_types) and d.isdigit()):
        d = int(d)
        if d > MAX_UNIX_TIMESTAMP:
            d = float(d / 1000)

    return arrow.get(d)

def get_datetime_string(d=None, f=None):
    return get_arrow(d).to('UTC').format(f or 'YYYY-MM-DD HH:mm:ss')

def get_date_string(d=None, f=None):
    return get_datetime_string(d, f or 'YYYY-MM-DD')

def get_time_string(d=None, f=None):
    return get_datetime_string(d, f or 'HH:mm:ss')

def get_datetime_string_cn(d=None, f=None):
    return get_arrow(d).to('Asia/Shanghai').format(f or 'YYYY-MM-DD HH:mm:ss')

def get_date_string_cn(d=None, f=None):
    return get_datetime_string(d, f or 'YYYY-MM-DD')

def get_time_string_cn(d=None, f=None):
    return get_datetime_string(d, f or 'HH:mm:ss')

def to_datetime(d=None):
    return get_arrow(d).datetime

def to_unix_timestamp(d=None):
    return get_arrow(d).timestamp

def to_unix_timestamp_ms(d=None):
    return int(get_arrow(d).float_timestamp * 1000)

def to_iso_datetime(d=None):
    return get_arrow(d).isoformat()

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
    return ts > get_timestamp(3)

def get_days_from_now(d):
    ts = to_unix_timestamp(d)
    days = float(ts - get_timestamp(3)) / 3600 / 24
    return days

def _str_to_hash(s):
    if isinstance(s, (tuple, dict, list, OrderedDict)):
        s = json.dumps(s, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    return s

def get_md5(s):
    h = hashlib.md5()
    s = _str_to_hash(s)
    h.update(six.ensure_binary(s))

    return h.hexdigest()

def get_sha1(s):
    h = hashlib.sha1()
    s = _str_to_hash(s)
    h.update(six.ensure_binary(s))

    return h.hexdigest()

def get_sha256(s):
    h = hashlib.sha256()
    s = _str_to_hash(s)
    h.update(six.ensure_binary(s))

    return h.hexdigest()

def get_sha512(s):
    h = hashlib.sha512()
    s = _str_to_hash(s)
    h.update(six.ensure_binary(s))

    return h.hexdigest()

def _pad_length(text, length):
    text = six.ensure_binary(text)

    count = len(text)
    add_count = length - (count % length)
    text += six.ensure_binary(' ' * add_count)
    return text

def cipher_by_aes(text, key, salt=None):
    text = text or ''
    salted_key = key
    if salt:
        salted_key = f'~{key}~{salt}~'

    salted_key = get_md5(salted_key)

    text       = six.ensure_binary(text)
    salted_key = six.ensure_binary(salted_key)

    text = _pad_length(text, 16)

    c = AES.new(salted_key, AES.MODE_CBC, six.ensure_binary('\0' * 16))
    bin_data = c.encrypt(text)
    data = binascii.b2a_base64(bin_data)
    data = AES_HEADER + six.ensure_str(data).strip()

    return data

def cipher_by_aes_old(text, key, salt=None):
    text = six.ensure_binary(text)
    key  = six.ensure_binary(key)

    text = _pad_length(text, 16)
    key = _pad_length(key, 32)[:32]

    c = AES.new(key, AES.MODE_CBC, six.ensure_binary('\0' * 16))
    bin_data = c.encrypt(text)
    data = binascii.b2a_base64(bin_data)
    data = six.ensure_str(data).strip()

    return data

def decipher_by_aes(data, key, salt=None):
    if not data.startswith(AES_HEADER):
        # 旧版加密结果
        return decipher_by_aes_old(data, key)

    data = data[len(AES_HEADER):]
    salted_key = key
    if salt:
        salted_key = f'~{key}~{salt}~'

    salted_key = get_md5(salted_key)

    data       = six.ensure_binary(data)
    salted_key = six.ensure_binary(salted_key)

    c = AES.new(salted_key, AES.MODE_CBC, six.ensure_binary('\0' * 16))
    bin_data = binascii.a2b_base64(data)
    text = c.decrypt(bin_data)
    text = six.ensure_str(text).strip()

    return text

def decipher_by_aes_old(data, key, salt=None):
    data = six.ensure_binary(data)
    key  = six.ensure_binary(key)

    key = _pad_length(key, 32)[:32]

    c = AES.new(key, AES.MODE_CBC, six.ensure_binary('\0' * 16))
    bin_data = binascii.a2b_base64(data)
    text = c.decrypt(bin_data)

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
        e = Exception(f'Can not use a topic with `{topic}`')
        raise e

    if not name:
        e = Exception(f'Can not use a name with `{name}`')
        raise e

    if not tags:
        cache_key = f'{topic}@{name}'
        return cache_key

    else:
        parts = [str(tag) for tag in tags]
        cache_key = f"{topic}@{name}:{':'.join(parts)}:"
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
        e = Exception('Worker Queue name not specified.')
        raise e

    return f'workerQueue@{name}'

def _get_delay_queue(name):
    if not isinstance(name, int) and not name:
        e = Exception('Delay Queue name not specified.')
        raise e

    return f'delayQueue@{name}'

def group_by_count(arr, count=1):
    '''
    按照`count`对数组进行拆分多个小数组
    '''
    count = int(max(count, 1))

    grouped_arr = []
    for d in arr:
        if not grouped_arr or len(grouped_arr[-1]) >= count:
            grouped_arr.append([])

        grouped_arr[-1].append(d)

    return grouped_arr

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
        reg_exp = f'^{reg_exp}'
    else:
        reg_exp = f'^{reg_exp}$'

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
            limited += f'\n <{length_title}: {len(s)}>'
        elif show_length:
            limited += f' <{length_title}: {len(s)}>'

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
    merged_url = f'{splited_url.scheme}://{splited_url.netloc}{splited_url.path}'
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

class FakeTask(object):
    def __init__(self, fake_task_id=None):
        self.name    = 'WORKER'
        self.queue   = 'NONE'
        self.task_id = fake_task_id or 'WORKER'

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
        super().__setitem__(self.__lower_key(key), value)

    def __getitem__(self, item):
        return super().__getitem__(self.__lower_key(item))

    def __delitem__(self, key):
        super().__delitem__(self.__lower_key(key))

    def update(self, another=None, **kwargs):
        for k, v in another.items():
            self.__setitem__(k, v)

    def __repr__(self):
        return f'{type(self).__name__}({super().__repr__()})'

class LocalCache(object):
    def __init__(self, expires=None):
        self.__data = {
            # <Key>: {
            #     "ts" : <Timestamp>,
            #     "dat": <Data>,
            # }
        }

        self.expires = expires

    def refresh(self, key):
        if not self.expires:
            return

        if key in self.__data:
            self.__data[key]['ts'] = time.time() + self.expires

    def clean(self):
        if not self.expires:
            return

        now = time.time()
        for key in list(self.__data.keys()):
            elem = self.__data.get(key)
            if now - elem['ts'] > self.expires:
                self.__data.pop(key, None)

    def keys(self):
        self.clean()
        return self.__data.keys()

    def __len__(self):
        self.clean()
        return len(self.__data)

    def __setitem__(self, key, data):
        elem = {
            'ts' : time.time(),
            'dat': data,
        }
        self.__data[key] = elem

    def __getitem__(self, key):
        self.clean()

        elem = self.__data.get(key)
        if not elem:
            return None
        else:
            return elem['dat']

    def __delitem__(self, key):
        try:
            del self.__data[key]
        except KeyError as e:
            pass

def mask_auth_url(s):
    try:
        return RE_HTTP_BASIC_AUTH_MASK.sub(RE_HTTP_BASIC_AUTH_MASK_REPLACE, s)
    except Exception as e:
        return s

def to_croniter_style(crontab):
    parts = crontab.split(' ')

    if len(parts) < 5:
        parts.extend([ '*' ] * (5 - len(parts)))

    if len(parts) == 5:
        parts.append('0')
    elif len(parts) > 5:
        parts = parts[1:6] + parts[0:1]

    return ' '.join(parts)

@functools.lru_cache(maxsize=128)
def is_valid_crontab(crontab):
    if not crontab:
        return False

    crontab = to_croniter_style(crontab)
    return croniter.is_valid(crontab)

@functools.lru_cache(maxsize=128)
def is_match_crontab(crontab, t, tz):
    if t is None:
        raise Exception(f'This function use @functools.lru_cache, so parameter `t` should not be `None`')

    crontab = to_croniter_style(crontab)
    at = arrow.get(t).to(tz)
    return croniter.match(crontab, at.datetime)

class DiffTimer(object):
    def __init__(self):
        self.prev_timestamp = time.monotonic()

    def tick(self, unit='ms'):
        prev = self.prev_timestamp
        curr = time.monotonic()

        self.prev_timestamp = curr

        diff = curr - prev
        if unit == 'ms':
            return int((curr - prev) * 1000)
        elif unit == 's':
            return int(curr - prev)
        elif unit == 'm':
            return int((curr - prev) / 60)
        elif unit == 'h':
            return int((curr - prev) / 60 / 60)
        elif unit == 'd':
            return int((curr - prev) / 60 / 60 / 24)
        else:
            return curr - prev

def delta_of_delta_encode(data):
    def delta_encde(_data):
        encoded = []
        prev = None
        for i, d in enumerate(_data):
            if i == 0:
                encoded.append(d)
            else:
                encoded.append(d - prev)

            prev = d

        return encoded

    return delta_encde(delta_encde(data))

def delta_of_delta_decode(data):
    def delta_decode(_data):
        decoded = []
        for i, d in enumerate(_data):
            if i == 0:
                decoded.append(d)
            else:
                decoded.append(d + decoded[-1])

        return decoded

    return delta_decode(delta_decode(data))

def repeat_encode(data):
    encoded = []
    for d in data:
        if not encoded:
            encoded.append(d)
        else:
            if isinstance(encoded[-1], (int, float)):
                if encoded[-1] == d:
                    encoded[-1] = [ encoded[-1], 2 ]
                else:
                    encoded.append(d)
            else:
                if encoded[-1][0] == d:
                    encoded[-1][1] += 1
                else:
                    encoded.append(d)

    return encoded

def repeat_decode(data):
    decoded = []
    for d in data:
        if isinstance(d, (int, float)):
            decoded.append(d)
        else:
            decoded.extend([ d[0] ] * d[1])

    return decoded

def str_byte_size(s, encoding='utf-8'):
    return len(s.encode(encoding))

def str_split_by_bytes(content, page_bytes, page_header=True):
    # 按行切分
    content_lines = content
    if isinstance(content, str):
        content_lines = content.splitlines()

    # 每行字节数
    content_line_bytes = list(map(lambda x: str_byte_size(x), content_lines))

    # 最大页头字节数
    page_header_bytes = 0
    if page_header:
        page_header_bytes = len(f'[{len(content_lines)}/{len(content_lines)}]\n')

    pages = []

    tmp_bytes = 0
    start_i = 0
    for end_i, line_bytes in enumerate(content_line_bytes):
        if tmp_bytes > 0 and tmp_bytes + line_bytes + (end_i - start_i) > (page_bytes - page_header_bytes):
            pages.append(content_lines[start_i:end_i])
            start_i = end_i
            tmp_bytes = line_bytes

        else:
            tmp_bytes += line_bytes

    else:
        if tmp_bytes > 0:
            pages.append(content_lines[start_i:])

    joined_pages = []
    for page_num, page_lines in enumerate(pages, start=1):
        if len(pages) > 1:
            p = f'[{page_num}/{len(pages)}]\n' + '\n'.join(page_lines)
        else:
            p = '\n'.join(page_lines)

        joined_pages.append(p)

    return joined_pages
