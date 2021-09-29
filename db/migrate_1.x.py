# -*- coding: utf-8 -*-

# Builtin Modules
import sys
import argparse
import json
import re
from pprint import pprint

# 3rd-party Modules
import MySQLdb
from MySQLdb.cursors import DictCursor

TABLE_MIGRATE_PREFIX  = '_migrated'
TABLE_MIGRATE_VERSION = '1_x'
MIGRATED_TABLE_PREFIX = '{}_{}'.format(TABLE_MIGRATE_PREFIX, TABLE_MIGRATE_VERSION)

DATAFLUX_SCRIPT_SET_REF_NAME_MAP = {
    'ft_lib': 'dataflux',
}
DATAFLUX_SCRIPT_REF_NAME_MAP = {
    'ft_bat_log'     : 'log',
    'ft_chk'         : 'check_basic',
    'ft_clct'        : 'collect',
    'ft_pred'        : 'dps_predict',
    'ft_tran'        : 'dps_transform_number',
    'ft_tran_str'    : 'dps_transform_string',
    'level_shift_chk': 'check_level_shift',
    'range_chk'      : 'check_range',
    'spike_chk'      : 'check_spike',
}
DATAFLUX_FUNC_NAME_MAP = {
    'log_process_json_abstract'     : 'json_abstract',
    'log_process_regexp_abstract'   : 'regexp_abstract',
    'log_process_regexp_abstract_v2': 'regexp_abstract_multi',
    'log_process_grok_abstract'     : 'grok_abstract',
    'log_process_grok_abstract_v2'  : 'grok_abstract_multi',
}

# -----------------------------------------------
# Python2 ~ Python3 Compatibility Code From `six`
# -----------------------------------------------
#
# Copyright (c) 2010-2019 Benjamin Peterson
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

PY2 = sys.version_info[0] == 2
PY3 = sys.version_info[0] == 3
PY34 = sys.version_info[0:2] >= (3, 4)

if PY3:
    string_types = str,
    integer_types = int,
    class_types = type,
    text_type = str
    binary_type = bytes
else:
    string_types = basestring,
    integer_types = (int, long)
    class_types = (type, types.ClassType)
    text_type = unicode
    binary_type = str

def ensure_binary(s, encoding='utf-8', errors='strict'):
    if isinstance(s, text_type):
        return s.encode(encoding, errors)
    elif isinstance(s, binary_type):
        return s
    else:
        raise TypeError("not expecting type '%s'" % type(s))

def ensure_str(s, encoding='utf-8', errors='strict'):
    if not isinstance(s, (text_type, binary_type)):
        raise TypeError("not expecting type '%s'" % type(s))
    if PY2 and isinstance(s, text_type):
        s = s.encode(encoding, errors)
    elif PY3 and isinstance(s, binary_type):
        s = s.decode(encoding, errors)
    return s

if PY2:
    FILE_OPEN_KWARGS = {}
else:
    FILE_OPEN_KWARGS = dict(encoding='utf8')

COLOR_MAP = {
    'grey'   : '\033[0;30m',
    'red'    : '\033[0;31m',
    'green'  : '\033[0;32m',
    'yellow' : '\033[0;33m',
    'blue'   : '\033[0;34m',
    'magenta': '\033[0;35m',
    'cyan'   : '\033[0;36m',
}
def colored(s, color=None):
    if not color:
        color = 'yellow'

    color = COLOR_MAP[color]

    return color + '{}\033[0m'.format(s)

def get_client(client_configs):
    client_configs['charset']     = 'utf8mb4'
    client_configs['cursorclass'] = DictCursor

    client = MySQLdb.connect(**client_configs)

    return client

def _get_all_tables(client):
    sql = '''
        SHOW TABLES
        '''
    client.execute(sql)
    db_res = client.fetchall()

    tables = [list(d.values())[0] for d in db_res]

    return tables

def move_old_tables(client):
    # 搜集所有表
    tables = _get_all_tables(client)

    # 检查是否已经迁移过
    for t in tables:
        if t.startswith(MIGRATED_TABLE_PREFIX):
            print(colored('This database seems already migrated to 1.x, migrating to same version twice may break the database data!!', 'red'))
            sys.exit(1)

    # 重命名旧表
    tables         = list(filter(lambda x: not x.startswith(TABLE_MIGRATE_PREFIX), tables))
    table_name_len = list(map(lambda x: len(x), tables))
    print_offset   = max(table_name_len)

    for t in tables:
        next_table = '{}__{}'.format(MIGRATED_TABLE_PREFIX, t)

        sql = '''
            RENAME TABLE `{}` TO `{}`
            '''.format(t, next_table)
        client.execute(sql)

        spaces = ' ' * (print_offset - len(t))
        print('Moved table: `{}` {}-> `{}`'.format(t, spaces, colored(next_table, 'yellow')))

