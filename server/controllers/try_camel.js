var s = 'cacheDBKeyCountByPrefix';

function f(s) {
  var converted = '';

  for (var i = 0; i < s.length; i++) {
    var ch = s[i];
    if (s.charCodeAt(i) < 90 && s.charCodeAt(i - 1) > 96) {
      converted = converted.trim() + ' ';
    }
    if (s.charCodeAt(i) < 90 && s.charCodeAt(i + 1) > 96) {
      converted = converted.trim() + ' ';
      ch = ch.toLowerCase();
    }

    converted += ch;
  };

  return converted;
}

console.log(f(s))
