<i18n locale="en" lang="yaml">
FoundScriptSetCount: 'Scrpt Set not Found | Found {n} Script Set | Found {n} Script Sets'
ScriptCount: 'No Script included | Includes {n} Script | Includes {n} Script'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Install Script Set: 脚本集详情
Publish Script Set: 发布脚本集
Delete Script Set: 删除脚本集

Local       : 本地
Remote      : 远端
Requirements: 依赖项
Publisher   : 发布者
Publish Time: 发布时间
Not Published: 尚未发布
Not Installed: 尚未安装
No corresponding Script Set: 无对应脚本集

Publish Info: 发布信息
Author Name : 作者名称
Author Email: 作者邮箱
Publish Note: 发布说明
Use Current User Profile: 使用当前用户信息

Please input note: 请输入备注
Please input author name: 请输入作者名称
Please input author email: 请输入作者邮箱

Are you sure you want to publish the Script Set to the Script Market?: 是否确认发布脚本集到此脚本市场？
Are you sure you want to delete the Script Set from the Script Market?: 是否确认从脚本市场删除此脚本集？
Are you sure you want to install the Script Set?: 是否确认安装此脚本集？

Script Set published to the Script Market: 脚本集已发布至脚本市场
Script Set deleted from the Script Market: 脚本集已从脚本市场删除
Script Set installed, new Script Set is in effect immediately: 脚本集已安装，新脚本集立即生效\

Installed Script Set requires 3rd party packages, do you want to open PIP tool now?: 导入的脚本集需要第三方包，是否现在前往PIP工具？

No Script Set has ever been published: 尚未发布过任何脚本集到脚本市场

FoundScriptSetCount: '找不到脚本集 | 共找到 {n} 个脚本集 | 共找到 {n} 个脚本集'
ScriptCount: '不包含任何脚本 | 包含 {n} 个脚本 | 包含 {n} 个脚本'
</i18n>

