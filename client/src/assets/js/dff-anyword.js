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

  // RANGE 500 -> 1000
  var WORD = /[\w$]+/, RANGE = 1000;

  // Python keywords
  var PYTHON_KEYWORD = ['and', 'as', 'assert', 'async', 'await', 'break',
                        'class', 'continue', 'def', 'del', 'elif', 'else',
                        'except', 'False', 'finally', 'for', 'from', 'global',
                        'if', 'import', 'in', 'is', 'lambda', 'None', 'nonlocal',
                        'not', 'or', 'pass', 'raise', 'return', 'True', 'try',
                        'while', 'with', 'yield'];
  var DFF_HINT = [
    "DFF.API('函数名称', category=None, tags=[], cache_result=None)",
    "DFF.SRC('数据源ID')",
    "DFF.ENV('环境变量ID')",
  ];

  CodeMirror.registerHelper("hint", "dff-anyword", function(editor, options) {
    var word = options && options.word || WORD;
    var range = options && options.range || RANGE;
    var cur = editor.getCursor(), curLine = editor.getLine(cur.line);
    var end = cur.ch, start = end;
    while (start && word.test(curLine.charAt(start - 1))) --start;
    var curWord = start != end && curLine.slice(start, end);

    var list = options && options.list || [], seen = {};

    var curCode = editor.getValue();

    // Add Python keywords
    PYTHON_KEYWORD.forEach(function(kw) {
      if (kw.toLowerCase().indexOf(curWord.toLowerCase()) === 0) {
        list.push(kw);
        seen[kw] = true;
      }
    });

    // Add DataFlux Func @DFF hint
    if (curWord.toLowerCase() === 'dff') {
      list.push("DFF.API('函数名称', category=None, tags=[], cache_result=None)");

      if (window._DFF_dataSourceIds) {
        window._DFF_dataSourceIds.forEach(function(id) {
          list.push("DFF.SRC('" + id + "')");
        });

      } else {
        list.push("DFF.SRC('数据源ID')");
      }

      if (window._DFF_envVariableIds) {
        window._DFF_envVariableIds.forEach(function(id) {
          list.push("DFF.ENV('" + id + "')");
        });

      } else {
        list.push("DFF.ENV('环境变量ID')");
      }
    };

    // Add DataFlux Func import script hint
    var currentScriptId = location.href.split('/').pop();
    if ('import'.indexOf(curWord.toLowerCase()) === 0) {
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
        if (curCode.indexOf('import ' + _scriptId) < 0) return;

        if (id.toLowerCase().indexOf(curWord.toLowerCase()) === 0) {
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
