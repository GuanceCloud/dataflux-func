# -*- coding: utf-8 -*-

# Builtin Modules
import time

# 3rd-party Modules
import requests
import six

# Project Modules
from . import parse_response
from worker.utils import toolkit

class DingHelper(object):
    def __init__(self, webhook):
        self.webhook = webhook
        self.times = 0
        self.start_time = time.time()

    def client(self, data, timeout=3):
        self.times += 1
        if self.times % 20 == 0:
            if time.time() - self.start_time < 60:
                time.sleep(60)
            self.start_time = time.time()

        headers={'Content-Type': 'application/json; charset=utf-8'}
        data = toolkit.json_dumps(data)

        resp = requests.post(self.webhook, headers=headers, data=data, timeout=timeout)
        parsed_resp = parse_response(resp)

        if not isinstance(parsed_resp, dict) or parsed_resp.get('errcode') != 0:
            if isinstance(parsed_resp, (six.string_types, six.text_type)):
                parsed_resp = 'Error occured, response is an HTML page'

            raise Exception(parsed_resp)

        return resp.status_code, parsed_resp

    def send_text(self, text, is_at_all=False, at_mobiles=[]):
        data = {"msgtype": "text", "at": {}}
        if not toolkit.is_none_or_white_space(text):
            data["text"] = {"content": text}

        if is_at_all:
            data["at"]["isAtAll"] = is_at_all

        if at_mobiles:
            at_mobiles = toolkit.as_array(at_mobiles)
            data["at"]["atMobiles"] = at_mobiles

        return self.client(data)

    def send_link(self, title, text, message_url, pic_url=''):
        data = {"msgtype": "link", "link": {}}
        if not toolkit.is_none_or_white_space(title) and not toolkit.is_none_or_white_space(text) and not toolkit.is_none_or_white_space(message_url):
            data["link"]["text"]       = text
            data["link"]["title"]      = title
            data["link"]["picUrl"]     = pic_url
            data["link"]["messageUrl"] = message_url

        return self.client(data)

    def send_markdown(self, title, text, is_at_all=False, at_mobiles=[]):
        data = {"msgtype": "markdown", "markdown": {}, "at": {}}
        if not toolkit.is_none_or_white_space(title) and not toolkit.is_none_or_white_space(text):
            data['markdown']['title'] = title
            data['markdown']['text']  = text

        if is_at_all:
            data["at"]["isAtAll"] = is_at_all

        if at_mobiles:
            at_mobiles = toolkit.as_array(at_mobiles)
            data["at"]["atMobiles"] = at_mobiles

        return self.client(data)

    def send_single_action_card(self, title, text, single_title, single_url, btn_orientation="0", hide_avatar="0"):
        data = {"msgtype": "actionCard", "actionCard": {}}
        if not toolkit.is_none_or_white_space(title) and not toolkit.is_none_or_white_space(text) and not toolkit.is_none_or_white_space(single_title) and not toolkit.is_none_or_white_space(single_url):
            data["actionCard"]["title"]          = title
            data["actionCard"]["text"]           = text
            data["actionCard"]["hideAvatar"]     = hide_avatar
            data["actionCard"]["btnOrientation"] = btn_orientation
            data["actionCard"]["singleTitle"]    = single_title
            data["actionCard"]["singleURL"]      = single_url

        return self.client(data)

    def send_btns_action_card(self, title, text, btns, btn_orientation="0", hide_avatar="0"):
        data = {"msgtype": "actionCard", "actionCard": {}}
        if not toolkit.is_none_or_white_space(title) and not toolkit.is_none_or_white_space(text) and not toolkit.is_none_or_white_space(btns):
            data["actionCard"]["title"]          = title
            data["actionCard"]["text"]           = text
            data["actionCard"]["hideAvatar"]     = hide_avatar
            data["actionCard"]["btnOrientation"] = btn_orientation
            data["actionCard"]["btns"]           = btns

        return self.client(data)

    def send_feed_card(self, feedCard):
        data = {"msgtype": "feedCard", "feedCard": {}}
        if not toolkit.is_none_or_white_space(feedCard):
            data["feedCard"]["links"] = feedCard

        return self.client(data)

    # 发送
    def send(self, **biz_params):
        # 获取消息类型
        msg_type        = biz_params.get('msgType')

        if msg_type == "advanced":
            api_params = biz_params.get('apiParams')
            self.client(api_params)

        elif msg_type == "text":
            text            = biz_params.get('text')
            at_mobiles      = biz_params.get('atMobiles')
            is_at_all       = biz_params.get('isAtAll')
            self.send_text(text, is_at_all, at_mobiles)

        elif msg_type == "link":
            title           = biz_params.get('title')
            text            = biz_params.get('text')
            message_url     = biz_params.get('messageUrl')
            pic_url         = biz_params.get('picUrl')

            self.send_link(title, text, message_url, pic_url)

        elif msg_type == "markdown":
            title           = biz_params.get('title')
            text            = biz_params.get('text')
            at_mobiles      = biz_params.get('atMobiles')
            is_at_all       = biz_params.get('isAtAll')

            self.send_markdown(title, text, is_at_all, at_mobiles)

        elif msg_type == "singleActionCard":
            title           = biz_params.get('title')
            text            = biz_params.get('text')
            single_title    = biz_params.get('singleTitle')
            single_url      = biz_params.get('singleURL')
            btn_orientation = biz_params.get('btnOrientation')
            hide_avatar     = biz_params.get('hideAvatar')

            self.send_single_action_card(title, text, single_title, single_url, btn_orientation, hide_avatar)

        elif msg_type == "btnsActionCard":
            title           = biz_params.get('title')
            text            = biz_params.get('text')
            btn_orientation = biz_params.get('btnOrientation')
            hide_avatar     = biz_params.get('hideAvatar')
            btns            = biz_params.get('btns')

            self.send_btns_action_card(title, text, btns, btn_orientation, hide_avatar)

        elif msg_type == "feedCard":
            feedCard        = biz_params.get('feedCard')
            self.send_feed_card(feedCard)
        else:
            raise Exception("Invalid message type")





