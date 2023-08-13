# -*- coding: utf-8 -*-

# Built-in Modules
import multiprocessing
import signal
import time

def run_background(func, pool_size, max_tasks):
    try:
        manager = multiprocessing.Manager()
        shutdown_event = manager.Event()

        # SIGTERM 信号
        def sigterm_handler(signum, frame):
            print('Received SIGTERM')
            shutdown_event.set()

        signal.signal(signal.SIGTERM, sigterm_handler)

        # 函数包装
        def func_wrap():
            print('New process')

            # 执行若干个任务后重启进程
            for i in range(max_tasks):
                # 执行指定函数
                try:
                    func()

                except KeyboardInterrupt as e:
                    shutdown_event.set()

                except Exception as e:
                    raise

                # 检查停止事件
                if shutdown_event.is_set():
                    return

        # 保持一定数量进程
        pool = []
        while not shutdown_event.is_set():
            for p in pool:
                if not p.is_alive():
                    p.close()
                    pool.remove(p)

            while len(pool) < pool_size:
                p = multiprocessing.Process(target=func_wrap)
                p.start()
                pool.append(p)

            time.sleep(1)

        # 清理
        for p in pool:
            p.join()

        print('Shutdown')

    except KeyboardInterrupt as e:
        print('Interrupted by Ctrl + C')
        shutdown_event.set()
