import sublime, sublime_plugin

class EjsTranslateHelperCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        for region in self.view.sel():
            selected_str = self.view.substr(region)

            capped_str = selected_str

            if (selected_str.startswith("'") and selected_str.endswith("'")) \
                    or (selected_str.startswith('"') and selected_str.endswith('"')):
                capped_str = "__(" + selected_str + ")"

            else:
                quote_mark = "'"
                if "'" in selected_str:
                    quote_mark = '"'

                capped_str = "<%= __(" + quote_mark + selected_str + quote_mark + ") %>"

            self.view.replace(edit, region, capped_str)