def import_new_ddl(client):
    with open('dataflux_func_latest.sql', 'r') as _f:
        sql_list = _f.read().split(';\n')[:-1]

        for sql in sql_list:
            client.execute(sql)

        print('Imported new DDL.')

    # 清空所有表
    tables = _get_all_tables(client)
    tables = filter(lambda x: not x.lower().startswith(TABLE_MIGRATE_PREFIX.lower()), tables)

    for t in tables:
        sql = '''
            TRUNCATE TABLE {}
            '''.format(t)
        client.execute(sql)

def _get_id_map(client):
    id_map = {
        'scriptSet': {},
        'script'   : {},
        'func'     : {},
    }

    # 脚本集
    sql = '''
        SELECT
             id
            ,refName
        FROM {}__biz_main_script_set
        '''.format(MIGRATED_TABLE_PREFIX) #nosec
    client.execute(sql)
    db_res = client.fetchall()
    for d in db_res:
        ref_name = d['refName']
        id_map['scriptSet'][d['id']] = DATAFLUX_SCRIPT_SET_REF_NAME_MAP.get(ref_name) or ref_name

    # 脚本
    sql = '''
        SELECT
             scpt.id
            ,scpt.refName AS scpt_refName
            ,sset.refName AS sset_refName
        FROM {}__biz_main_script AS scpt
        JOIN {}__biz_main_script_set AS sset
            ON scpt.scriptSetId = sset.id
        '''.format(MIGRATED_TABLE_PREFIX, MIGRATED_TABLE_PREFIX) #nosec
    client.execute(sql)
    db_res = client.fetchall()
    for d in db_res:
        sset_ref_name = d['sset_refName']
        scpt_ref_name = d['scpt_refName']

        if sset_ref_name in DATAFLUX_SCRIPT_SET_REF_NAME_MAP:
            sset_ref_name = DATAFLUX_SCRIPT_SET_REF_NAME_MAP.get(sset_ref_name) or sset_ref_name
            scpt_ref_name = DATAFLUX_SCRIPT_REF_NAME_MAP.get(scpt_ref_name)     or scpt_ref_name

        id_map['script'][d['id']] = '{}__{}'.format(sset_ref_name, scpt_ref_name)

    # 函数
    sql = '''
        SELECT
             func.id
            ,func.refName AS func_refName
            ,scpt.refName AS scpt_refName
            ,sset.refName AS sset_refName
        FROM {}__biz_main_func AS func
        JOIN {}__biz_main_script AS scpt
            ON func.scriptId = scpt.id
        JOIN {}__biz_main_script_set AS sset
            ON func.scriptSetId = sset.id
        '''.format(MIGRATED_TABLE_PREFIX, MIGRATED_TABLE_PREFIX, MIGRATED_TABLE_PREFIX) #nosec
    client.execute(sql)
    db_res = client.fetchall()
    for d in db_res:
        sset_ref_name = d['sset_refName']
        scpt_ref_name = d['scpt_refName']
        func_ref_name = d['func_refName']

        if sset_ref_name in DATAFLUX_SCRIPT_SET_REF_NAME_MAP:
            sset_ref_name = DATAFLUX_SCRIPT_SET_REF_NAME_MAP.get(sset_ref_name) or sset_ref_name
            scpt_ref_name = DATAFLUX_SCRIPT_REF_NAME_MAP.get(scpt_ref_name)     or scpt_ref_name
            func_ref_name = DATAFLUX_FUNC_NAME_MAP.get(func_ref_name)           or func_ref_name

        id_map['func'][d['id']] = '{}__{}.{}'.format(sset_ref_name, scpt_ref_name, func_ref_name)

    return id_map

