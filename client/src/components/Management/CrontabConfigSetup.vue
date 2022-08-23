<i18n locale="en" lang="yaml">
recentTaskCount: 'recent {n} task | recent {n} tasks'
shortcutDays  : '{n} day | {n} days'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Add Crontab Config  : 添加自动触发配置
Setup Crontab Config: 配置自动触发配置

Func        : 执行函数
Arguments   : 参数指定
Task Info   : 任务信息
Keep        : 保留
Tags        : 标签
Add Tag     : 添加标签
Weekdays    : 按周重复
Months      : 按月重复
Days        : 按天重复
Hours       : 按小时重复
Minutes     : 按分钟重复
Expires     : 有效期
Note        : 备注

'(Fixed Crontab)': （固定Crontab）
Every weekday    : 不限星期
SUN              : 周日
MON              : 周一
TUE              : 周二
WED              : 周三
THU              : 周四
FRI              : 周五
SAT              : 周六
Every month      : 每月
Every day        : 每天
Every hour       : 每小时
Every minute     : 每分钟
Every 5 minutes  : 每5分钟
Every 15 minutes : 每15分钟
Every 30 minutes : 每30分钟

'JSON formated arguments (**kwargs)': 'JSON格式的参数（**kwargs）'
The Func accepts extra arguments not listed above: 本函数允许传递额外的自定义函数参数

Please select Func: 请选择执行函数
'Please input arguments, input "{}" when no argument': '请输入参数，无参数时填写 "{}"'
Only date-time between 1970 and 2037 are allowed: 只能选择1970年至2037年之间的日期
Date-time cannot earlier than 1970: 日期不能早于1970年
Date-time cannot later than 2037: 时间不能晚于2037年

Crontab Config created: 自动触发配置已创建
Crontab Config saved  : 自动触发配置已保存
Crontab Config deleted: 自动触发配置已删除

Are you sure you want to delete the Crontab Config?: 是否确认删除此自动触发配置？
Invalid argument format: 参数格式不正确

