#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Built-in Modules
import os
import sys
import textwrap
import getpass
import logging
import argparse
import traceback

# 3rd-party Modules
import requests

# Project Modules
from worker.utils import yaml_resources, toolkit

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
CONFIG    = yaml_resources.load_config(os.path.join(BASE_PATH, './config.yaml'))

from worker.utils.extra_helpers import MySQLHelper, RedisHelper
DB       = MySQLHelper(logging)
CACHE_DB = RedisHelper(logging)

ADMIN_USER_ID     = 'u-admin'
DB_UPGRADE_SEQ_ID = 'UPGRADE_DB_SEQ'

COMMAND_FUNCS = {}

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

class CommandCanceled(Exception):
    pass

def command(F):
    COMMAND_FUNCS[F.__name__] = F
    return F

def confirm(force=False):
    if force:
        return

    # 确认
    user_input = input('Are you sure you want to do this? (yes/no): ')
    if user_input != 'yes':
        raise CommandCanceled()

def reset_db_data(table, data):
    try:
        trans_conn = DB.start_trans()

        # 查询数据
        sql = '''SELECT id FROM ?? WHERE id = ?'''
        sql_params = [ table, data['id'] ]
        db_res = DB.trans_query(trans_conn, sql, sql_params)
        if db_res:
            # 存在则更新
            sql = '''UPDATE ?? SET ? WHERE id = ?'''
            sql_params = [ table, data, data['id'] ]
            DB.trans_non_query(trans_conn, sql, sql_params)

        else:
            # 不存在则创建新数据
            sql = '''INSERT INTO ?? SET ?'''
            sql_params = [ table, data ]
            DB.trans_non_query(trans_conn, sql, sql_params)

    except Exception as e:
        for line in traceback.format_exc().splitlines():
            logging.error(line)

        DB.rollback(trans_conn)

        raise

    else:
        DB.commit(trans_conn)

def run_db_sql(sql):
    try:
        trans_conn = DB.start_trans()

        # 执行 SQL
        db_res = DB.trans_query(trans_conn, sql)

    except Exception as e:
        for line in traceback.format_exc().splitlines():
            logging.error(line)

        DB.rollback(trans_conn)

        raise

    else:
        DB.commit(trans_conn)

@command
def reset_admin(options):
    '''
    重置管理员账号
    '''
    # 等待用户输入数据
    username        = options.get('admin_username') or input('Enter new Admin username: ')
    password        = options.get('admin_password') or getpass.getpass(f'Enter new password for [{username}]: ')
    password_repeat = options.get('admin_password') or getpass.getpass('Confirm new password: ')

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
    confirm(options.get('force'))

    # 数据入库
    reset_db_data('wat_main_user', data)

@command
def reset_upgrade_db_seq(options):
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
    confirm(options.get('force'))

    # 数据入库
    reset_db_data('wat_main_system_setting', data)

@command
def clear_redis(options):
    '''
    清空Redis
    '''
    # 确认提示
    confirm(options.get('force'))

    # 清空数据库
    CACHE_DB.client.flushdb()

@command
def run_sql(options):
    '''
    执行 SQL
    '''
    # 等待用户输入数据
    filepath = input('Enter SQL file path or URL: ')

    # 获取 SQL 文件
    sql = None

    if filepath.startswith('http://') or filepath.startswith('https://'):
        resp = requests.get(filepath)
        resp.raise_for_status()
        sql = resp.text

    else:
        with open(filepath, 'r') as f:
            sql = f.read()

    # 数据入库
    run_db_sql(sql)

def main(options):
    if not CONFIG.get('_IS_INSTALLED') and not CONFIG.get('_DISABLE_SETUP'):
        raise Exception(f"This DataFlux Func is not installed yet, please complete the installation first.\n Default URL is http(s)://<Domain or IP>:{CONFIG.get('WEB_PORT')}/")

    command = options.get('command')
    command_func = COMMAND_FUNCS.get(command)

    if not command_func:
        raise Exception(f"No such command: {command}\n Command should be one of {', '.join(COMMAND_FUNCS.keys())}")

    command_func(options)

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
                $ docker exec -it {DataFlux Func Container ID} sh -c 'exec python admin-tool.py reset_admin [-f] [--admin-username=<Admin Username>] [--admin-password=<Password>]'
                $ docker exec -it {DataFlux Func Container ID} sh -c 'exec python admin-tool.py reset_upgrade_db_seq'
                $ docker exec -it {DataFlux Func Container ID} sh -c 'exec python admin-tool.py clear_redis'
                $ docker exec -it {DataFlux Func Container ID} sh -c 'exec python admin-tool.py run_sql'
        '''))

    # 执行操作
    arg_parser.add_argument('command', metavar='<Command>', help=', '.join(COMMAND_FUNCS.keys()))

    # 免确认
    arg_parser.add_argument('-f', '--force', action='store_true', help='Force run, no confirm')

    # 重置密码
    arg_parser.add_argument('--admin-username', dest='admin_username', help='Admin Username')
    arg_parser.add_argument('--admin-password', dest='admin_password', help='Admin Password')

    args = vars(arg_parser.parse_args())
    args = dict(filter(lambda x: x[1] is not None, args.items()))

    return args

if __name__ == '__main__':
    options = get_options_by_command_line()

    try:
        main(options)

    except (KeyboardInterrupt, CommandCanceled) as e:
        print(colored('Canceled', 'yellow'))

    except Exception as e:
        print(colored(str(e), 'red'))

    else:
        print(colored('Done', 'green'))
