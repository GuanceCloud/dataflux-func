# -*- coding: utf-8 -*-

class Colors(object):
    COLORS = {
      'black'  : [30, 39],
      'red'    : [31, 39],
      'green'  : [32, 39],
      'yellow' : [33, 39],
      'blue'   : [34, 39],
      'magenta': [35, 39],
      'cyan'   : [36, 39],
      'white'  : [37, 39],
      'gray'   : [90, 39],
      'grey'   : [90, 39],
    }

    def __getattr__(self, name):
        if name in self.COLORS:
            left  = '\033[' + str(self.COLORS[name][0]) + 'm'
            right = '\033[' + str(self.COLORS[name][1]) + 'm'

            return lambda s: left + s + right

        else:
            raise AttributeError("Color '{}' not supported.".format(name))

colors = Colors()