def _migrate_table(client, id_map, table, field_map):
    # 先SELECT INTO
    # 后循环UPDATE旧ID为新ID

    print('Migrating table {}'.format(table))

    # 整理字段
    from_fields = []
    to_fields   = []
    id_types    = []
    for k, v in field_map.items():
        from_fields.append(k)
        to_fields.append(v)

        if v == 'scriptSetId':
            id_types.append('scriptSet')
        elif v == 'scriptId':
            id_types.append('script')
        elif v == 'funcId':
            id_types.append('func')

    from_fields.extend(['createTime', 'updateTime'])
    to_fields.extend(['createTime', 'updateTime'])
    id_types = set(id_types)

    # 数据导入新表
    sql = '''
        INSERT INTO {} ({})
        SELECT
            {}
        FROM {}__{}
        '''.format(table, ','.join(to_fields), ','.join(from_fields), MIGRATED_TABLE_PREFIX, table) #nosec
    client.execute(sql)

    # 更新新版ID
    for id_type in id_types:
        id_field = id_type + 'Id'
        for old_id, new_id in id_map[id_type].items():
            sql = '''
                UPDATE {}
                SET
                    {} = %s
                WHERE
                    {} = %s
                '''.format(table, id_field, id_field) #nosec
            sql_params = [new_id, old_id]
            client.execute(sql, sql_params)

    # 关键表更新新版ID
    if table == 'biz_main_script_set':
        for old_id, new_id in id_map['scriptSet'].items():
            sql = '''
                UPDATE biz_main_script_set
                SET
                    id = %s
                WHERE
                    id = %s
                '''
            sql_params = [new_id, old_id]
            client.execute(sql, sql_params)

    elif table == 'biz_main_script':
        for old_id, new_id in id_map['script'].items():
            sql = '''
                UPDATE biz_main_script
                SET
                    id = %s
                WHERE
                    id = %s
                '''
            sql_params = [new_id, old_id]
            client.execute(sql, sql_params)

    elif table == 'biz_main_func':
        for old_id, new_id in id_map['func'].items():
            sql = '''
                UPDATE biz_main_func
                SET
                    id = %s
                WHERE
                    id = %s
                '''
            sql_params = [new_id, old_id]
            client.execute(sql, sql_params)

