# -*- coding: utf-8 -*-

# Builtin Modules
import sys
import getpass
import logging
import traceback

# Project Modules
from worker.utils import yaml_resources, toolkit
from worker.utils.extra_helpers import MySQLHelper

CONFIG = yaml_resources.get('CONFIG')
DB = MySQLHelper(logging)

ADMIN_USER_ID = 'u-admin'

def _get_password_hash(salt, password, secret):
    str_to_hash = '~{}~{}~{}~'.format(salt, password, secret)
    return toolkit.get_sha512(str_to_hash)

def _create_admin_data(username, password):
    password_hash = _get_password_hash(ADMIN_USER_ID, password, CONFIG['SECRET'])
    data = {
        'id'              : ADMIN_USER_ID,
        'username'        : username,
        'passwordHash'    : password_hash,
        'name'            : '系统管理员',
        'roles'           : 'sa',
        'customPrivileges': '*',
        'isDisabled'      : False,
    }
    return data

def update_admin(username, password):
    admin_data = _create_admin_data(username, password)

    try:
        trans_conn = DB.start_trans()

        # 删除旧Admin用户
        sql = '''
            DELETE FROM wat_main_user
            WHERE
                id = ?
            '''
        sql_params = [ADMIN_USER_ID]
        DB.trans_non_query(trans_conn, sql, sql_params)

        # 创建新Admin用户

        sql = '''
            INSERT INTO wat_main_user
            SET ?
        '''
        sql_params = [admin_data]
        DB.trans_non_query(trans_conn, sql, sql_params)

    except Exception as e:
        for line in traceback.format_exc().splitlines():
            logging.error(line)

        DB.rollback(trans_conn)
        sys.exit(1)

    else:
        DB.commit(trans_conn)

def main():
    username = None
    password = None

    try:
        username = input('Please enter new Admin username: ')
        password = getpass.getpass('Please enter new Admin password: ')
    except KeyboardInterrupt as e:
        pass

    if not all([username, password]):
        print('\nAborted.')
        sys.exit(1)

    update_admin(username, password)

    print('Done')

if __name__ == '__main__':
    main()
