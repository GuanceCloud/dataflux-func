#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Builtin Modules
import sys
import textwrap
import getpass
import logging
import argparse
import traceback

# Project Modules
from worker.utils import yaml_resources, toolkit
from worker.utils.extra_helpers import MySQLHelper, RedisHelper

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

class CommandCanceledException(Exception):
    pass

CONFIG = yaml_resources.get('CONFIG')
DB       = MySQLHelper(logging)
CACHE_DB = RedisHelper(logging)

ADMIN_USER_ID     = 'u-admin'
DB_UPGRADE_SEQ_ID = 'upgrade.db.upgradeSeq'

COMMAND_FUNCS = {}

def command(F):
    COMMAND_FUNCS[F.__name__] = F
    return F

def confirm():
    # 确认
    confirm = input('Are you sure you want to do this? (yes/no): ')
    if confirm != 'yes':
        raise CommandCanceledException()

def reset_db_data(table, data):
    try:
        trans_conn = DB.start_trans()

        # 删除数据
        sql = '''
            DELETE FROM ??
            WHERE
                id = ?
            '''
        sql_params = [
            table,
            data['id'],
        ]
        DB.trans_non_query(trans_conn, sql, sql_params)

        # 创建新数据
        sql = '''
            INSERT INTO ??
            SET ?
        '''
        sql_params = [
            table,
            data,
        ]
        DB.trans_non_query(trans_conn, sql, sql_params)

    except Exception as e:
        for line in traceback.format_exc().splitlines():
            logging.error(line)

        DB.rollback(trans_conn)

        raise

    else:
        DB.commit(trans_conn)

@command
def reset_admin():
    '''
    重置管理员账号
    '''
    # 等待用户输入数据
    username        = input('Enter new Admin username: ')
    password        = getpass.getpass('New password: ')
    password_repeat = getpass.getpass('Confirm new password: ')

    if password != password_repeat:
        # 两次输入不一致
        raise Exception('Repeated password not match')

    if not all([username, password]):
        # 存在空内容
        raise Exception('Username or password not inputed.')

    # 生成新的admin用户数据
    str_to_hash = '~{}~{}~{}~'.format(ADMIN_USER_ID, password, CONFIG['SECRET'])
    password_hash = toolkit.get_sha512(str_to_hash)
    data = {
        'id'              : ADMIN_USER_ID,
        'username'        : username,
        'passwordHash'    : password_hash,
        'name'            : '系统管理员',
        'roles'           : 'sa',
        'customPrivileges': '*',
        'isDisabled'      : False,
    }

    # 确认提示
    confirm()

    # 数据入库
    reset_db_data('wat_main_user', data)

@command
def reset_db_upgrade_seq():
    '''
    重置数据库升级序号
    '''
    # 等待用户输入数据
    db_upgrade_seq = input('Enter new DB upgrade SEQ: ')

    # 生成新的数据库升级序号数据
    data = {
        'id'   : DB_UPGRADE_SEQ_ID,
        'value': db_upgrade_seq,
    }

    # 确认提示
    confirm()

    # 数据入库
    reset_db_data('wat_main_system_config', data)

@command
def clear_redis():
    '''
    清空Redis
    '''
    # 确认提示
    confirm()

    # 清空数据库
    CACHE_DB.client.flushdb()

def main(options):
    command = options.get('command')
    command_func = COMMAND_FUNCS.get(command)

    if not command_func:
        raise Exception('No such command: {0}\n Command should be one of {1}'.format(
                command,
                ', '.join(COMMAND_FUNCS.keys())
            ))

    command_func()

def get_options_by_command_line():
    arg_parser = argparse.ArgumentParser(
        prog='admin-tool.py',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        description=textwrap.dedent('''
            +--------------------------+
            | DataFlux Func Admin Tool |
            +--------------------------+
            This tool should run in the Docker container:
                $ docker exec {DataFlux Func Container ID} sh -c 'exec python admin-tool.py --help'
                $ docker exec -it {DataFlux Func Container ID} sh -c 'exec python admin-tool.py reset_admin'
                $ docker exec -it {DataFlux Func Container ID} sh -c 'exec python admin-tool.py reset_db_upgrade_seq'
                $ docker exec -it {DataFlux Func Container ID} sh -c 'exec python admin-tool.py clear_redis'
        '''))

    # 执行操作
    arg_parser.add_argument('command', metavar='<Command>', help=', '.join(COMMAND_FUNCS.keys()))

    args = vars(arg_parser.parse_args())
    args = dict(filter(lambda x: x[1] is not None, args.items()))

    return args

if __name__ == '__main__':
    options = get_options_by_command_line()

    try:
        main(options)

    except (KeyboardInterrupt, CommandCanceledException) as e:
        print(colored('Canceled', 'yellow'))

    except Exception as e:
        print(colored(str(e), 'red'))

    else:
        print(colored('Done', 'green'))
