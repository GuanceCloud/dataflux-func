<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ modeName }}自动触发配置
          <code class="text-main">{{ data.func_title }}</code>
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" :model="form" :rules="formRules" label-width="100px">
                <el-form-item label="执行函数" prop="funcId">
                  <el-cascader class="func-cascader-input" ref="funcCascader"
                    filterable
                    v-model="form.funcId"
                    :options="funcCascaderOptions"
                    :props="{expandTrigger: 'hover', emitPath: false, multiple: false}"
                    @change="autoFillFuncCallKwargsJSON"></el-cascader>
                </el-form-item>

                <el-form-item label="调用参数" prop="funcCallKwargsJSON">
                  <el-input type="textarea" v-model="form.funcCallKwargsJSON" resize="none" :autosize="true"></el-input>
                  <InfoBlock title="JSON格式的函数参数（作为 **kwargs 传入）"></InfoBlock>

                  <InfoBlock v-if="apiCustomKwargsSupport" type="success" title="本函数允许传递额外自定义的参数"></InfoBlock>
                </el-form-item>

                <!-- Crontab配置 -->
                <template v-if="!fixedCrontabExpr">
                  <el-form-item label="Crontab">
                    <code class="crontab-expr-parts crontab-expr-parts-minutes">{{ formCrontabExprParts.minutes }}</code>
                    <code class="crontab-expr-parts crontab-expr-parts-hours">{{ formCrontabExprParts.hours }}</code>
                    <code class="crontab-expr-parts crontab-expr-parts-days">{{ formCrontabExprParts.days }}</code>
                    <code class="crontab-expr-parts crontab-expr-parts-months">{{ formCrontabExprParts.months }}</code>
                    <code class="crontab-expr-parts crontab-expr-parts-weeks">{{ formCrontabExprParts.weeks }}</code>
                  </el-form-item>

                  <el-form-item label="按周重复">
                    <el-checkbox-group size="mini" v-model="formCrontab.weeks">
                      <template v-for="(item, index) in WEEKS">
                        <el-checkbox border :key="item.expr" :label="item.expr" @change="autoFixCrontab">{{ item.name }}</el-checkbox>
                        <br v-if="WEEKS[index + 1] && WEEKS[index].expr.indexOf('*') >= 0 && WEEKS[index + 1].expr.indexOf('*') < 0" />
                      </template>
                    </el-checkbox-group>
                  </el-form-item>

                  <el-form-item label="按月重复">
                    <el-checkbox-group size="mini" v-model="formCrontab.months">
                      <template v-for="(item, index) in MONTHS">
                        <el-checkbox border :key="item.expr" :label="item.expr" @change="autoFixCrontab">{{ item.name }}</el-checkbox>
                        <br v-if="MONTHS[index + 1] && MONTHS[index].expr.indexOf('*') >= 0 && MONTHS[index + 1].expr.indexOf('*') < 0" />
                      </template>
                    </el-checkbox-group>
                  </el-form-item>

                  <el-form-item label="按天重复">
                    <el-checkbox-group size="mini" v-model="formCrontab.days">
                      <template v-for="(item, index) in DAYS">
                        <el-checkbox border :key="item.expr" :label="item.expr" @change="autoFixCrontab">{{ item.name }}</el-checkbox>
                        <br v-if="DAYS[index + 1] && DAYS[index].expr.indexOf('*') >= 0 && DAYS[index + 1].expr.indexOf('*') < 0" />
                      </template>
                    </el-checkbox-group>
                  </el-form-item>

                  <el-form-item label="按时重复">
                    <el-checkbox-group size="mini" v-model="formCrontab.hours">
                      <template v-for="(item, index) in HOURS">
                        <el-checkbox border :key="item.expr" :label="item.expr" @change="autoFixCrontab">{{ item.name }}</el-checkbox>
                        <br v-if="HOURS[index + 1] && HOURS[index].expr.indexOf('*') >= 0 && HOURS[index + 1].expr.indexOf('*') < 0" />
                      </template>
                    </el-checkbox-group>
                  </el-form-item>

                  <el-form-item label="按分重复">
                    <el-checkbox-group size="mini" v-model="formCrontab.minutes">
                      <template v-for="(item, index) in MINUTES">
                        <el-checkbox border :key="item.expr" :label="item.expr" @change="autoFixCrontab">{{ item.name }}</el-checkbox>
                        <br v-if="MINUTES[index + 1] && MINUTES[index].expr.indexOf('*') >= 0 && MINUTES[index + 1].expr.indexOf('*') < 0" />
                      </template>
                    </el-checkbox-group>
                  </el-form-item>

                  <el-form-item label="Crontab">
                    <code class="crontab-expr-parts crontab-expr-parts-minutes">{{ formCrontabExprParts.minutes }}</code>
                    <code class="crontab-expr-parts crontab-expr-parts-hours">{{ formCrontabExprParts.hours }}</code>
                    <code class="crontab-expr-parts crontab-expr-parts-days">{{ formCrontabExprParts.days }}</code>
                    <code class="crontab-expr-parts crontab-expr-parts-months">{{ formCrontabExprParts.months }}</code>
                    <code class="crontab-expr-parts crontab-expr-parts-weeks">{{ formCrontabExprParts.weeks }}</code>
                  </el-form-item>
                </template>
                <el-form-item v-else label="固定 Crontab">
                  <code class="crontab-expr-parts crontab-expr-parts-minutes">{{ fixedCrontabExprParts.minutes }}</code>
                  <code class="crontab-expr-parts crontab-expr-parts-hours">{{ fixedCrontabExprParts.hours }}</code>
                  <code class="crontab-expr-parts crontab-expr-parts-days">{{ fixedCrontabExprParts.days }}</code>
                  <code class="crontab-expr-parts crontab-expr-parts-months">{{ fixedCrontabExprParts.months }}</code>
                  <code class="crontab-expr-parts crontab-expr-parts-weeks">{{ fixedCrontabExprParts.weeks }}</code>
                </el-form-item>
                <!-- Crontab配置结束 -->

                <el-form-item label="有效期至" prop="expireTime">
                  <el-date-picker class="expire-time-input"
                    v-model="form.expireTime"
                    type="datetime"
                    placeholder="选择有效期"
                    align="left"
                    format="yyyy-MM-dd HH:mm"
                    :clearable="true"
                    :picker-options="datetimePickerOptions">
                  </el-date-picker>
                </el-form-item>

                <el-form-item label="备注">
                  <el-input
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="200"
                    show-word-limit
                    v-model="form.note"></el-input>
                  <InfoBlock title="介绍当前自动触发配置的作用、功能、目的等"></InfoBlock>
                </el-form-item>

                <el-form-item>
                  <el-button v-if="mode === 'setup'" @click="deleteData">删除自动触发配置</el-button>
                  <div class="setup-right">
                    <el-button type="primary" @click="submitData">保存</el-button>
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
          <el-col :span="9" class="hidden-md-and-down">
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'CrontabConfigSetup',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();

        switch(this.mode) {
          case 'add':
            const defaultFormCrontab = {
              weeks  : ['*'],
              months : ['*'],
              days   : ['*'],
              hours  : ['*'],
              minutes: ['*/5'],
            };
            this.formCrontabCache = this.T.jsonCopy(defaultFormCrontab);
            this.formCrontab      = this.T.jsonCopy(defaultFormCrontab);
            this.T.jsonClear(this.form);
            this.data = {};
            break;

          case 'setup':
            break;
        }
      },
    },
  },
  methods: {
    async loadData() {
      if (this.mode === 'setup') {
        let apiRes = await this.T.callAPI_getOne('/api/v1/crontab-configs/do/list', this.$route.params.id, {
          alert: {entity: '自动触发配置', showError: true},
        });
        if (!apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        nextForm.funcCallKwargsJSON = JSON.stringify(nextForm.funcCallKwargsJSON, null, 2);
        this.form = nextForm;

        if (this.data.crontab) {
          // 拆分Crontab
          this.data.crontab.split(' ').forEach((d, index) => {
            let f = this.CRONTAB_PARTS_MAP[index];
            this.formCrontab[f] = d.split(',');
          });
          this.formCrontabCache = this.T.jsonCopy(this.formCrontab);
        }
      }

      // 获取关联数据
      let scriptSetMap = {};
      let scriptMap    = {};
      let funcMap      = {};

      // 脚本集
      let apiRes = await this.T.callAPI_allPage('/api/v1/script-sets/do/list', {
        query: {fieldPicking: ['id', 'title']},
        alert: {entity: '脚本集', showError: true},
      });
      if (!apiRes.ok) return;

      apiRes.data.forEach(d => {
        scriptSetMap[d.id] = {
          label   : d.title || d.id,
          children: [],
        };
      });

      // 脚本
      apiRes = await this.T.callAPI_allPage('/api/v1/scripts/do/list', {
        query: {fieldPicking: ['id', 'title', 'scriptSetId']},
        alert: {entity: '脚本', showError: true},
      });
      if (!apiRes.ok) return;

      apiRes.data.forEach(d => {
        scriptMap[d.id] = {
          label   : d.title || d.id,
          children: [],
        };

        // 插入上一层"children"
        if (scriptSetMap[d.scriptSetId]) {
          scriptSetMap[d.scriptSetId].children.push(scriptMap[d.id]);
        }
      });

      // 函数
      apiRes = await this.T.callAPI_allPage('/api/v1/funcs/do/list', {
        query: {fieldPicking: ['id', 'title', 'definition', 'scriptSetId', 'scriptId', 'argsJSON', 'kwargsJSON', 'extraConfigJSON']},
        alert: {entity: '函数', showError: true},
      });
      if (!apiRes.ok) return;

      apiRes.data.forEach(d => {
        let isFixedCrontab = false;
        if (d.extraConfigJSON && d.extraConfigJSON.fixedCrontab) {
          isFixedCrontab = true;
        }

        let title = `${d.title || d.definition}`;
        if (isFixedCrontab) title += ` (固定Crontab)`;

        funcMap[d.id] = {
          label         : title,
          value         : d.id,
          argsJSON      : d.argsJSON,
          kwargsJSON    : d.kwargsJSON,
          isFixedCrontab: isFixedCrontab,
        };

        // 插入上一层"children"
        if (scriptMap[d.scriptId]) {
          scriptMap[d.scriptId].children.push(funcMap[d.id]);
        }
      });

      let funcCascaderOptions = Object.values(scriptSetMap);

      this.funcCascaderOptions = funcCascaderOptions;
      this.funcMap             = funcMap;
      this.$store.commit('updateLoadStatus', true);
    },
    async submitData() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      switch(this.mode) {
        case 'add':
          return await this.addData();
        case 'setup':
          return await this.modifyData();
      }
    },
    async addData() {
      let opt = {
        body : {data: this.T.jsonCopy(this.form)},
        alert: {entity: '自动触发配置', action: '添加', showError: true,
          reasonMap: {
            'EBizCondition.DuplicatedCrontabConfig': '已存在执行函数和执行参数完全相同的自动触发配置<br>注意请勿重复添加',
          }
        }
      };

      // 添加函数调用参数kwargsJSON
      try {
        opt.body.data.funcCallKwargsJSON = JSON.parse(this.form.funcCallKwargsJSON);

      } catch(err) {
        return this.$alert(`调用参数格式不正确<br>${err.toString()}`, `输入检查`, {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '了解',
          type: 'error',
        });
      }

      if (!this.fixedCrontabExpr) {
        // 添加Crontab表达式
        opt.body.data.crontab = this.formCrontabExpr.trim() || null;
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/crontab-configs/do/add', opt);
      if (!apiRes.ok) return;

      this.$store.commit('updateCrontabConfigList_scrollY', null);
      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name: 'crontab-config-list',
        query: this.T.unpackRouteQuery(this.$route.query.prevRouteQuery),
      });
    },
    async modifyData() {
      let opt = {
        params: {id: this.$route.params.id},
        body  : {data: this.T.jsonCopy(this.form)},
        alert : {entity: '自动触发配置', action: '修改', showError: true,
          reasonMap: {
            'EBizCondition.DuplicatedCrontabConfig': '已存在执行函数和执行参数完全相同的自动触发配置<br>注意请勿重复添加',
          }
        }
      };

      // 添加函数调用参数kwargsJSON
      try {
        opt.body.data.funcCallKwargsJSON = JSON.parse(this.form.funcCallKwargsJSON);
      } catch(err) {
        return this.$alert(`调用参数不是正确的JSON格式<br>${err.toString()}`, `输入检查`, {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '了解',
          type: 'error',
        });
      }

      if (!this.fixedCrontabExpr) {
        // 添加Crontab表达式
        opt.body.data.crontab = this.formCrontabExpr.trim() || null;
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/crontab-configs/:id/do/modify', opt);
      if (!apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name: 'crontab-config-list',
        query: this.T.unpackRouteQuery(this.$route.query.prevRouteQuery),
      });
    },
    async deleteData() {
      try {
        await this.$confirm('删除自动触发配置后，函数将不会自动执行<hr class="br">是否确认删除？', '删除自动触发配置', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning',
        });

      } catch(err) {
        return; // 取消操作
      }

      let apiRes = await this.T.callAPI('/api/v1/crontab-configs/:id/do/delete', {
        params: {id: this.$route.params.id},
        alert : {entity: '自动触发配置', action: '删除', showError: true},
      });
      if (!apiRes.ok) return;

      this.$router.push({
        name: 'crontab-config-list',
        query: this.T.unpackRouteQuery(this.$route.query.prevRouteQuery),
      });
    },
    autoFillFuncCallKwargsJSON(funcId) {
      let selectedNodes = this.$refs.funcCascader.getCheckedNodes(true);
      if (selectedNodes.length <= 0) return;

      let node = selectedNodes[0];

      // 自动填充调用参数
      let parameters = node.data.argsJSON || Object.keys(node.data.kwargsJSON);

      let example = {};
      parameters.forEach(p => {
        if (p.indexOf('**') === 0) {
          // 暂定：不展示**kwargs参数
        } else {
          example[p] = p.toUpperCase();
        }
      });

      this.form.funcCallKwargsJSON = JSON.stringify(example, null, 2);
    },
    autoFixCrontab() {
      let sortFunc = (a, b) => {
        return parseInt(a) - parseInt(b);
      }

      ['weeks', 'months', 'days', 'hours', 'minutes'].forEach(part => {
        let defaultExpr = this[part.toUpperCase()][0].expr;

        let oldPart = this.formCrontabCache[part];
        let newPart = this.formCrontab[part];
        if (oldPart.length + newPart.length > 0 && oldPart.join(',') === newPart.join(',')) return;

        if (newPart.length <= 0) {
          this.formCrontab[part] = [defaultExpr];
        } else if (newPart.length >= 2 && newPart.indexOf(defaultExpr) >= 0) {
          if (oldPart.indexOf(defaultExpr) >= 0) {
            this.formCrontab[part].splice(newPart.indexOf(defaultExpr), 1);
          } else {
            this.formCrontab[part] = [defaultExpr];
          }
        }

        this.formCrontabCache[part].sort(sortFunc);
        this.formCrontab[part].sort(sortFunc);
      });

      this.formCrontabCache = this.T.jsonCopy(this.formCrontab);
    },
    getNumberList(fixedItems, start, end, step) {
      step = step || 1;

      let list = fixedItems || [];
      for (let i = start; i <= end; i+=step) {
        list.push({
          expr: i.toString(),
          name: this.T.padZero(i, 2),
        });
      }
      return list;
    },
  },
  computed: {
    mode() {
      return this.$route.name.split('-').pop();
    },
    modeName() {
      const nameMap = {
        setup: '配置',
        add  : '添加',
      };
      return nameMap[this.mode];
    },
    apiCustomKwargsSupport() {
      let funcId = this.form.funcId;
      if (!funcId) return false;

      for (let k in this.funcMap[funcId].kwargsJSON) {
        if (k.indexOf('**') === 0) return true;
      }
      return false;
    },
    fixedCrontabExpr() {
      let selectedFunc = this.funcMap[this.form.funcId];
      if (selectedFunc
          && selectedFunc.extraConfigJSON
          && selectedFunc.extraConfigJSON.fixedCrontab) {
        return selectedFunc.extraConfigJSON.fixedCrontab;
      } else {
        return null;
      }
    },
    fixedCrontabExprParts() {
      if (!this.fixedCrontabExpr) {
        return null;
      } else {
        let _parts = this.fixedCrontabExpr.split(' ');
        return {
          weeks  : _parts[4],
          months : _parts[3],
          days   : _parts[2],
          hours  : _parts[1],
          minutes: _parts[0],
        };
      }
    },
    formCrontabExprParts() {
      return {
        weeks  : this.formCrontab.weeks.join(','),
        months : this.formCrontab.months.join(','),
        days   : this.formCrontab.days.join(','),
        hours  : this.formCrontab.hours.join(','),
        minutes: this.formCrontab.minutes.join(','),
      };
    },
    formCrontabExpr() {
      return [
        this.formCrontabExprParts.minutes,
        this.formCrontabExprParts.hours,
        this.formCrontabExprParts.days,
        this.formCrontabExprParts.months,
        this.formCrontabExprParts.weeks,
      ].join(' ').trim();
    },
    datetimePickerOptions() {
      const now = new Date().getTime();
      const shortcutDaysList = [1, 3, 7, 30, 90, 365];
      let shortcuts = [];
      shortcutDaysList.forEach((days) => {
        const date = new Date();
        date.setTime(now + 3600 * 24 * days * 1000);

        shortcuts.push({
          text: `${days}天`,
          onClick(picker) {
            picker.$emit('pick', date)
          }
        });
      });

      return {
        shortcuts: shortcuts
      }
    },
  },
  props: {
  },
  data() {
    const CRONTAB_PARTS_MAP = {
      0: 'minutes',
      1: 'hours',
      2: 'days',
      3: 'months',
      4: 'weeks',
    };
    const WEEKS = [
      {expr: '*', name: '不限星期'},
      {expr: '0', name: '日'},
      {expr: '1', name: '一'},
      {expr: '2', name: '二'},
      {expr: '3', name: '三'},
      {expr: '4', name: '四'},
      {expr: '5', name: '五'},
      {expr: '6', name: '六'},
    ];
    const MONTHS = this.getNumberList([
        {expr: '*', name: '每月'}
      ], 1, 12);
    const DAYS = this.getNumberList([
        {expr: '*', name: '每天'}
      ], 1, 31);
    const HOURS = this.getNumberList([
        {expr: '*', name: '每小时'}
      ], 0, 23);
    const MINUTES = this.getNumberList([
        {expr: '*', name: '每分钟'},
        {expr: '*/5', name: '每5分钟'},
        {expr: '*/15', name: '每15分钟'},
        {expr: '*/30', name: '每30分钟'},
      ], 0, 59, 5);

    return {
      CRONTAB_PARTS_MAP,
      WEEKS,
      MONTHS,
      DAYS,
      HOURS,
      MINUTES,

      data               : {},
      funcMap            : {},
      funcCascaderOptions: [],

      form: {
        funcId            : null,
        funcCallKwargsJSON: null,
        expireTime        : null,
        note              : null,
        // crontab 单独处理
      },
      formRules: {
        funcId: [
          {
            trigger : 'change',
            message : '请选择执行函数',
            required: true,
          },
        ],
        funcCallKwargsJSON: [
          {
            trigger : 'change',
            message : '请输入调用参数，无参数的直接填写 {}',
            required: true,
          },
          {
            trigger  : 'change',
            message  : '调用参数需要以 JSON 形式填写',
            validator: (rule, value, callback) => {
              try {
                let j = JSON.parse(value);
                if (Array.isArray(j)) {
                  return callback(new Error('调用参数需要以 JSON 形式填写，如 {"arg1": "value1"}'));
                }
                return callback();

              } catch(err) {
                return callback(new Error('调用参数需要以 JSON 形式填写，无参数的直接填写 {}'));
              }
            },
          }
        ],
      },

      formCrontabCache: {
        weeks  : [],
        months : [],
        days   : [],
        hours  : [],
        minutes: [],
      },
      formCrontab: {
        weeks  : [],
        months : [],
        days   : [],
        hours  : [],
        minutes: [],
      },
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.func-cascader-input {
  width: 400px;
}
.crontab-expr-parts {
  font-size: xx-large;
  margin-right: 20px;
}
.crontab-expr-parts-weeks {
  color: brown;
}
.crontab-expr-parts-months {
  color: red;
}
.crontab-expr-parts-days {
  color: seagreen;
}
.crontab-expr-parts-hours {
  color: magenta;
}
.crontab-expr-parts-minutes {
  color: orange;
}

.el-checkbox {
  margin-left : 5px !important;
  margin-right: 0 !important;
}
</style>
