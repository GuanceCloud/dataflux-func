<i18n locale="en" lang="yaml">
andMoreConfigs: 'and {n} more config | and {n} more configs'
andMoreUsers : 'and {n} more user | and {n} more users'
</i18n>

<i18n locale="zh-CN" lang="yaml">
Auth Type: 认证类型
Config   : 配置
No config: 未配置

andMoreConfigs: '以及其他 {n} 项目配置'
andMoreUsers: '以及其他 {n} 个用户'

API Auth deleted: API认证已删除

No API Auth has ever been added: 从未添加过任何API认证

Are you sure you want to delete the API Auth?: 是否确认删除此API认证？
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('API Auth') }}
          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>

            <el-button @click="openSetup(null, 'add')" type="primary" size="small">
              <i class="fa fa-fw fa-plus"></i>
              {{ $t('New') }}
            </el-button>
          </div>
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()">{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else>{{ $t('No API Auth has ever been added') }}</h1>

          <p class="no-data-tip">
            授权链接、批处理的API在默认情况下不需要认证即可访问
            <br>如需要增强安全性，可以创建API认证后，为授权链接、批处理选择所需的API认证
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="T.getHighlightRowCSS">

          <el-table-column :label="$t('Name')">
            <template slot-scope="scope">
              {{ scope.row.name }}
              <template v-if="scope.row.note">
                <br>
                <span class="text-info">&#12288;{{ $t('Note') }}{{ $t(':') }}</span>
                <code class="text-info">{{ scope.row.note }}</code>
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Auth Type')" width="200">
            <template slot-scope="scope">
              {{ C.API_AUTH_MAP.get(scope.row.type).name }}
            </template>
          </el-table-column>

          <el-table-column :label="$t('Config')">
            <template slot-scope="scope">
              <span v-if="scope.row.type === 'fixedField'">
                <span class="text-bad" v-if="T.isNothing(scope.row.configJSON.fields)">
                  {{ $t('No config') }}
                </span>
                <span v-else>
                  {{ C.API_AUTH_FIXED_FIELD_LOCATION_MAP.get(scope.row.configJSON.fields[0].location).name }}
                  <code class="text-code">{{ scope.row.configJSON.fields[0].name }}</code>

                  <span class="more-configs-tip" v-if="scope.row.configJSON.fields.length > 1">
                    <br>&#12288;
                    {{ $tc('andMoreConfigs', scope.row.configJSON.fields.length - 1) }}
                  </span>
                </span>
              </span>

              <span v-else-if="scope.row.type === 'httpBasic' || scope.row.type === 'httpDigest'">
                <span class="text-bad" v-if="T.isNothing(scope.row.configJSON.users)">
                  {{ $t('No config') }}
                </span>
                <span v-else>
                  {{ $t('User') }}
                  <code class="text-code">{{ scope.row.configJSON.users[0].username }}</code>
                  <span class="more-configs-tip" v-if="scope.row.configJSON.users.length > 1">
                    <br>&#12288;
                    {{ $tc('andMoreUsers', scope.row.configJSON.users.length - 1) }}
                  </span>
                </span>
              </span>

              <FuncInfo v-else-if="scope.row.type === 'func'"
                :id="scope.row.func_id"
                :title="scope.row.func_title"
                :name="scope.row.func_name"></FuncInfo>
            </template>
          </el-table-column>

          <el-table-column align="right" width="300">
            <template slot-scope="scope">
              <el-button :disabled="scope.row.type === 'func' && T.isNothing(scope.row.func_id)" @click="openSetup(scope.row, 'setup')" type="text">{{ $t('Setup') }}</el-button>

              <el-button @click="quickSubmitData(scope.row, 'delete')" type="text">{{ $t('Delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <!-- 翻页区 -->
      <Pager :pageInfo="pageInfo"></Pager>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'APIAuthList',
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
      let _listQuery = this.dataFilter = this.T.createListQuery();

      let apiRes = await this.T.callAPI_get('/api/v1/api-auth/do/list', {
        query: _listQuery,
      });
      if (!apiRes.ok) return;

      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
    async quickSubmitData(d, operation) {
      switch(operation) {
        case 'delete':
          if (!await this.T.confirm(this.$t('Are you sure you want to delete the API Auth?'))) return;
          break;
      }

      let apiRes = null;
      switch(operation) {
        case 'delete':
          apiRes = await this.T.callAPI('/api/v1/api-auth/:id/do/delete', {
            params: { id: d.id },
            alert : { okMessage: this.$t('API Auth deleted') },
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', d.id);

      await this.loadData();
    },
    openSetup(d, target) {
      let nextRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateTableList_scrollY');
      switch(target) {
        case 'add':
          this.$router.push({
            name : 'api-auth-add',
            query: nextRouteQuery,
          })
          break;

        case 'setup':
          this.$store.commit('updateHighlightedTableDataId', d.id);

          this.$router.push({
            name  : 'api-auth-setup',
            params: {id: d.id},
            query : nextRouteQuery,
          })
          break;
      }
    },
  },
  computed: {
  },
  props: {
  },
  data() {
    let _pageInfo   = this.T.createPageInfo();
    let _dataFilter = this.T.createListQuery();

    return {
      data    : [],
      pageInfo: _pageInfo,

      dataFilter: {
        _fuzzySearch: _dataFilter._fuzzySearch,
      },
    }
  },
}
</script>

<style scoped>
.more-configs-tip {
  font-style: italic;
  color: #aaa;
}
</style>

<style>
</style>
