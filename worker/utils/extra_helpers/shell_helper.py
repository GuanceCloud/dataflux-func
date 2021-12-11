# -*- coding: utf-8 -*-

# Builtin Modules
import os
import uuid
import subprocess
import shutil
import traceback
import tempfile

# 3rd-party Modules
import six

# Project Modules
from worker.utils import toolkit

if six.PY2:
    FILE_OPEN_KWARGS = {}
else:
    FILE_OPEN_KWARGS = dict(encoding='utf8')

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DEFAULT_THIRD_PART_TOOLS_ROOT_PATH = '/usr/3rd-part-tools'

class ShellHelper(object):
    allowed_commands = set([
        'echo', 'cat', 'date',
        'grep', 'awk', 'sed',
        'ls', 'pwd',
        'curl', 'whois',
    ])

    def __init__(self, logger,
            tmp_folder=None,
            date_time_sub_tmp_folder=False,
            third_part_tool_root_path=None):

        self.logger = logger

        self.tmp_folder = os.path.join(tempfile.gettempdir(), tmp_folder or str(uuid.uuid4()))
        if date_time_sub_tmp_folder:
            date_time_string = str(toolkit.gen_time_serial_seq(rand_length=10))
            self.tmp_folder = os.path.join(self.tmp_folder, date_time_string)

        os.makedirs(self.tmp_folder, exist_ok=True)

        self.third_part_tool_root_path = third_part_tool_root_path or DEFAULT_THIRD_PART_TOOLS_ROOT_PATH

    def __call(self, command, *args, **kwargs):
        stdout = kwargs.get('stdout')

        if isinstance(stdout, six.string_types):
            stdout_file_path = os.path.join(self.tmp_folder, stdout)
            stdout = open(stdout_file_path, 'w')

        shell_command = [command]
        if args is not None:
            shell_command += args

        shell_command = [str(x) for x in shell_command]

        output    = None
        exit_code = 0
        try:
            if stdout:
                subprocess.call(shell_command, cwd=self.tmp_folder, stdout=stdout, stderr=subprocess.STDOUT, shell=False)
            else:
                output = subprocess.check_output(shell_command, cwd=self.tmp_folder, stderr=subprocess.STDOUT, shell=False)

        except subprocess.CalledProcessError as e:
            output    = e.output
            exit_code = e.returncode

        except Exception as e:
            for line in traceback.format_exc().splitlines():
                self.logger.error(line)

            raise

        finally:
            if isinstance(stdout, file) and not stdout.closed:
                stdout.close()

        output.strip()
        return output, exit_code

    def read_file(self, file_name):
        file_content = None

        file_path = os.path.join(self.tmp_folder, file_name)
        with open(file_path, 'r', **FILE_OPEN_KWARGS) as _f:
            file_content = _f.read()

        return file_content

    def write_file(self, file_name, file_content):
        file_path = os.path.join(self.tmp_folder, file_name)
        with open(file_path, 'w') as _f:
            _f.write(six.ensure_str(file_content))

        return file_content

    def download_file(self, file_name, url):
        return self.__call('wget', '-q', '-O', file_name)

    def call_3rd_part_tool(self, command, exec_file, *args):
        exec_file = os.path.join(self.third_part_tool_root_path, exec_file)
        exec_file = os.path.abspath(exec_file)

        return self.__call(command, exec_file, *args)

    def call_shell_command(self, command, *args, **kwargs):
        if command not in self.allowed_commands:
            raise Exception('Not allowed command: `{}`'.format(command))

        stdout = kwargs.get('stdout')
        return self.__call(command, *args, stdout=stdout)

    def destroy_tmp_folder(self):
        if self.tmp_folder and os.path.isdir(self.tmp_folder):
            shutil.rmtree(self.tmp_folder)
