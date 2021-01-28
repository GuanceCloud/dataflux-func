import yaml from 'js-yaml'

const zh_CN = yaml.safeLoad(`
Script Set : 脚本集
Script     : 脚本
Func       : 函数
Data Source: 数据源
ENV        : 环境变量
`);

export default {
  'zh-CN': zh_CN,
};
