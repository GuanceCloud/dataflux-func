var CHAR_FORWARD_SLASH = 47
var CHAR_BACKWARD_SLASH = 92
var CHAR_DOT = 46

function isPathSeparator(code) {
  return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
}

function isPosixPathSeparator(code) {
  return code === CHAR_FORWARD_SLASH;
}

function normalize(path) {
  if (path.length === 0)
    return '.';
  var isAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
  var trailingSeparator =
    path.charCodeAt(path.length - 1) === CHAR_FORWARD_SLASH;
  // Normalize the path
  path = normalizeString(path, !isAbsolute, '/', isPosixPathSeparator);
  if (path.length === 0 && !isAbsolute)
    path = '.';
  if (path.length > 0 && trailingSeparator)
    path += '/';
  if (isAbsolute)
    return '/' + path;
  return path;
}

function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (isPathSeparator(code))
      break;
    else
      code = CHAR_FORWARD_SLASH;
    if (isPathSeparator(code)) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 ||
            res.charCodeAt(res.length - 1) !== CHAR_DOT ||
            res.charCodeAt(res.length - 2) !== CHAR_DOT) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += `${separator}..`;
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += separator + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === CHAR_DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

export function join() {
  if (arguments.length === 0)
    return '.';
  var sep = arguments[0].indexOf('/') > -1 ? '/' : '\\'
  var joined;
  var firstPart;
  for (var i = 0; i < arguments.length; ++i) {
    var arg = arguments[i];
    if (arg.length > 0) {
      if (joined === undefined)
        joined = firstPart = arg;
      else
        joined += sep + arg;
    }
  }
  if (joined === undefined)
    return '.';
  var needsReplace = true;
  var slashCount = 0;
  if (isPathSeparator(firstPart.charCodeAt(0))) {
    ++slashCount;
    var firstLen = firstPart.length;
    if (firstLen > 1) {
      if (isPathSeparator(firstPart.charCodeAt(1))) {
        ++slashCount;
        if (firstLen > 2) {
          if (isPathSeparator(firstPart.charCodeAt(2)))
            ++slashCount;
          else {
            // We matched a UNC path in the first part
            needsReplace = false;
          }
        }
      }
    }
  }
  if (needsReplace) {
    // Find any more consecutive slashes we need to replace
    for (; slashCount < joined.length; ++slashCount) {
      if (!isPathSeparator(joined.charCodeAt(slashCount)))
        break;
    }
    // Replace the slashes if needed
    if (slashCount >= 2)
      joined = sep + joined.slice(slashCount);
  }
  return normalize(joined);
}
