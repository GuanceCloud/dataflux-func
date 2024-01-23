import os
import json
import yaml
import opencc

BASE_PATH_YAML = 'client/src/assets/yaml'
BASE_PATH_VUE  = 'client/src'

LOCALE_MAP = {
    'zh-HK': 's2hk.json',
    'zh-TW': 's2twp.json',
}

VUE_I18N_ZH_CN_START_LINE  = '<i18n locale="zh-CN" lang="yaml">'
VUE_I18N_ZHT_START_PATTERN = '<i18n locale="{}" lang="yaml">'
VUE_I18N_END_LINE          = '</i18n>'
VUE_GEN_START_LINE         = '<!-- Generated by OpenCC START -->'
VUE_GEN_END_LINE           = '<!-- Generated by OpenCC END -->'

def print_debug_info(f):
    print(f"Generating for {f.split('/')[-1]}")

def get_file_list(base_path, ext, no_ext=None):
    file_list = []

    for root, dirs, files in os.walk(base_path):
        for file in files:
            if not file.endswith(ext):
                continue

            if no_ext and file.endswith(no_ext):
                continue

            file_path = os.path.join(root, file)
            file_list.append(file_path)

    return file_list

def gen_zht_for_yaml():
    file_list = get_file_list(BASE_PATH_YAML, ext='.yaml', no_ext='.zht.yaml')
    for f in file_list:
        print_debug_info(f)

        with open(f, 'r') as _f:
            file_content = _f.read()
            obj = yaml.safe_load(file_content)

        zh_cn = obj['zh-CN']
        zht = {}
        for locale, config in LOCALE_MAP.items():
            converter = opencc.OpenCC(config)

            zht[locale] = {}
            for k, v in zh_cn.items():
                zht[locale][k] = converter.convert(v)

        output_path = f[0:-len('.yaml')] + '.zht.yaml'
        with open(output_path, 'w') as _f:
            output = '# Generated by OpenCC\n' + yaml.dump(zht, allow_unicode=True, width=9999)
            _f.write(output)

def add_zht_for_vue():
    file_list = get_file_list(BASE_PATH_VUE, ext='.vue')
    for f in file_list:
        print_debug_info(f)

        with open(f, 'r') as _f:
            file_content = _f.read()
            prev_file_lines = file_content.splitlines()

            # 跳过无需翻译的文件
            if VUE_I18N_ZH_CN_START_LINE not in prev_file_lines:
                continue

            # 清理之前翻译内容
            start_index = None
            end_index   = None
            for i, l in enumerate(prev_file_lines):
                if l.strip() == VUE_GEN_START_LINE:
                    start_index = i
                    continue

                if start_index and l.strip() == VUE_GEN_END_LINE:
                    end_index = i + 2
                    break

            if start_index and end_index:
                file_lines = prev_file_lines[0:start_index] + prev_file_lines[end_index:]
            else:
                file_lines = prev_file_lines

            # 提取 zh-CN 部分
            start_index = None
            end_index   = None
            zh_cn_lines = []
            for i, l in enumerate(file_lines):
                if l.strip() == VUE_I18N_ZH_CN_START_LINE:
                    start_index = i + 1
                    continue

                if start_index and l.strip() == VUE_I18N_END_LINE:
                    end_index = i
                    break

                if start_index is not None and end_index is None:
                    zh_cn_lines.append(l)

            zh_cn_yaml = '\n'.join(zh_cn_lines)
            zh_cn = yaml.safe_load(zh_cn_yaml)

            zht_lines = [ '', VUE_GEN_START_LINE ]
            for locale, config in LOCALE_MAP.items():
                converter = opencc.OpenCC(config)
                converted = {}
                for k, v in zh_cn.items():
                    converted[k] = converter.convert(v)

                zht_lines.append(VUE_I18N_ZHT_START_PATTERN.format(locale))
                zht_lines.append(yaml.dump(converted, allow_unicode=True, width=9999, line_break=False).strip())
                zht_lines.append(VUE_I18N_END_LINE)

            zht_lines.append(VUE_GEN_END_LINE)

            zht = '\n'.join(zht_lines)
            file_lines.insert(end_index + 1, zht)

        # 写入源文件
        with open(f, 'w') as _f:
            output = '\n'.join(file_lines)
            _f.write(output.rstrip() + '\n')

def main():
    gen_zht_for_yaml()
    add_zht_for_vue()

if __name__ == '__main__':
    main()
