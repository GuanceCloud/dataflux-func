# -*- coding: utf-8 -*-

# Built-in Modules
import traceback

# 3rd-party Modules

# Project Modules
from worker.utils import yaml_resources, toolkit

CONFIG = yaml_resources.get('CONFIG')

def get_config(c):
    import paho.mqtt.client as mqtt
    config = {
        'client_id': c.get('clientId') or f"{CONFIG['APP_NAME']}@{toolkit.gen_time_serial_seq()}",
        'protocol' : mqtt.MQTTv5,
        'transport': c.get('transport') or 'tcp',
    }
    return config

def get_auth_config(c):
    config = {
        'username': c.get('user') or c.get('username'),
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

class MQTTHelper(object):
    def __init__(self, logger, config=None, *args, **kwargs):
        import paho.mqtt.client as mqtt

        self.logger = logger

        self.config = config
        self.client = mqtt.Client(**get_config(config))
        self.client.username_pw_set(**get_auth_config(config))
        self.client.reconnect_delay_set(min_delay=1, max_delay=3)
        self.client.connect(**get_connect_config(config))

    def __del__(self):
        if not self.client:
            return

        try:
            self.client.disconnect()
            self.client = None

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

    def publish(self, topic, message, qos=0, retain=False):
        rc        = None
        error_str = None

        for i in range(3):
            self.client.loop(timeout=0)
            rc, _ = self.client.publish(topic=topic, payload=message, qos=qos, retain=retain)
            if rc == 0:
                break

            self.logger.warning('[MQTT] Reconnect...')
            self.client.reconnect()

        else:
            raise Exception(error_str)
