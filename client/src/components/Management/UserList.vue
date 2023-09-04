<i18n locale="en" lang="yaml">
sessionCount: '{n} session | {n} sessions'
lastAccess : 'Accessed {t}'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Session: 会话

User disabled: 用户已禁用
User enabled : 用户已启用

No User has ever been added: 从未添加过任何用户

Are you sure you want to disable the User?: 是否确认禁用此用户？

Add members to allow other users to use the platform: 添加成员，允许其他用户使用本平台

sessionCount: '{n} 个会话'
lastAccess : '{t}访问'
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="common-page-header">
          <h1>{{ $t('User Manage') }}</h1>
          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>

            <el-button v-if="$store.getters.isAdmin"
              @click="openSetup(null, 'add')" type="primary" size="small">
              <i class="fa fa-fw fa-plus"></i>
              {{ $t('New') }}
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()"><i class="fa fa-fw fa-search"></i>{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No User has ever been added') }}</h1>

          <p class="no-data-tip">
            {{ $t('Add members to allow other users to use the platform') }}
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="T.getHighlightRowCSS">

          <el-table-column :label="$t('Username')" width="300">
            <template slot-scope="scope">
              <code class="text-main">{{ scope.row.username }}</code>
              <CopyButton :content="scope.row.username" />
            </template>
          </el-table-column>

          <el-table-column :label="$t('Name')" width="300">
            <template slot-scope="scope">
              <span>{{ scope.row.name }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Email')" width="300">
            <template slot-scope="scope">
              <span>{{ scope.row.email }}</span>
            </template>
          </el-table-column>

          <el-table-column>
          </el-table-column>

          <el-table-column :label="$t('Session')" width="350">
            <template slot-scope="scope">
              <template v-if="scope.row.sessions.length > 0">
                <span v-if="scope.row.sessions[0].idleMs < 15 * 60 * 1000" class="text-good"><i class="fa fa-fw fa-circle"></i> {{ $t('Online') }}</span>
                <span v-else class="text-watch"><i class="fa fa-fw fa-circle"></i> {{ $t('Idle') }}</span>
                <el-tooltip v-if="scope.row.sessions.length > 1" effect="dark" placement="right">
                  <div slot="content">
                    <div v-for="s, i in scope.row.sessions">
                      {{ $t('Session') }} <code class="code-font">#{{ i + 1 }}</code>{{ $t(':')}}
                      {{ $t('lastAccess', { t: T.fromNow(s.lastAccessTime) }) }}
                    </div>
                  </div>
                  <span class="text-info">
                    {{ $t('(') }}{{ $tc('sessionCount', scope.row.sessions.length) }}{{ $t(')') }}
                  </span>
                </el-tooltip>

                <br>
                <i class="fa fa-fw fa-mouse-pointer"></i>
                {{ $t('lastAccess', { t: T.fromNow(scope.row.sessions[0].lastAccessTime) }) }}
              </template>
              <template v-else>
                <span class="text-info">
                  <i class="fa fa-fw fa-circle"></i>
                  {{ $t('Offline') }}
                </span>
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Status')" width="100">
            <template slot-scope="scope">
              <span v-if="scope.row.isDisabled" class="text-bad"><i class="fa fa-fw fa-ban"></i> {{ $t('Disabled') }}</span>
              <span v-else class="text-good"><i class="fa fa-fw fa-check"></i> {{ $t('Enabled') }}</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="200">
            <template slot-scope="scope">
              <span v-if="Array.isArray(scope.row.roles) && scope.row.roles.indexOf('sa') >= 0" class="text-bad">{{ $t('Administrator') }}</span>
              <template v-else-if="$store.getters.isAdmin">
                <el-link v-if="scope.row.isDisabled" @click="quickSubmitData(scope.row, 'enable')">{{ $t('Enable') }}</el-link>
                <el-link v-else @click="quickSubmitData(scope.row, 'disable')">{{ $t('Disable') }}</el-link>

                <el-link @click="openSetup(scope.row, 'setup')">{{ $t('Setup') }}</el-link>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'UserList',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      }
    },
    '$store.state.isLoaded': function(val) {
      if (!val) return;

      setImmediate(() => this.T.autoScrollTable());
    },
  },
  methods: {
    async loadData() {
      let _listQuery = this.dataFilter = this.T.createListQuery({
        sort: ['isDisabled', '-seq']
      });

      let apiRes = await this.T.callAPI_get('/api/v1/users/do/list', {
        query: _listQuery,
      });
      if (!apiRes || !apiRes.ok) return;

      this.data = apiRes.data;

      this.$store.commit('updateLoadStatus', true);
    },
    async quickSubmitData(d, operation) {
      switch(operation) {
        case 'disable':
          if (!await this.T.confirm(this.$t('Are you sure you want to disable the User?'))) return;
          break;
      }

      let apiRes = null;
      switch(operation) {
        case 'disable':
          apiRes = await this.T.callAPI('post', '/api/v1/users/:id/do/modify', {
            params: { id: d.id },
            body  : { data: { isDisabled: true } },
            alert : { okMessage: this.$t('User disabled') },
          });
          break;

        case 'enable':
          apiRes = await this.T.callAPI('post', '/api/v1/users/:id/do/modify', {
            params: { id: d.id },
            body  : { data: { isDisabled: false } },
            alert : { okMessage: this.$t('User enabled') },
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', d.id);

      await this.loadData();
    },
    openSetup(d, target) {
      let nextRouteQuery = this.T.packRouteQuery();

      switch(target) {
        case 'add':
          this.$router.push({
            name: 'user-add',
            query: nextRouteQuery,
          });
          break;

        case 'setup':
          this.$store.commit('updateHighlightedTableDataId', d.id);

          this.$router.push({
            name  : 'user-setup',
            params: { id: d.id },
            query : nextRouteQuery,
          });
          break;
      }
    },
  },
  computed: {
  },
  props: {
  },
  data() {
    let _dataFilter = this.T.createListQuery();

    return {
      data: [],

      dataFilter: {
        _fuzzySearch: _dataFilter._fuzzySearch,
      },
    }
  },
}
</script>

<style scoped>
</style>
<style>
</style>