def migrate_tables(client):
    id_map = _get_id_map(client)

    # 迁移 biz_main_auth_link
    _migrate_table(client, id_map, 'biz_main_auth_link', {
        'id'            : 'id',
        'funcId'        : 'funcId',
        'funcKwargsJSON': 'funcCallKwargsJSON',
        'expireTime'    : 'expireTime',
        'throttlingJSON': 'throttlingJSON',
        'origin'        : 'origin',
        'showInDoc'     : 'showInDoc',
        'isDisabled'    : 'isDisabled',
        'note'          : 'note',
    })

    # 不迁移 biz_main_batch_task_info
    print(colored('Skip table {}'.format('biz_main_batch_task_info'), 'yellow'))

    # 迁移 biz_main_batch
    _migrate_table(client, id_map, 'biz_main_batch', {
        'id'            : 'id',
        'funcId'        : 'funcId',
        'funcKwargsJSON': 'funcCallKwargsJSON',
        'tagsJSON'      : 'tagsJSON',
        'origin'        : 'origin',
        'showInDoc'     : 'showInDoc',
        'isDisabled'    : 'isDisabled',
        'note'          : 'note',
    })

    # 迁移 biz_main_crontab_config
    _migrate_table(client, id_map, 'biz_main_crontab_config', {
        'id'            : 'id',
        'funcId'        : 'funcId',
        'funcKwargsJSON': 'funcCallKwargsJSON',
        'crontab'       : 'crontab',
        'tagsJSON'      : 'tagsJSON',
        'saveResult'    : 'saveResult',
        'scope'         : 'scope',
        'configHash'    : 'configMD5',
        'expireTime'    : 'expireTime',
        'origin'        : 'origin',
        'isDisabled'    : 'isDisabled',
        'note'          : 'note',
    })

    # 不迁移 biz_main_crontab_task_info
    print(colored('Skip table {}'.format('biz_main_crontab_task_info'), 'yellow'))

    # 迁移 biz_main_data_source
    _migrate_table(client, id_map, 'biz_main_data_source', {
        'refName'    : 'id',
        'title'      : 'title',
        'description': 'description',
        'type'       : 'type',
        'configJSON' : 'configJSON',
        'isBuiltin'  : 'isBuiltin',
    })

    # 迁移 biz_main_env_variable
    _migrate_table(client, id_map, 'biz_main_env_variable', {
        'refName'    : 'id',
        'title'      : 'title',
        'description': 'description',
        'valueTEXT'  : 'valueTEXT',
    })

    # 不迁移 biz_main_func_store
    print(colored('Skip table {}'.format('biz_main_func_store'), 'yellow'))

    # 迁移 biz_main_func
    _migrate_table(client, id_map, 'biz_main_func', {
        'id'             : 'id',
        'scriptSetId'    : 'scriptSetId',
        'scriptId'       : 'scriptId',
        'refName'        : 'name',
        'title'          : 'title',
        'description'    : 'description',
        'definition'     : 'definition',
        'argsJSON'       : 'argsJSON',
        'kwargsJSON'     : 'kwargsJSON',
        'extraConfigJSON': 'extraConfigJSON',
        'category'       : 'category',
        'tagsJSON'       : 'tagsJSON',
        'defOrder'       : 'defOrder',
    })

    # 不迁移 biz_main_operation_record
    print(colored('Skip table {}'.format('biz_main_operation_record'), 'yellow'))

    # 不迁移 biz_main_script_failure
    print(colored('Skip table {}'.format('biz_main_script_failure'), 'yellow'))

    # 不迁移 biz_main_script_log
    print(colored('Skip table {}'.format('biz_main_script_log'), 'yellow'))

    # 迁移 biz_main_script_publish_history
    _migrate_table(client, id_map, 'biz_main_script_publish_history', {
        'id'                  : 'id',
        'scriptId'            : 'scriptId',
        'scriptPublishVersion': 'scriptPublishVersion',
        'scriptCode_cache'    : 'scriptCode_cache',
        'note'                : 'note',
    })

    # 迁移 biz_main_script_recover_point
    _migrate_table(client, id_map, 'biz_main_script_recover_point', {
        'id'           : 'id',
        'type'         : 'type',
        'tableDumpJSON': 'tableDumpJSON',
        'note'         : 'note',
    })

    # 迁移 biz_main_script_set_export_history
    _migrate_table(client, id_map, 'biz_main_script_set_export_history', {
        'id'           : 'id',
        'operationNote': 'note',
        'summaryJSON'  : 'summaryJSON',
    })

    # 迁移 biz_main_script_set_import_history
    _migrate_table(client, id_map, 'biz_main_script_set_import_history', {
        'id'           : 'id',
        'operationNote': 'note',
        'summaryJSON'  : 'summaryJSON',
    })

    # 迁移 biz_main_script_set
    _migrate_table(client, id_map, 'biz_main_script_set', {
        'id'         : 'id',
        'title'      : 'title',
        'description': 'description',
    })

    # 迁移 biz_main_script
    _migrate_table(client, id_map, 'biz_main_script', {
        'id'            : 'id',
        'scriptSetId'   : 'scriptSetId',
        'title'         : 'title',
        'description'   : 'description',
        'publishVersion': 'publishVersion',
        'type'          : 'type',
        'code'          : 'code',
        'codeMD5'       : 'codeMD5',
        'codeDraft'     : 'codeDraft',
        'codeDraftMD5'  : 'codeDraftMD5',
    })

    # 不迁移 biz_main_task_result_dataflux_func
    print(colored('Skip table {}'.format('biz_main_task_result_dataflux_func'), 'yellow'))

    # 不迁移 biz_rel_func_running_info
    print(colored('Skip table {}'.format('biz_rel_func_running_info'), 'yellow'))

    # 迁移 wat_main_access_key
    _migrate_table(client, id_map, 'wat_main_access_key', {
        'id'              : 'id',
        'userId'          : 'userId',
        'name'            : 'name',
        'secret'          : 'secret',
        'webhookURL'      : 'webhookURL',
        'webhookEvents'   : 'webhookEvents',
        'allowWebhookEcho': 'allowWebhookEcho',
    })

    # 迁移 wat_main_system_config
    _migrate_table(client, id_map, 'wat_main_system_config', {
        'id'   : 'id',
        'value': 'value',
    })

    # 不迁移 wat_main_task_result_example
    print(colored('Skip table {}'.format('wat_main_task_result_example'), 'yellow'))

    # 迁移 wat_main_user
    _migrate_table(client, id_map, 'wat_main_user', {
        'id'              : 'id',
        'username'        : 'username',
        'passwordHash'    : 'passwordHash',
        'name'            : 'name',
        'mobile'          : 'mobile',
        'markers'         : 'markers',
        'roles'           : 'roles',
        'customPrivileges': 'customPrivileges',
        'isDisabled'      : 'isDisabled',
    })

