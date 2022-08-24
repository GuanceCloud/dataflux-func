/*************************/
/* Based on anyword hint */
/*************************/

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  // WORD : /[\w$]+/ -> /[\w@$]+/
  // RANGE: 500      -> 1000
  var WORD = /[\w@$]+/, RANGE = 1000;

  // Python keywords
  var PYTHON_KEYWORD = ['and', 'as', 'assert', 'async', 'await', 'break',
                        'class', 'continue', 'def', 'del', 'elif', 'else',
                        'except', 'False', 'finally', 'for', 'from', 'global',
                        'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal',
                        'not', 'or', 'pass', 'raise', 'return', 'True', 'try',
                        'while', 'with', 'yield'];

  // Python builtins
  var PYTHON_BUILTINS = ['abs', 'all', 'any', 'ascii', 'bin', 'breakpoint', 'callable',
                        'chr', 'compile', 'delattr', 'dir', 'divmod', 'eval', 'exec', 'format',
                        'getattr', 'globals', 'hasattr', 'hash', 'hex', 'id', 'input', 'isinstance',
                        'issubclass', 'iter', 'len', 'locals', 'max', 'min', 'next', 'oct', 'ord',
                        'pow', 'print', 'repr', 'round', 'setattr', 'sorted', 'sum', 'vars', 'None',
                        'Ellipsis', 'NotImplemented', 'False', 'True', 'bool', 'memoryview', 'bytearray',
                        'bytes', 'classmethod', 'complex', 'dict', 'enumerate', 'filter', 'float', 'frozenset',
                        'property', 'int', 'list', 'map', 'object', 'range', 'reversed', 'set', 'slice',
                        'staticmethod', 'str', 'super', 'tuple', 'type', 'zip', '__debug__', 'BaseException',
                        'Exception', 'TypeError', 'StopAsyncIteration', 'StopIteration', 'GeneratorExit',
                        'SystemExit', 'KeyboardInterrupt', 'ImportError', 'ModuleNotFoundError', 'OSError',
                        'EnvironmentError', 'IOError', 'EOFError', 'RuntimeError', 'RecursionError',
                        'NotImplementedError', 'NameError', 'UnboundLocalError', 'AttributeError',
                        'SyntaxError', 'IndentationError', 'TabError', 'LookupError', 'IndexError',
                        'KeyError', 'ValueError', 'UnicodeError', 'UnicodeEncodeError', 'UnicodeDecodeError',
                        'UnicodeTranslateError', 'AssertionError', 'ArithmeticError', 'FloatingPointError',
                        'OverflowError', 'ZeroDivisionError', 'SystemError', 'ReferenceError', 'MemoryError',
                        'BufferError', 'Warning', 'UserWarning', 'DeprecationWarning', 'PendingDeprecationWarning',
                        'SyntaxWarning', 'RuntimeWarning', 'FutureWarning', 'ImportWarning', 'UnicodeWarning',
                        'BytesWarning', 'ResourceWarning', 'ConnectionError', 'BlockingIOError', 'BrokenPipeError',
                        'ChildProcessError', 'ConnectionAbortedError', 'ConnectionRefusedError', 'ConnectionResetError',
                        'FileExistsError', 'FileNotFoundError', 'IsADirectoryError', 'NotADirectoryError', 'InterruptedError',
                        'PermissionError', 'ProcessLookupError', 'TimeoutError', 'open', 'quit', 'exit', 'copyright',
                        'credits', 'license', 'help', '_'];

  CodeMirror.registerHelper("hint", "dff-anyword", function(editor, options) {
    var word = options && options.word || WORD;
    var range = options && options.range || RANGE;
    var cur = editor.getCursor(), curLine = editor.getLine(cur.line);
    var end = cur.ch, start = end;
    while (start && word.test(curLine.charAt(start - 1))) --start;
    var curWord = start != end && curLine.slice(start, end);

    var list = options && options.list || [], seen = {};

    var _curCode = editor.getValue();
    var _lowCurLine = 'string' === typeof curLine ? curLine.toLowerCase() : '';
    var _lowCurWord = 'string' === typeof curWord ? curWord.toLowerCase() : '';

    // Add Python keywords/builtins
    function addKeyword(keywords) {
      keywords.forEach(function(kw) {
        if (kw.toLowerCase().indexOf(_lowCurWord) < 0) return;

        list.push(kw);
        seen[kw] = true;
      });
    }
    addKeyword(PYTHON_KEYWORD);
    addKeyword(PYTHON_BUILTINS);

    // Add DataFlux Func @DFF.API hint
    if ('dff'.indexOf(_lowCurLine) === 0 || '@dff'.indexOf(_lowCurLine) === 0) {
      list.push("@DFF.API('函数名称', category=None, tags=[], cache_result=None)");
    }

    // Add DataFlux DFF.* hint
    if ('dff'.indexOf(_lowCurWord) === 0) {
      if (window._DFF_connectorIds) {
        window._DFF_connectorIds.forEach(function(id) {
          list.push("DFF.CONN('" + id + "')");
        });
      }

      if (window._DFF_envVariableIds) {
        window._DFF_envVariableIds.forEach(function(id) {
          list.push("DFF.ENV('" + id + "')");
        });
      }
    };

    // Add DataFlux Func import script hint
    var currentScriptId = location.href.split('/').pop();
    if ('import'.indexOf(_lowCurLine) === 0) {
      if (window._DFF_scriptIds) {
        window._DFF_scriptIds.forEach(function(id) {
          if (id === currentScriptId) return;
          list.push('import ' + id);
        });
      }
    }

    // Add DataFlux Func func call hint
    if (window._DFF_funcIds) {
      window._DFF_funcIds.forEach(function(id) {
        var _scriptId = id.split('.')[0];
        if (_scriptId === currentScriptId) return;
        if (_curCode.indexOf('import ' + _scriptId) < 0) return;

        if (id.toLowerCase().indexOf(_lowCurWord) === 0) {
          list.push(id);
          seen[id] = true;
        }
      });
    }

    var re = new RegExp(word.source, "g");
    for (var dir = -1; dir <= 1; dir += 2) {
      var line = cur.line, endLine = Math.min(Math.max(line + dir * range, editor.firstLine()), editor.lastLine()) + dir;
      for (; line != endLine; line += dir) {
        var text = editor.getLine(line), m;
        while (m = re.exec(text)) {
          if (line == cur.line && m[0] === curWord) continue;
          if ((!curWord || m[0].lastIndexOf(curWord, 0) == 0) && !Object.prototype.hasOwnProperty.call(seen, m[0])) {
            seen[m[0]] = true;
            list.push(m[0]);
          }
        }
      }
    }

    return {list: list, from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end)};
  });
});
