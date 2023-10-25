# -*- coding: utf-8 -*-

# Built-in Modules
import traceback

# 3rd-party Modules

# Project Modules

def get_config(c):
    host     = c.get('host')     or '127.0.0.1'
    port     = c.get('port')     or 27017
    database = c.get('database') or ''
    uri = 'mongodb://{}:{}/{}'.format(host, port, database)

    config = {
        'host'    : uri,
        'username': c.get('username') or c.get('user'),
        'password': c.get('password'),
    }
    return config

class MongoDBHelper(object):
    def __init__(self, logger, config, database=None, *args, **kwargs):
        import pymongo

        self.logger = logger

        if database:
            config['database'] = database

        self.config = config
        self.client = pymongo.MongoClient(**get_config(config))

    def __del__(self):
        if not self.client:
            return

        try:
            self.client.close()

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

        finally:
            self.client = None

    def check(self):
        try:
            self.client.list_database_names()

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise

    def run_method(self, method, **kwargs):
        if method == 'list_database_names':
            return self.client.list_database_names()

        elif method == 'list_collection_names':
            db = None

            db_name = kwargs.get('db_name')
            if db_name:
                db = self.client[db_name]
            else:
                db = self.client.get_default_database()

            return db.list_collection_names()

    def db(self, db_name=None):
        if db_name:
            return self.client[db_name]
        else:
            return self.client.get_default_database()
