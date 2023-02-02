'use strict';

/* Built-in Modules */
var fs   = require('fs-extra');
var path = require('path');

/* 3rd-party Modules */

/* Project Modules */
var E       = require('../utils/serverError');
var CONFIG  = require('../utils/yamlResources').get('CONFIG');
var toolkit = require('../utils/toolkit');

/* Handlers */
exports.list = function(req, res, next) {
  var subFolder = req.query.folder || './';
  var type      = req.query.type;

  var absPath = path.join(CONFIG.RESOURCE_ROOT_PATH, subFolder);

  if (!absPath.endsWith('/')) {
    absPath += '/';
  }

  // 防止访问外部文件夹
  if (!toolkit.startsWith(absPath, CONFIG.RESOURCE_ROOT_PATH + '/')) {
    return next(new E('EBizCondition', 'Cannot not fetch folder out of resource folder'))
  }

  // 检查存在性
  if (!fs.existsSync(absPath)) {
    return next(new E('EBizCondition', 'Folder not exists'))
  }

  var opt = {
    withFileTypes: true,
  }
  fs.readdir(absPath, opt, function(err, data) {
    if (err) return next(err);

    var files = data.reduce(function(acc, x) {
      var f = {
        name      : x.name,
        type      : null,
        size      : null,
        createTime: null,
        updateTime: null,
      };

      var stat = fs.statSync(path.join(absPath, x.name));
      f.createTime = stat.birthtimeMs || null;
      f.updateTime = stat.ctimeMs;

      if (x.isDirectory()) {
        f.type = 'folder';
      } else if (x.isFile()) {
        f.type = 'file';
        f.size = stat.size;
      }

      if (!f.type) return acc;

      if (toolkit.isNothing(type) || type.indexOf(f.type) >= 0) {
        acc.push(f);
      }
      return acc;
    }, []);

    var ret = toolkit.initRet(files);
    return res.locals.sendJSON(ret);
  });
};

exports.get = function(req, res, next) {
  var filePath = req.query.filePath;

  var absPath = path.join(CONFIG.RESOURCE_ROOT_PATH, filePath);

  // 防止访问外部文件夹
  if (!toolkit.startsWith(absPath, CONFIG.RESOURCE_ROOT_PATH + '/')) {
    return next(new E('EBizCondition', 'Cannot not access file out of resource folder'))
  }

  var stat = null;

  if (fs.existsSync(absPath)) {
    stat = fs.statSync(absPath);
  }

  var ret = toolkit.initRet(stat);
  return res.locals.sendJSON(ret);
};

exports.download = function(req, res, next) {
  var filePath = req.query.filePath;
  var preview  = req.query.preview;

  var fileName = filePath.split('/').pop();
  var fileType = fileName.split('.').pop();
  var absPath  = path.join(CONFIG.RESOURCE_ROOT_PATH, filePath);

  // 防止访问外部文件夹
  if (!toolkit.startsWith(absPath, CONFIG.RESOURCE_ROOT_PATH + '/')) {
    return next(new E('EBizCondition', 'Cannot not access file out of resource folder'))
  }

  // 检查存在性
  if (!fs.existsSync(absPath)) {
    return next(new E('EBizCondition', 'File not exists'))
  }

  if (preview) {
    fs.readFile(absPath, function(err, data) {
      if (err) return next(err)

      res.type(fileType);
      return res.send(data);
    });

  } else {
    return res.locals.sendLocalFile(absPath);
  }
};

exports.upload = function(req, res, next) {
  var file   = req.files ? req.files[0] : null;
  var folder = req.body.folder || '.';
  var rename = req.body.rename || null;

  var fileSaveName = rename || file.originalname;
  var filePath = path.join(CONFIG.RESOURCE_ROOT_PATH, folder, fileSaveName);
  fs.moveSync(file.path, filePath, { overwrite: true });

  var ret = toolkit.initRet();
  res.locals.sendJSON(ret);
};

exports.operate = function(req, res, next) {
  var targetPath        = req.body.targetPath;
  var operation         = req.body.operation;
  var operationArgument = req.body.operationArgument;

  var targetName    = targetPath.split('/').pop();
  var targetAbsPath = path.join(CONFIG.RESOURCE_ROOT_PATH, targetPath);
  var currentAbsDir = toolkit.replacePathEnd(targetAbsPath);

  // 防止访问外部文件夹
  if (!toolkit.startsWith(targetAbsPath, CONFIG.RESOURCE_ROOT_PATH + '/')) {
    return next(new E('EBizCondition', 'Cannot not operate file or folder out of resource folder'))
  }

  // 检查操作对象存在性
  switch(operation) {
    case 'zip':
    case 'unzip':
    case 'cp':
    case 'mv':
    case 'rm':
      // 要求存在
      if (!fs.existsSync(targetAbsPath)) {
        return next(new E('EBizCondition', 'File or folder not existed', { name: targetName }));
      }
      break;

    default:
      // 要求不存在
      if (fs.existsSync(targetAbsPath)) {
        return next(new E('EBizCondition', 'File or folder already existed', { name: targetName }));
      }
      break;
  }

  // 检查/准备参数
  var cmd     = null;
  var cmdArgs = [];
  switch(operation) {
    case 'mkdir':
      cmd = 'mkdir';
      cmdArgs.push('-p', targetName);
      break;

    case 'zip':
      var zipFileName = targetName + '.zip';

      var zipFileAbsPath = path.join(currentAbsDir, zipFileName);
      if (fs.existsSync(zipFileAbsPath)) {
        return next(new E('EBizCondition', 'Zip file already existed', { name: zipFileName }));
      }

      cmd = 'zip';
      cmdArgs.push('-q', '-r', zipFileName, targetName); // 在当前目录执行
      break;

    case 'unzip':
      cmd = 'unar';
      cmdArgs.push('-q', '-d', '-r', targetName);
      break;

    case 'cp':
      cmdArgs.push('-r');
    case 'mv':
      var newName = operationArgument;
      var newAbsPath = newName[0] === '/'
                      ? path.join(CONFIG.RESOURCE_ROOT_PATH, newName)
                      : path.join(currentAbsDir, newName);

      if (fs.existsSync(newAbsPath)) {
        return next(new E('EBizCondition', 'Specified new file or folder name already existed'));
      }

      var parentAbsDir = toolkit.replacePathEnd(newAbsPath);
      fs.ensureDirSync(parentAbsDir);

      cmd = operation;
      cmdArgs.push(targetAbsPath, newAbsPath);
      break;

    case 'rm':
      cmd = 'rm';
      cmdArgs.push('-rf', targetAbsPath);
      break;

    default:
      return next(new E('EClientUnsupported', 'Unsupported resource operation'));
      break;
  }

  var cmdOpt = {
    cwd: currentAbsDir,
  };
  toolkit.childProcessSpawn(cmd, cmdArgs, cmdOpt, function(err, stdout) {
    if (err) {
      return next(new E('EBizCondition', 'Resource operation Failed', {
        message: err.toString(),
      }));
    }
    return res.locals.sendJSON();
  })
};