<template>
  <transition name="fade">
    <PageLoading v-if="!$store.state.isLoaded"></PageLoading>
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>
            {{ $t('Script Market') }}
            <code class="text-main">{{ common.getScriptMarketName(scriptMarket) }}</code>
          </span>

          <div class="header-control" v-if="T.notNothing(data)">
            <span class="text-main">{{ $tc('FoundScriptSetCount', filteredData.length) }}</span>
            &#12288;
            <el-input :placeholder="$t('Filter')"
              size="small"
              class="filter-input"
              v-model="filterTEXT">
              <i slot="prefix"
                class="el-input__icon el-icon-close text-main"
                v-if="filterTEXT"
                @click="filterTEXT = ''"></i>
            </el-input>
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(filteredData)">
          <h1 class="no-data-title" v-if="T.notNothing(filterTEXT)"><i class="fa fa-fw fa-search"></i>{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No Script Set has ever been published') }}</h1>

          <p class="no-data-tip">
            发布后的脚本集将在此展示，可以挑选需要的脚本集安装到本地
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="filteredData"
          :row-class-name="T.getHighlightRowCSS">

          <el-table-column>
            <template slot="header" slot-scope="scope">
              <i class="fa fa-fw fa-home"></i>
              {{ $t('Local') }}
            </template>
            <template slot-scope="scope">
              <template v-if="scope.row.local">
                <strong class="script-set-name">
                  {{ scope.row.local.title || scope.row.local.id }}
                </strong>
                <div>
                  <span class="text-info">ID</span>
                  <code class="text-main">{{ scope.row.local.id }}</code>
                  <br>
                  &#12288;{{ $tc('ScriptCount', (scope.row.local.scripts || []).length ) }}
                </div>
              </template>
              <template v-else>
                <i class="text-info">{{ $t('No corresponding Script Set') }}</i>
              </template>
            </template>
          </el-table-column>

          <el-table-column width="100">
            <template slot-scope="scope">
              <span v-if="scriptMarket.isAdmin && scope.row.local"
                :class="scope.row.local && scope.row.remote ? 'text-main' : 'text-info'">
                <i v-for="opacity in [ 0.3, 0.5, 1.0 ]"
                  class="fa fa-angle-right fa-2x"
                  :style="{ opacity: opacity}"></i>
              </span>
              <span v-if="!scriptMarket.isAdmin && scope.row.remote"
                :class="scope.row.local && scope.row.remote ? 'text-main' : 'text-info'">
                <i v-for="opacity in [ 1.0, 0.5, 0.3 ]"
                  class="fa fa-angle-left fa-2x"
                  :style="{ opacity: opacity}"></i>
              </span>
            </template>
          </el-table-column>

          <el-table-column>
            <template slot="header" slot-scope="scope">
              <i class="fa fa-fw fa-cloud"></i>
              {{ $t('Remote') }}
            </template>
            <template slot-scope="scope">
              <template v-if="scope.row.remote">
                <strong class="script-set-name">
                  {{ scope.row.remote.title || scope.row.remote.id }}
                </strong>
                <div>
                  <span class="text-info">ID</span>
                  <code class="text-main">{{ scope.row.remote.id }}</code>
                  <br>
                  &#12288;{{ $tc('ScriptCount', (scope.row.remote.scripts || []).length ) }}
                </div>
              </template>
              <template v-else>
                <i class="text-info" v-if="scriptMarket.isAdmin">{{ $t('Not Published') }}</i>
                <i class="text-info" v-else>{{ $t('No corresponding Script Set') }}</i>
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Publisher')" width="200">
            <template slot-scope="scope">
              <template v-if="scope.row.remote">
                <span>{{ scope.row.remote.exportUser }}</span>
              </template>
            </template>
          </el-table-column>
          <el-table-column :label="$t('Publish Time')" width="200">
            <template slot-scope="scope">
              <template v-if="scope.row.remote">
                <span>{{ scope.row.remote.exportTime | datetime }}</span>
                <br>
                <span class="text-info">{{ scope.row.remote.exportTime | fromNow }}</span>
              </template>
            </template>
          </el-table-column>

          <el-table-column align="right" width="150">
            <template slot-scope="scope">
              <template v-if="scriptMarket.isAdmin">
                <el-link :disabled="!scope.row.local" @click="openDialog(scope.row.local, 'publish')">{{ $t('Publish') }}</el-link>
                <el-link :disabled="!scope.row.remote" @click="openDialog(scope.row.remote, 'delete')">{{ $t('Delete') }}</el-link>
              </template>
              <template v-else>
                <el-link v-if="scope.row.remote" @click="openDialog(scope.row.remote, 'install')">{{ $t('Install') }}</el-link>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <el-dialog
        :title="operationDialogTitle"
        class="operation-detail"
        :visible.sync="showOperation"
        :close-on-click-modal="false"
        close-on-press-escape="false"
        v-loading.fullscreen.lock="isProcessing"
        element-loading-background="rgba(0, 0, 0, 0.3)">
        <el-form ref="form" label-width="100px" :model="form" :rules="formRules">
          <el-form-item :label="$t('Name')">
            <el-input disabled :value="scriptSetToOperate.title"></el-input>
          </el-form-item>
          <el-form-item label="ID">
            <el-input disabled :value="scriptSetToOperate.id"></el-input>
          </el-form-item>
          <el-form-item :label="$t('Description')" v-if="T.notNothing(scriptSetToOperate.description)">
            <el-input disabled
              type="textarea"
              resize="none"
              :autosize="{ minRows: 2 }"
              :value="scriptSetToOperate.description"></el-input>
          </el-form-item>
          <el-form-item :label="$t('Requirements')" v-if="T.notNothing(scriptSetToOperate.requirements)">
            <el-input disabled
              type="textarea"
              resize="none"
              :autosize="{ minRows: 2 }"
              :value="scriptSetToOperate.requirements"></el-input>
          </el-form-item>

          <template v-if="isWriteOperation">
            <el-divider content-position="left"><h3>{{ $t('Publish Info') }}</h3></el-divider>

            <el-form-item :label="$t('Author Name')" prop="author.name">
              <el-input v-model="form.author.name"></el-input>
            </el-form-item>
            <el-form-item :label="$t('Author Email')" prop="author.email">
              <el-input v-model="form.author.email"></el-input>
            </el-form-item>

            <el-form-item :label="$t('Publish Note')" prop="note">
              <el-input
                type="textarea"
                resize="none"
                :autosize="{ minRows: 2 }"
                v-model="form.note"></el-input>
            </el-form-item>

            <el-form-item>
              <el-link type="primary" @click.prevent="useCurrentUserProfile">{{ $t('Use Current User Profile') }}</el-link>
            </el-form-item>
          </template>

        </el-form>

        <div slot="footer" class="dialog-footer">
          <el-button size="small" @click="showOperation = false">{{ $t('Cancel') }}</el-button>
          <el-button size="small" type="primary" @click="submitData(operation)" :loading="isProcessing">{{ operationButtonTitle }}</el-button>
        </div>
      </el-dialog>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'ScriptMarketDetail',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      }
    },
    author: {
      deep: true,
      handler(val) {
        this.$store.commit('updateLastestScriptMarketAuthor', val);
      }
    },
  },
  methods: {
    async loadData() {
      // 获取脚本市场信息
      let apiRes = await this.T.callAPI_getOne('/api/v1/script-markets/do/list', this.$route.params.id);
      if (!apiRes.ok) return;

      this.scriptMarket = apiRes.data;

      // 获取远端脚本集列表
      apiRes = await this.T.callAPI_get('/api/v1/script-markets/:id/script-sets/do/list', {
        params: { id: this.$route.params.id },
      });
      if (!apiRes.ok) return;

      let dataMap = apiRes.data.reduce((acc, x) => {
        acc[x.id] = { remote: x };
        return acc;
      }, {});

      // 获取本地脚本列表
      apiRes = await this.T.callAPI_getAll('/api/v1/scripts/do/list', {
        query: {
          fields: [
            'id',
            'title',
            'scriptSetId',
          ]
        },
      });
      if (!apiRes.ok) return;

      let localScriptMap = apiRes.data.reduce((acc, x) => {
        if (!acc[x.scriptSetId]) {
          acc[x.scriptSetId] = [];
        }
        acc[x.scriptSetId].push(x);
        return acc;
      }, {});

      // 获取本地脚本集列表
      apiRes = await this.T.callAPI_getAll('/api/v1/script-sets/do/list', {
        query: {
          fields: [
            'id',
            'title',
            'description',
            'requirements',
          ]
        },
      });
      if (!apiRes.ok) return;

      apiRes.data.forEach(x => {
        x.scripts = localScriptMap[x.id] || [];

        let d = dataMap[x.id];
        if (d) {
          d.local = x;
        } else if (this.scriptMarket.isAdmin) {
          dataMap[x.id] = { local: x };
        }
      });

      // 生成列表并排序
      var data = Object.values(dataMap);
      data.sort((a, b) => {
        if (a.remote && !b.remote) {
          return -1;
        } else if (!a.remote && b.remote) {
          return 1;
        } else if (a.remote && b.remote) {
          if (a.remote.id < b.remote.id) return -1;
          else if (a.remote.id === b.remote.id) return 0;
          else return 1
        } else {
          if (a.local.id < b.local.id) return -1;
          else if (a.local.id === b.local.id) return 0;
          else return 1
        }
      });
      // 添加搜索关键字
      data.forEach(d => {
        this.T.appendSearchKeywords(d, ['local.id', 'local.title', 'remote.id', 'remote.title'])
      });

      this.data = data;

      this.$store.commit('updateLoadStatus', true);
    },
    useCurrentUserProfile() {
      let userProfile = this.$store.state.userProfile;
      this.form.author = this.T.jsonCopy({
        name : userProfile.name || userProfile.username,
        email: userProfile.email,
      });
    },
    openDialog(scriptSet, operation) {
      this.form.note = null;

      switch(operation) {
        case 'publish':
          this.operationDialogTitle = this.$t('Publish Script Set');
          this.operationButtonTitle = this.$t('Publish');
          break;

        case 'delete':
          this.operationDialogTitle = this.$t('Delete Script Set');
          this.operationButtonTitle = this.$t('Delete');
          break;

        case 'install':
          this.operationDialogTitle = this.$t('Install Script Set');
          this.operationButtonTitle = this.$t('Install');
          break;
      }

      this.operation          = operation;
      this.scriptSetToOperate = scriptSet;
      this.showOperation      = true;
    },
    async submitData(operation) {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      switch(operation) {
        case 'publish':
          if (!await this.T.confirm(this.$t('Are you sure you want to publish the Script Set to the Script Market?'))) return;
          break;

        case 'delete':
          if (!await this.T.confirm(this.$t('Are you sure you want to delete the Script Set from the Script Market?'))) return;
          break;

        case 'install':
          if (!await this.T.confirm(this.$t('Are you sure you want to install the Script Set?'))) return;
          break;
      }

      this.isProcessing = true;

      let apiRes = null;
      switch(operation) {
        case 'publish':
          apiRes = await this.T.callAPI('post', '/api/v1/script-markets/:id/do/publish', {
            params: { id: this.scriptMarket.id },
            body  : {
              scriptSetIds: [ this.scriptSetToOperate.id ],
              mode        : 'add',
              author      : this.form.author,
              note        : this.form.note,
            },
            alert : { okMessage: this.$t('Script Set published to the Script Market') },
          });
          break;

        case 'delete':
          apiRes = await this.T.callAPI('post', '/api/v1/script-markets/:id/do/publish', {
            params: { id: this.scriptMarket.id },
            body  : {
              scriptSetIds: [ this.scriptSetToOperate.id ],
              mode        : 'delete',
              author      : this.form.author,
              note        : this.form.note,
            },
            alert : { okMessage: this.$t('Script Set deleted from the Script Market') },
          });
          break;

        case 'install':
          apiRes = await this.T.callAPI('post', '/api/v1/script-markets/:id/do/install', {
            params: { id: this.scriptMarket.id },
            body  : {
              scriptSetIds: [ this.scriptSetToOperate.id ],
            },
            alert : { okMessage: this.$t('Script Set installed, new Script Set is in effect immediately') },
          });
          break;
      }

      this.isProcessing  = false;
      this.showOperation = false;
      if (!apiRes || !apiRes.ok) return;

      // 跳转 PIP 工具
      if (operation === 'install' && this.T.notNothing(apiRes.data.requirements)) {
        if (await this.T.confirm(this.$t('Installed Script Set requires 3rd party packages, do you want to open PIP tool now?'))) {
          return this.common.goToPIPTools(apiRes.data.requirements);
        }
      }

      await this.loadData();
    },
  },
  computed: {
    isWriteOperation() {
      switch(this.operation) {
        case 'publish':
        case 'delete':
          return true;

        default:
          return false;
      }
    },
    formRules() {
      return {
        note: [
          {
            trigger : 'change',
            message : this.$t('Please input note'),
            required: true,
          },
        ],
        'author.name': [
          {
            trigger : 'change',
            message : this.$t('Please input author name'),
            required: true,
          },
        ],
        'author.email': [
          {
            trigger : 'change',
            message : this.$t('Please input author email'),
            required: true,
          },
        ],
      }
    },
    filteredData() {
      let q = (this.filterTEXT || '').toLowerCase().trim();
      if (!q) {
        return this.data;
      } else {
        return this.T.searchKeywords(q, this.data);
      }
    },
  },
  props: {
  },
  data() {
    let userProfile = this.$store.state.userProfile;
    let pervAuthor = this.T.jsonCopy(this.$store.state.lastestScriptMarketAuthor || {
      name : userProfile.name || userProfile.username,
      email: userProfile.email,
    });

    return {
      data        : [],
      scriptMarket: {},

      showLocalScriptSets: false,

      form: {
        note  : null,
        author: pervAuthor,
      },

      filterTEXT : '',

      scriptSetToOperate: {},
      operation           : null,
      showOperation       : false,
      operationDialogTitle: null,
      operationButtonTitle: null,
      isProcessing        : false,
    }
  },
  mounted() {
    window.vmc = this;
  }
}
</script>

<style scoped>
.filter-input {
  width: 260px;
  display: inline-block;
}
.filter-input input {
  font-size: 14px;
}
.filter-input .el-icon-close {
  cursor: pointer;
  font-weight: bold;
}

.script-set-name {
  font-size: 18px;
  line-height: 25px;
}
</style>

<style>
.operation-detail > .el-dialog {
  width: 620px;
}
</style>
