# -*- coding: utf-8 -*-

# Builtin Modules

# 3rd-party Modules
import paho.mqtt.client as mqtt

# Project Modules
from worker.utils import yaml_resources, toolkit
from worker.utils.log_helper import LogHelper

CONFIG = yaml_resources.get('CONFIG')

def get_config(c):
    config = {
        'client_id': c.get('clientId'),
        'protocol' : mqtt.MQTTv5,
        'transport': c.get('transport') or 'tcp',
    }
    return config

def get_auth_config(c):
    config = {
        'username': c.get('username'),
        'password': c.get('password'),
    }
    return config

def get_connect_config(c):
    config = {
        'host'     : c.get('host')      or '127.0.0.1',
        'port'     : c.get('port')      or 1883,
        'keepalive': c.get('keepalive') or 60,
    }
    return config

CLIENT_CONFIG = None
CLIENT        = None

class MQTTHelper(object):
    def __init__(self, logger, config=None, *args, **kwargs):
        self.logger = logger

        if config:
            self.config = config
            self.client = mqtt.Client(**get_config(config))
            self.client.username_pw_set(**get_auth_config(config))
            self.client.connect(**get_connect_config(config))

        else:
            global CLIENT_CONFIG
            global CLIENT

            if not CLIENT:
                CLIENT_CONFIG = {
                    'host'    : CONFIG['MQTT_HOST'],
                    'port'    : CONFIG['MQTT_PORT'],
                    'username': CONFIG['MQTT_USERNAME'],
                    'password': CONFIG['MQTT_PASSWORD'],
                    'clientId': CONFIG['APP_NAME'] + '@worker-' + str(toolkit.gen_time_serial_seq())
                }
                CLIENT = mqtt.Client(**get_config(CLIENT_CONFIG))
                CLIENT.username_pw_set(**get_auth_config(CLIENT_CONFIG))
                CLIENT.connect(**get_connect_config(CLIENT_CONFIG))

            self.config = CLIENT_CONFIG
            self.client = CLIENT

    def __del__(self):
        if self.client and self.client is not CLIENT:
            self.client.disconnect()

    def check(self):
        try:
            self.publish(topic='test', message='test')

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise Exception(str(e))

    def publish(self, topic, message, qos=0, retain=False):
        return self.client.publish(topic=topic, payload=message, qos=qos, retain=retain)