def _convert_actions(actions):
    if not actions:
        return actions

    for a in actions:
        if a.get('type') != 'DataFluxFunc':
            continue

        if not all([a.get('scriptSetRefName'), a.get('scriptRefName'), a.get('funcRefName')]):
            continue

        sset_ref_name = a['scriptSetRefName']
        scpt_ref_name = a['scriptRefName']
        func_ref_name = a['funcRefName']

        if sset_ref_name in DATAFLUX_SCRIPT_SET_REF_NAME_MAP:
            sset_ref_name = DATAFLUX_SCRIPT_SET_REF_NAME_MAP.get(sset_ref_name) or sset_ref_name
            scpt_ref_name = DATAFLUX_SCRIPT_REF_NAME_MAP.get(scpt_ref_name)     or scpt_ref_name
            func_ref_name = DATAFLUX_FUNC_NAME_MAP.get(func_ref_name)           or func_ref_name

        a['funcId'] = '{}__{}.{}'.format(sset_ref_name, scpt_ref_name, func_ref_name)
        a.pop('scriptSetRefName', None)
        a.pop('scriptRefName', None)
        a.pop('funcRefName', None)

    return actions

def migrate_action_func(client):
    page_index = 0
    page_size  = 100
    while True:
        print('\tMigrating page #{}'.format(page_index + 1))
        sql = '''
            SELECT
                 id
                ,funcCallKwargsJSON
            FROM biz_main_crontab_config
            WHERE
                funcCallKwargsJSON LIKE '%%funcRefName%%'
            LIMIT %s
            '''
        sql_params = [page_size]
        client.execute(sql, sql_params)
        db_res = client.fetchall()

        if not db_res:
            break
        else:
            page_index += 1

        for d in db_res:
            data_id               = d['id']
            func_call_kwargs_json = d['funcCallKwargsJSON']
            if not func_call_kwargs_json:
                continue

            func_call_kwargs = json.loads(func_call_kwargs_json)

            is_updated = False

            # 无数据检测配置
            try:
                actions = func_call_kwargs['no_data_check_setting']['actions']
            except:
                pass
            else:
                _convert_actions(actions)
                is_updated = True

            # 条件检测数据
            try:
                actions = func_call_kwargs['condition_check_setting']['actions']
            except:
                pass
            else:
                _convert_actions(actions)
                is_updated = True

            next_func_call_kwargs_json = json.dumps(func_call_kwargs, ensure_ascii=False)
            sql = '''
                UPDATE biz_main_crontab_config
                SET
                    funcCallKwargsJSON = %s
                WHERE
                    id = %s
                '''
            sql_params = [next_func_call_kwargs_json, data_id]
            client.execute(sql, sql_params)

            print('\t\tMigrating data ID={}'.format(data_id))

def main(options):
    host     = options.get('host') or 'localhost'
    port     = options.get('port') or 3306
    user     = options.get('user') or 'root'
    password = options.get('password') or ''
    database = options.get('database') or 'func'

    # 初始化客户端
    client_configs = {
        'host'  : host,
        'port'  : port,
        'user'  : user,
        'passwd': password,
        'db'    : database,
    }
    conn = get_client(client_configs)
    cur = conn.cursor()

    # 执行迁移
    try:
        print(colored('[STAGE] Move old tables', 'green'))
        move_old_tables(cur)
        print()

        print(colored('[STAGE] Import new DDL', 'green'))
        import_new_ddl(cur)
        print()

        print(colored('[STAGE] Migrate tables', 'green'))
        migrate_tables(cur)
        print()

        print(colored('[STAGE] Migrate action func', 'green'))
        migrate_action_func(cur)
        print()

    except Exception as e:
        if conn:
            conn.rollback()

        raise

    else:
        conn.commit()

    finally:
        if cur:
            cur.close()

        if conn:
            conn.close()

def get_options_by_command_line():
    arg_parser = argparse.ArgumentParser(description='DataFlux Func Migrate from `FTDataProcessor` to `DataFlux Func`')

    arg_parser.add_argument('-H', '--host', dest='host', metavar='<Host>')
    arg_parser.add_argument('-P', '--port', dest='port', metavar='<Port>', type=int)
    arg_parser.add_argument('-u', '--user', dest='user', metavar='<User>')
    arg_parser.add_argument('-p', '--password', dest='password', metavar='<Password>')
    arg_parser.add_argument('-d', '--database', dest='database', metavar='<Database>')

    args = vars(arg_parser.parse_args())
    args = dict(filter(lambda x: x[1] is not None, args.items()))

    return args

if __name__ == '__main__':
    # Pre-Check
    if MySQLdb.version_info[0] != 1:
        print(colored('This migrate script requires mysqlclient==1.x, use following command to install: \n  pip install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/ mysqlclient==1.4.6', 'red'))
        sys.exit(1)

    options = get_options_by_command_line()

    main(options)

    print(colored('Done', 'green'))
