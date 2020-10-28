<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ modeName }}授权链接
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
                  <InfoBlock title="函数参数指定为&quot;FROM_PARAMETER&quot;表示允许调用者传递本参数"></InfoBlock>

                  <InfoBlock v-if="apiCustomKwargsSupport" type="success" title="本函数允许传递额外自定义的参数"></InfoBlock>
                </el-form-item>

                <el-form-item label="启用" prop="isDisabled">
                  <el-switch
                    :active-value="false"
                    :inactive-value="true"
                    v-model="form.isDisabled">
                  </el-switch>
                </el-form-item>

                <el-form-item label="显示于文档" prop="showInDoc">
                  <el-switch
                    v-model="form.showInDoc">
                  </el-switch>
                </el-form-item>

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

                <template v-for="(opt, index) in C.AUTH_LINK_THROTTLING">
                  <el-form-item :label="index === 0 ? '限流' : ''" :prop="`throttlingJSON.${opt.key}`">
                    <el-input-number class="throttling-input"
                      :min="1"
                      :step="1"
                      :step-strictly="true"
                      v-model="form.throttlingJSON[opt.key]"></el-input-number>
                    <span class="throttling-unit">{{ opt.name }} </span>
                    <el-link class="throttling-clear"
                      :underline="false"
                      @click.stop="form.throttlingJSON[opt.key] = undefined">清除</el-link>
                  </el-form-item>
                </template>

                <el-form-item label="备注">
                  <el-input
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 2}"
                    maxlength="200"
                    show-word-limit
                    v-model="form.note"></el-input>
                  <InfoBlock title="介绍当前授权链接的作用、功能、目的等"></InfoBlock>
                </el-form-item>

                <el-form-item>
                  <el-button v-if="mode === 'setup'" @click="deleteData">删除授权链接</el-button>
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
  name: 'AuthLinkSetup',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();

        switch(this.mode) {
          case 'add':
            this.T.jsonClear(this.form);
            this.form.throttlingJSON = {};
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
        let apiRes = await this.T.callAPI_getOne('/api/v1/auth-links/do/list', this.$route.params.id, {
          alert: {entity: '授权链接', showError: true},
        });
        if (!apiRes.ok) return;

        this.data = apiRes.data;

        let nextForm = {};
        Object.keys(this.form).forEach(f => nextForm[f] = this.data[f]);
        nextForm.funcCallKwargsJSON = JSON.stringify(nextForm.funcCallKwargsJSON, null, 2);
        nextForm.throttlingJSON = nextForm.throttlingJSON || {};
        this.form = nextForm;
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
        query: {fieldPicking: ['id', 'title', 'definition', 'scriptSetId', 'scriptId', 'argsJSON', 'kwargsJSON']},
        alert: {entity: '函数', showError: true},
      });
      if (!apiRes.ok) return;

      apiRes.data.forEach(d => {
        funcMap[d.id] = {
          label     : d.title || d.definition,
          value     : d.id,
          argsJSON  : d.argsJSON,
          kwargsJSON: d.kwargsJSON,
        };

        // 插入上一层"children"
        if (scriptMap[d.scriptId]) {
          scriptMap[d.scriptId].children.push(funcMap[d.id]);
        }
      });

      let funcCascaderOptions = Object.values(scriptSetMap);

      this.funcMap             = funcMap;
      this.funcCascaderOptions = funcCascaderOptions;
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
        alert: {entity: '授权链接', action: '添加', showError: true},
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

      let apiRes = await this.T.callAPI('post', '/api/v1/auth-links/do/add', opt);
      if (!apiRes.ok) return;

      this.$store.commit('updateAuthLinkList_scrollY', null);
      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name : 'auth-link-list',
        query: this.T.unpackRouteQuery(this.$route.query.prevRouteQuery),
      });
    },
    async modifyData() {
      let opt = {
        params: {id: this.$route.params.id},
        body  : {data: this.T.jsonCopy(this.form)},
        alert : {entity: '授权链接', action: '修改', showError: true},
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

      let apiRes = await this.T.callAPI('post', '/api/v1/auth-links/:id/do/modify', opt);
      if (!apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);

      this.$router.push({
        name : 'auth-link-list',
        query: this.T.unpackRouteQuery(this.$route.query.prevRouteQuery),
      });
    },
    async deleteData() {
      try {
        await this.$confirm('删除授权链接可能导致依赖此链接的系统无法正常工作<hr class="br">是否确认删除？', '删除授权链接', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning',
        });

      } catch(err) {
        return; // 取消操作
      }

      let apiRes = await this.T.callAPI('/api/v1/auth-links/:id/do/delete', {
        params: {id: this.$route.params.id},
        alert : {entity: '授权链接', action: '删除', showError: true},
      });
      if (!apiRes.ok) return;

      this.$router.push({
        name : 'auth-link-list',
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
          example[p] = 'FROM_PARAMETER';
        }
      });

      this.form.funcCallKwargsJSON = JSON.stringify(example, null, 2);
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
    return {
      data               : {},
      funcMap            : {},
      funcCascaderOptions: [],

      form: {
        funcId            : null,
        funcCallKwargsJSON: null,
        expireTime        : null,
        throttlingJSON    : {},
        showInDoc         : false,
        isDisabled        : false,
        note              : null,
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
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.func-cascader-input {
  width: 400px;
}
.expire-time-input {
  width: 400px;
}
.throttling-input {
  width: 260px;
}
.throttling-unit {
  color: grey;
  padding-left: 10px;
}
.throttling-unit > span {
  width: 35px;
  display: inline-block;
}
.throttling-clear {
  float: right
}
</style>