recentTaskCount: '{n}个近期任务'
shortcutDays  : '{n}天'
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ pageTitle }} <code class="text-main">{{ data.func_title }}</code></h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" label-width="120px" :model="form" :rules="formRules">
                <el-form-item :label="$t('Func')" prop="funcId">
                  <el-cascader class="func-cascader-input" ref="funcCascader"
                    placeholder="--"
                    filterable
                    :filter-method="common.funcCascaderFilter"
                    v-model="form.funcId"
                    :options="funcCascader"
                    :props="{expandTrigger: 'hover', emitPath: false, multiple: false}"
                    @change="autoFillFuncCallKwargsJSON"></el-cascader>
                </el-form-item>

                <el-form-item :label="$t('Arguments')" prop="funcCallKwargsJSON">
                  <el-input
                    type="textarea"
                    v-model="form.funcCallKwargsJSON"
                    resize="none"
                    :autosize="true"></el-input>
                  <InfoBlock :title="$t('JSON formated arguments (**kwargs)')"></InfoBlock>

                  <InfoBlock v-if="apiCustomKwargsSupport" type="success" :title="$t('The Func accepts extra arguments not listed above')"></InfoBlock>
                </el-form-item>

                <el-form-item :label="$t('Tags')" prop="tagsJSON">
                  <el-tag v-for="t in form.tagsJSON" :key="t" type="warning" size="mini" closable @close="removeTag(t)">{{ t }}</el-tag>
                  <el-input v-if="showAddTag" ref="newTag"
                    v-model="newTag"
                    size="mini"
                    @keyup.enter.native="addTag"
                    @blur="addTag"></el-input>
                  <el-button v-else
                    type="text"
                    @click="openAddTagInput">{{ $t('Add Tag') }}</el-button>
                </el-form-item>

                <el-form-item :label="$t('Task Info')">
                  <span class="task-info-limit-prefix">{{ $t('Keep') }} </span>
                  <el-input-number class="task-info-limit-input" v-if="fixedTaskInfoLimit"
                    :disabled="true"
                    :value="fixedTaskInfoLimit"></el-input-number>
                  <el-input-number class="task-info-limit-input" v-else
                    :min="$store.getters.CONFIG('_TASK_INFO_MIN_LIMIT')"
                    :max="$store.getters.CONFIG('_TASK_INFO_MAX_LIMIT')"
                    :step="10"
                    :precision="0"
                    v-model="form.taskInfoLimit"></el-input-number>
                  <span class="task-info-limit-unit">{{ $tc('recentTaskCount', form.taskInfoLimit, { n: '' }) }} </span>
                  <el-link class="task-info-limit-clear" type="primary" @click.stop="form.taskInfoLimit = $store.getters.CONFIG('_TASK_INFO_DEFAULT_LIMIT_CRONTAB')">{{ $t('Restore Default') }}</el-link>
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

                  <el-form-item :label="$t('Weekdays')">
                    <el-checkbox-group v-model="formCrontab.weeks">
                      <template v-for="(item, index) in WEEKS">
                        <br v-if="item === 'sep'">
                        <el-checkbox v-else border :key="item.expr" :label="item.expr" @change="autoFixCrontab">{{ item.name }}</el-checkbox>
                      </template>
                    </el-checkbox-group>
                  </el-form-item>

                  <el-form-item :label="$t('Months')">
                    <el-checkbox-group v-model="formCrontab.months">
                      <template v-for="(item, index) in MONTHS">
                        <br v-if="item === 'sep'">
                        <el-checkbox v-else border :key="item.expr" :label="item.expr" @change="autoFixCrontab">{{ item.name }}</el-checkbox>
                      </template>
                    </el-checkbox-group>
                  </el-form-item>

                  <el-form-item :label="$t('Days')">
                    <el-checkbox-group v-model="formCrontab.days">
                      <template v-for="(item, index) in DAYS">
                        <br v-if="item === 'sep'">
                        <el-checkbox v-else border :key="item.expr" :label="item.expr" @change="autoFixCrontab">{{ item.name }}</el-checkbox>
                      </template>
                    </el-checkbox-group>
                  </el-form-item>

                  <el-form-item :label="$t('Hours')">
                    <el-checkbox-group v-model="formCrontab.hours">
                      <template v-for="(item, index) in HOURS">
                        <br v-if="item === 'sep'">
                        <el-checkbox v-else border :key="item.expr" :label="item.expr" @change="autoFixCrontab">{{ item.name }}</el-checkbox>
                      </template>
                    </el-checkbox-group>
                  </el-form-item>

                  <el-form-item :label="$t('Minutes')">
                    <el-checkbox-group v-model="formCrontab.minutes">
                      <template v-for="(item, index) in MINUTES">
                        <br v-if="item === 'sep'">
                        <el-checkbox v-else border :key="item.expr" :label="item.expr" @change="autoFixCrontab">{{ item.name }}</el-checkbox>
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

                <el-form-item :label="$t('Expires')" prop="expireTime">
                  <el-date-picker class="expire-time-input"
                    v-model="form.expireTime"
                    type="datetime"
                    align="left"
                    format="yyyy-MM-dd HH:mm"
                    :clearable="true"
                    :picker-options="datetimePickerOptions">
                  </el-date-picker>
                </el-form-item>

                <el-form-item :label="$t('Note')">
                  <el-input :placeholder="$t('Optional')"
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="200"
                    show-word-limit
                    v-model="form.note"></el-input>
                </el-form-item>

                <el-form-item>
                  <el-button v-if="T.setupPageMode() === 'setup'" @click="deleteData">{{ $t('Delete') }}</el-button>
                  <div class="setup-right">
                    <el-button type="primary" v-prevent-re-click @click="submitData">{{ $t('Save') }}</el-button>
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

        switch(this.T.setupPageMode()) {
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
            this.form.taskInfoLimit = this.$store.getters.CONFIG('_TASK_INFO_DEFAULT_LIMIT_CRONTAB');
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
      if (this.T.setupPageMode() === 'setup') {
        let apiRes = await this.T.callAPI_getOne('/api/v1/crontab-configs/do/list', this.$route.params.id);
        if (!apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        nextForm.funcCallKwargsJSON = JSON.stringify(nextForm.funcCallKwargsJSON, null, 2);
        nextForm.tagsJSON = nextForm.tagsJSON || [];

        if (this.T.isNothing(nextForm.taskInfoLimit)) {
          nextForm.taskInfoLimit = this.$store.getters.CONFIG('_TASK_INFO_DEFAULT_LIMIT_CRONTAB')
        }

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

      // 获取函数列表
      let funcList = await this.common.getFuncList();

      for (var funcId in funcList.map) {
        let f = funcList.map[funcId];
        f.isFixedCrontab = !!(f.extraConfigJSON && f.extraConfigJSON.fixedCrontab);
        if (f.isFixedCrontab) {
          f.label += ' ' + this.$t('(Fixed Crontab)');
        }
      }

      this.funcMap      = funcList.map;
      this.funcCascader = funcList.cascader;
      this.$store.commit('updateLoadStatus', true);
    },
    async submitData() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      switch(this.T.setupPageMode()) {
        case 'add':
          return await this.addData();
        case 'setup':
          return await this.modifyData();
      }
    },
    async addData() {
      let _formData = this.T.jsonCopy(this.form);
      if (this.fixedTaskInfoLimit) {
        _formData.taskInfoLimit = this.fixedTaskInfoLimit;
      }

      let opt = {
        body : { data: _formData },
        alert: { okMessage: this.$t('Crontab Config created') },
      };

      // 添加函数调用参数kwargsJSON
      try {
        opt.body.data.funcCallKwargsJSON = JSON.parse(this.form.funcCallKwargsJSON);
      } catch(err) {
        return this.T.alert(`${this.$t('Invalid argument format')}<br>${err.toString()}`);
      }

      if (!this.fixedCrontabExpr) {
        // 添加Crontab表达式
        opt.body.data.crontab = this.formCrontabExpr.trim() || null;
      }

      let apiRes = await this.T.callAPI('post', '/api/v1/crontab-configs/do/add', opt);
      if (!apiRes.ok) return;

      this.$store.commit('updateTableList_scrollY');
      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name: 'crontab-config-list',
        query: this.T.getPrevQuery(),
      });
    },
    async modifyData() {
      let _formData = this.T.jsonCopy(this.form);
      if (this.fixedTaskInfoLimit) {
        _formData.taskInfoLimit = this.fixedTaskInfoLimit;
      }

      let opt = {
        params: { id: this.$route.params.id },
        body  : { data: _formData },
        alert : { okMessage: this.$t('Crontab Config saved') },
      };

      // 添加函数调用参数kwargsJSON
      try {
        opt.body.data.funcCallKwargsJSON = JSON.parse(this.form.funcCallKwargsJSON);
      } catch(err) {
        return this.T.alert(`${this.$t('Invalid argument format')}<br>${err.toString()}`);
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
        query: this.T.getPrevQuery(),
      });
    },
    async deleteData() {
      if (!await this.T.confirm(this.$t('Are you sure you want to delete the Crontab Config?'))) return;

      let apiRes = await this.T.callAPI('/api/v1/crontab-configs/:id/do/delete', {
        params: { id: this.$route.params.id },
        alert : { okMessage: this.$t('Crontab Config deleted') },
      });
      if (!apiRes.ok) return;

      this.$router.push({
        name: 'crontab-config-list',
        query: this.T.getPrevQuery(),
      });
    },
    autoFillFuncCallKwargsJSON(funcId) {
      // 自动填充调用参数
      let parameters = this.funcMap[funcId].argsJSON
                    || Object.keys(this.funcMap[funcId].kwargsJSON);

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
    removeTag(tag) {
      this.form.tagsJSON.splice(this.form.tagsJSON.indexOf(tag), 1);
    },
    openAddTagInput() {
      this.showAddTag = true;
      this.$nextTick(_ => {
        this.$refs.newTag.$refs.input.focus();
      });
    },
    addTag() {
      let newTag = this.newTag;
      if (newTag) {
        if (!Array.isArray(this.form.tagsJSON)) {
          this.$set(this.form, 'tagsJSON', []);
        }
        this.form.tagsJSON.push(newTag);
      }
      this.showAddTag = false;
      this.newTag     = '';
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
    getNumberList(fixedItems, start, end, step, wrapEach) {
      step = step || 1;

      let list = fixedItems || [];
      let count = 0;
      for (let i = start; i <= end; i+=step) {
        count++;
        list.push({
          expr: i.toString(),
          name: this.T.padZero(i, 2),
        });

        if (count % wrapEach === 0) {
          list.push('sep');
        }
      }
      return list;
    },
  },
  computed: {
    formRules() {
      let errorMessage_funcCallKwargsJSON = this.$t('Please input arguments, input "{}" when no argument');

      return {
        funcId: [
          {
            trigger : 'change',
            message : this.$t('Please select Func'),
            required: true,
          },
        ],
        expireTime: [
          {
            trigger: 'change',
            message  : this.$t('Only date-time between 1970 and 2037 are allowed'),
            validator: (rule, value, callback) => {
              let ts = this.M(value).unix();
              if (ts < this.T.MIN_UNIX_TIMESTAMP) {
                return callback(new Error(this.$t('Date-time cannot earlier than 1970')));
              } else if (ts > this.T.MAX_UNIX_TIMESTAMP) {
                return callback(new Error(this.$t('Date-time cannot later than 2037')));
              }
              return callback();
            },
          }
        ],
        funcCallKwargsJSON: [
          {
            trigger : 'change',
            message : errorMessage_funcCallKwargsJSON,
            required: true,
          },
          {
            trigger  : 'change',
            validator: (rule, value, callback) => {
              try {
                let j = JSON.parse(value);
                if (Array.isArray(j)) {
                  return callback(new Error(errorMessage_funcCallKwargsJSON));
                }
                return callback();

              } catch(err) {
                return callback(new Error(errorMessage_funcCallKwargsJSON));
              }
            },
          }
        ],
      }
    },
    pageTitle() {
      const _map = {
        setup: this.$t('Setup Crontab Config'),
        add  : this.$t('Add Crontab Config'),
      };
      return _map[this.T.setupPageMode()];
    },
    apiCustomKwargsSupport() {
      let funcId = this.form.funcId;
      if (!funcId) return false;
      if (!this.funcMap[funcId]) return false;

      for (let k in this.funcMap[funcId].kwargsJSON) {
        if (k.indexOf('**') === 0) return true;
      }
      return false;
    },
    fixedTaskInfoLimit() {
      let selectedFunc = this.funcMap[this.form.funcId];
      if (selectedFunc
          && selectedFunc.extraConfigJSON
          && selectedFunc.extraConfigJSON.fixedTaskInfoLimit) {
        return selectedFunc.extraConfigJSON.fixedTaskInfoLimit;
      } else {
        return null;
      }
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
          text: this.$tc('shortcutDays', days),
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
      {expr: '*', name: this.$t('Every weekday')},
      'sep',
      {expr: '1', name: this.$t('MON')},
      {expr: '2', name: this.$t('TUE')},
      {expr: '3', name: this.$t('WED')},
      {expr: '4', name: this.$t('THU')},
      {expr: '5', name: this.$t('FRI')},
      'sep',
      {expr: '6', name: this.$t('SAT')},
      {expr: '0', name: this.$t('SUN')},
    ];
    const MONTHS = this.getNumberList([
        {expr: '*', name: this.$t('Every month')},
        'sep',
      ], 1, 12, 1, 6);
    const DAYS = this.getNumberList([
        {expr: '*', name: this.$t('Every day')},
        'sep',
      ], 1, 31, 1, 5);
    const HOURS = this.getNumberList([
        {expr: '*', name: this.$t('Every hour')},
        'sep',
      ], 0, 23, 1, 6);
    const MINUTES = this.getNumberList([
        {expr: '*', name: this.$t('Every minute')},
        'sep',
        {expr: '*/5', name: this.$t('Every 5 minutes')},
        {expr: '*/15', name: this.$t('Every 15 minutes')},
        {expr: '*/30', name: this.$t('Every 30 minutes')},
        'sep',
      ], 0, 59, 5, 6);

    return {
      CRONTAB_PARTS_MAP,
      WEEKS,
      MONTHS,
      DAYS,
      HOURS,
      MINUTES,

      data        : {},
      funcMap     : {},
      funcCascader: [],

      showAddTag : false,
      newTag     : '',

      form: {
        funcId            : null,
        funcCallKwargsJSON: null,
        tagsJSON          : [],
        expireTime        : null,
        taskInfoLimit     : this.$store.getters.CONFIG('_TASK_INFO_DEFAULT_LIMIT_CRONTAB'),
        note              : null,
        // crontab 单独处理
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
  width: 500px;
}
.task-info-limit-input {
  width: 180px;
}
.task-info-limit-prefix {
  color: grey;
  padding-right: 10px;
}
.task-info-limit-unit {
  color: grey;
  padding-left: 10px;
}
.task-info-limit-unit > span {
  width: 35px;
  display: inline-block;
}
.task-info-limit-clear {
  float: right
}
.expire-time-input {
  width: 500px;
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

.el-checkbox.is-bordered {
  margin-left : 5px !important;
  margin-right: 0 !important;
}
</style>
