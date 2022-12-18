# -*- coding: utf-8 -*-

# Built-in Modules
import traceback

# 3rd-party Modules
import six

# Project Modules
from worker.utils import yaml_resources, toolkit

CONFIG = yaml_resources.get('CONFIG')

def get_config(c):
    servers = c.get('servers') or None
    if servers and isinstance(servers, str):
        servers = servers.split(',')

    servers = servers or '127.0.0.1:9092'
    servers = toolkit.as_array(servers)

    config = {
        'bootstrap_servers': servers,
        'client_id'        : c.get('groupId') or f"{CONFIG['APP_NAME']}@{toolkit.gen_time_serial_seq()}",
    }

    if c.get('securityProtocol'):
        config['security_protocol'] = (c.get('securityProtocol') or 'SASL_PLAINTEXT').upper()

    if c.get('password'):
        config['sasl_mechanism']      = (c.get('saslMechanism') or 'PLAIN').upper()
        config['sasl_plain_username'] = c.get('user') or c.get('username')
        config['sasl_plain_password'] = c.get('password')

    return config

class KafkaHelper(object):
    def __init__(self, logger, config=None, *args, **kwargs):
        from kafka3 import KafkaProducer

        self.logger = logger

        self.config = config

        self.producer = KafkaProducer(**get_config(config))

    def __del__(self):
        if not self.producer:
            return

        try:
            self.producer.close(3)
            self.producer = None

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

    def check(self):
        try:
            self.publish(topic='test', message='This is a test message')

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise Exception(str(e))

    def publish(self, topic, message):
        try:
            message = six.ensure_binary(message)
            self.producer.send(topic=topic, value=message).get()

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise Exception(str(e))
