# -*- coding: utf-8 -*-

'''
脚本执行处理任务
主要用于直接调用函数、通过授权链接调用函数、Crontab 触发调用函数
'''

# Built-in Modules
import time
import pprint
import traceback

# 3rd-party Modules

# Project Modules
from worker.utils import toolkit, yaml_resources
from worker.tasks.main import FuncBaseTask, BaseFuncResponse, FuncResponse, FuncResponseLargeData, NotFoundException

CONFIG = yaml_resources.get('CONFIG')

class FuncRunner(FuncBaseTask):
    name = 'Main.FuncRunner'

    def callback(self, task_resp):
        pass
    def cache(self, origin, origin_id, exec_mode, status, trigger_time_ms, start_time_ms,
            root_task_id=None, func_id=None, func_call_kwargs=None,
            log_messages=None, einfo_text=None, edump_text=None,
            task_info_limit=None):
        if not all([origin, origin_id]):
            return

        if isinstance(task_info_limit, (int, float)) and task_info_limit <= 0:
            return

        # 记录本地数据库
        data = {
            'id'            : self.request.id,
            'origin'        : origin,
            'originId'      : origin_id,
            'rootTaskId'    : root_task_id,
            'funcId'        : func_id,
            'funcCallKwargs': func_call_kwargs,
            'execMode'      : exec_mode,
            'status'        : status,
            'triggerTimeMs' : trigger_time_ms,
            'startTimeMs'   : start_time_ms,
            'endTimeMs'     : int(time.time() * 1000),
            'taskInfoLimit' : task_info_limit,
            'queue'         : str(self.queue),
        }

        if log_messages:
            log_messages_reduced = [toolkit.limit_text(l, CONFIG['_TASK_INFO_LOG_MESSAGE_LINE_LIMIT'], show_length=True) for l in log_messages]
            data['logMessageTEXT'] = '\n'.join(log_messages_reduced).strip()

            log_message_text_len = len(data['logMessageTEXT'])
            if log_message_text_len > CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_HEAD'] + CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_TAIL']:
                data['logMessageTEXT'] = '\n'.join([
                        f"!!! Log content too long, only FIRST {CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_HEAD']} chars and LAST {CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_TAIL']} are saved !!!",
                        '',
                        data['logMessageTEXT'][:CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_HEAD']] + '...',
                        '',
                        f"<skipped {log_message_text_len - CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_HEAD'] - CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_TAIL']} chars>",
                        '',
                        '...' + data['logMessageTEXT'][-CONFIG['_TASK_INFO_LOG_MESSAGE_TOTAL_LIMIT_TAIL']:],
                    ])

        if einfo_text:
            data['einfoTEXT'] = einfo_text

        if edump_text:
            data['edumpTEXT'] = edump_text

        data = toolkit.json_dumps(data, indent=0)
        cache_key = toolkit.get_cache_key('syncCache', 'taskInfoBuffer')
        self.cache_db.run('lpush', cache_key, data)

        # 上传观测云数据
        upload_enabled = self.system_settings.get('GUANCE_DATA_UPLOAD_ENABLED') or False
        upload_url     = self.system_settings.get('GUANCE_DATA_UPLOAD_URL')     or None
        if all([ upload_enabled, upload_url ]):
            full_log_message_parts = []
            if log_messages:
                full_log_message_parts.append('\n'.join(log_messages))

            if einfo_text:
                full_log_message_parts.append(' Stack '.center(30, '-'))
                full_log_message_parts.append(einfo_text)

            full_log_messages = '\n'.join(full_log_message_parts)
            end_time_ms = int(time.time() * 1000)

            guance_points = [{
                'measurement': 'DFF_func_log',
                'tags': {
                    'workspace_uuid'  : func_call_kwargs.get('workspace_uuid') or '-',
                    'task_id'         : self.request.id,
                    'origin'          : origin,
                    'origin_id'       : origin_id,
                    'root_task_id'    : root_task_id,
                    'func_id'         : func_id,
                    'exec_mode'       : exec_mode,
                    'status'          : status,
                    'trigger_time_cn' : toolkit.to_cn_time_str(trigger_time_ms),
                    'start_time_cn'   : toolkit.to_cn_time_str(start_time_ms),
                    'end_time_cn'     : toolkit.to_cn_time_str(end_time_ms),
                    'queue'           : self.queue,
                },
                'fields': {
                    'wait_cost'       : start_time_ms - trigger_time_ms,
                    'run_cost'        : end_time_ms   - start_time_ms,
                    'total_cost'      : end_time_ms   - trigger_time_ms,
                    'func_call_kwargs': toolkit.json_dumps(func_call_kwargs),
                    'edump_text'      : edump_text or '-',
                    'message'         : full_log_messages,
                },
                'timestamp': trigger_time_ms,
            }]
            self.upload_guance_data('logging', guance_points)

    def cache_func_result(self, func_id, script_code_md5, script_publish_version, func_call_kwargs_md5, result, cache_result_expires):
        if not all([func_id, script_code_md5, script_publish_version, func_call_kwargs_md5, cache_result_expires]):
            return

        cache_key = toolkit.get_cache_key('cache', 'funcResult', tags=[
            'funcId'              , func_id,
            'scriptCodeMD5'       , script_code_md5,
            'scriptPublishVersion', script_publish_version,
            'funcCallKwargsMD5'   , func_call_kwargs_md5])

        result_dumps = toolkit.json_dumps(result)
        self.cache_db.setex(cache_key, cache_result_expires, result_dumps)

    def run(self, **kwargs):
        super().run(**kwargs)

        # 用于函数缓存
        self.func_call_kwargs_md5 = kwargs.get('funcCallKwargsMD5')

        # 函数结果缓存时长
        self.cache_result_expires = None

        # 任务记录数
        self.task_info_limit = kwargs.get('taskInfoLimit')

        # 是否保存结果
        self.save_result = kwargs.get('saveResult') or False

        ### 任务开始
        func_resp = None
        try:
            # 执行函数
            func_resp = self.apply()

            # 提取函数结果缓存时长
            try:
                self.cache_result_expires = self.script['funcExtraConfig'][self.func_id]['cacheResult']
            except (KeyError, TypeError) as e:
                pass

            # 响应大型数据，需要将数据缓存为文件
            if isinstance(func_resp, FuncResponseLargeData):
                func_resp.cache_to_file(self.cache_result_expires or 0)

        except Exception as e:
            # 替换默认错误堆栈
            self.error_stack = self.get_error_stack()

            raise

        else:
            # 准备函数运行结果
            return_value     = None
            response_control = func_resp.make_response_control()

            if func_resp.data is not None:
                return_value = {}

                try:
                    return_value['raw'] = func_resp.data
                except Exception as e:
                    for line in traceback.format_exc().splitlines():
                        self.logger.error(line)

                try:
                    return_value['repr'] = pprint.saferepr(func_resp.data)
                except Exception as e:
                    for line in traceback.format_exc().splitlines():
                        self.logger.error(line)

                try:
                    return_value['json_dumps'] = toolkit.json_dumps(func_resp.data)
                except Exception as e:
                    for line in traceback.format_exc().splitlines():
                        self.logger.error(line)

            # 准备返回值
            result = {
                'returnValue'    : return_value,
                'responseControl': response_control,
            }

            # # 记录函数运行结果
            # if save_result:
            #     args = (
            #         self.request.id,
            #         self.name,
            #         self.request.origin,
            #         self.request.x_start_time,
            #         int(time.time()),
            #         self.request.args,
            #         self.request.kwargs,
            #         result,
            #         celery_status.SUCCESS,
            #         None
            #     )
            #     result_task_id = '{}-RESULT'.format(self.request.id)
            #     result_saving_task.apply_async(task_id=result_task_id, args=args)

            # # 缓存函数运行结果
            # if cache_result_expires:
            #     self.cache_func_result(
            #         func_id=func_id,
            #         script_code_md5=target_script['codeMD5'],
            #         script_publish_version=target_script['publishVersion'],
            #         func_call_kwargs_md5=func_call_kwargs_md5,
            #         result=result,
            #         cache_result_expires=cache_result_expires)

            # 返回函数结果
            return result

        finally:
            # 定时任务解锁
            crontab_lock_key   = kwargs.get('crontabLockKey')
            crontab_lock_value = kwargs.get('crontabLockValue')
            if crontab_lock_key and crontab_lock_value:
                self.cache_db.unlock(crontab_lock_key, crontab_lock_value)

            # # 记录脚本日志
            # if script_scope:
            #     log_messages = script_scope['DFF'].log_messages or None

            # # 记录函数运行故障
            # if status == 'failure':
            #     trace_info = trace_info or self.get_trace_info()
            #     einfo_text = einfo_text or self.get_formated_einfo(trace_info, only_in_script=True)

            # # 缓存任务状态
            # self.cache_task_info(
            #     origin=origin,
            #     origin_id=origin_id,
            #     exec_mode=exec_mode,
            #     status=status,
            #     trigger_time_ms=trigger_time_ms,
            #     start_time_ms=start_time_ms,
            #     root_task_id=root_task_id,
            #     func_id=func_id,
            #     func_call_kwargs=func_call_kwargs,
            #     log_messages=log_messages,
            #     einfo_text=einfo_text,
            #     edump_text=edump_text,
            #     task_info_limit=task_info_limit)

            # 清理资源
            self.clean_up()
