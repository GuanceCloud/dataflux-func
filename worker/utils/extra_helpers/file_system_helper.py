# -*- coding: utf-8 -*-

# Builtin Modules
import os

# Project Modules
from worker.utils import yaml_resources

# 3rd-party Modules
import six

if six.PY2:
    FILE_OPEN_KWARGS = {}
else:
    FILE_OPEN_KWARGS = dict(encoding='utf8')

basedir = os.path.abspath(os.path.dirname(__file__))

CONFIG = yaml_resources.get('CONFIG')

class FileSystemHelper(object):
    def __init__(self, logger, config=None):
        self.logger = logger

        if config:
            self.config = config
        else:
            self.config = {
                'rootFolder': CONFIG['FILE_STORE_ROOT_DIR'],
            }

        self.root_folder = os.path.join(basedir, '../../..', self.config['rootFolder'])

    def _get_full_path(self, upload_path):
        if upload_path.startswith('/'):
            upload_path = upload_path[1:]

        full_path = os.path.join(self.root_folder, upload_path)
        return full_path

    def upload(self, upload_path, buf):
        full_path = self._get_full_path(upload_path)

        dirname = os.path.dirname(full_path)
        os.makedirs(dirname, exist_ok=True)

        with open(full_path, 'wb') as _f:
            _f.write(six.ensure_binary(buf))

    def download(self, upload_path):
        full_path = self._get_full_path(upload_path)

        with open(full_path, 'r', **FILE_OPEN_KWARGS) as _f:
            return _f.read()

    def delete(self, upload_path):
        full_path = self._get_full_path(upload_path)

        os.remove(full_path)

