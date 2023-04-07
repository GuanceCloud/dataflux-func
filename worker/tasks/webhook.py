# -*- coding: utf-8 -*-

# Built-in Modules
import json
import time
import traceback

try:
    import httplib
    from urllib import urlencode
    from urlparse import urlparse
except ImportError:
    import http.client as httplib
    from urllib.parse import urlparse, urlencode

# Project Modules
from worker import app
from worker.tasks import gen_task_id, BaseTask
from worker.utils import yaml_resources, toolkit
from sdk.dataflux_func import DataFluxFunc

CONFIG = yaml_resources.get('CONFIG')

@app.task(name='Webhook.OnEvent', bind=True, base=BaseTask)
def on_event(self, *args, **kwargs):
    self.logger.info('Webhook onEvent Task started.')

    ak_id   = kwargs.get('akId')
    event   = kwargs.get('event')
    options = kwargs.get('options') or {}
    is_echo = False

    task_headers = {
        'origin': self.request.id,
    }

    # Get all access keys and webhooks
    sql = '''
        SELECT
           `seq`
          ,`id`
          ,`name`
          ,`secret`
          ,`webhookURL`
          ,`webhookEvents`
          ,`allowWebhookEcho`
        FROM `wat_main_access_key`
    '''
    access_keys = self.db.query(sql)

    # Filter targets
    targets = []
    for ak in access_keys:
        # Skip non-webhook AK
        if not ak.get('webhookURL'):
            continue

        # Skip non-subscribed events
        webhook_events = ak.get('webhookEvents')
        if webhook_events:
            webhook_events = webhook_events.split(',')

            if not toolkit.match_wildcards(event, webhook_events):
                continue

        # Skip echo
        if ak.get('id') == ak_id:
            is_echo = True

            if not ak.get('allowWebhookEcho'):
                continue

        else:
            is_echo = False

        targets.append({
            'akId'    : ak.get('id'),
            'akSecret': ak.get('secret'),
            'url'     : ak.get('webhookURL'),
            'isEcho'  : is_echo,
        })

    if len(targets):
        # Dispatch HTTP requests
        for t in targets:
            task_kwargs = {
                'target': t,
                'event' : event,
                'data'  : kwargs.get('data'),
                'from'  : kwargs.get('from') or {},
            }

            if ak_id:
                task_kwargs['from']['akId'] = ak_id

            do_http_request.apply_async(task_id=gen_task_id(), kwargs=task_kwargs, headers=task_headers)

@app.task(name='Webhook.DoHTTPRequest', bind=True, base=BaseTask,
        autoretry_for=(Exception,), retry_backoff=True, retry_backoff_max=3600, max_retries=3)
def do_http_request(self, *args, **kwargs):
    self.logger.info('Webhook doHTTPRequest Task started.')

    target = kwargs.get('target')

    parsed_url = urlparse(target.get('url'))
    dff = DataFluxFunc(
        ak_id=target.get('akId'),
        ak_secret=target.get('akSecret'),
        host=parsed_url.netloc)

    webhook_full_url = parsed_url.path
    if parsed_url.query:
        webhook_full_url += '?' + parsed_url.query

    webhook_body = {
        'isEcho': target.get('isEcho', False),
        'event' : kwargs.get('event'),
        'data'  : kwargs.get('data'),
        'from'  : kwargs.get('from'),
    }

    status_code, resp = dff.post(webhook_full_url, body=webhook_body)
    if status_code >= 400:
        e = Exception(resp)
        raise e

    return resp

