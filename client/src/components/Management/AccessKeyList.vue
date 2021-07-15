<i18n locale="zh-CN" lang="yaml">
Delete Access Key: 删除 AccessKey

Search Access Key(ID, name): 搜索Access Key（ID、名称）
No Access Key has ever been added: 从未添加过任何授权链接

Are you sure you want to delete the Access Key?: 是否确认删除此AccessKey？
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          Access Key
          <div class="header-control">
            <FuzzySearchInput
              :dataFilter="dataFilter"
              :searchTip="$t('Search Access Key(ID, name)')">
            </FuzzySearchInput>

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
          <h1 class="no-data-title" v-else>{{ $t('No Access Key has ever been added') }}</h1>

          <p class="no-data-tip">
            添加Access Key，允许外部系统调用本平台的接口进行管理
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="highlightRow">

          <el-table-column :label="$t('Name')">
            <template slot-scope="scope">
              <span>{{ scope.row.name }}</span>
            </template>
          </el-table-column>

          <el-table-column label="Access Key ID">
            <template slot-scope="scope">
              <code class="text-code text-small">{{ scope.row.id }}</code><CopyButton :content="scope.row.id"></CopyButton>
            </template>
          </el-table-column>

          <el-table-column label="Access Key Secret">
            <template slot-scope="scope">
              <template v-if="!showSecretMap[scope.row.id]">
                <el-button @click="showSecret(scope.row)" type="text">{{ $t('Show') }}</el-button>
              </template>
              <template v-else>
                <code class="text-code text-small">{{ scope.row.secret }}</code><CopyButton :content="scope.row.secret"></CopyButton>
              </template>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Create Time')" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.createTime | datetime }}</span>
              <br>
              <span class="text-info">{{ scope.row.createTime | fromNow }}</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="200">
            <template slot-scope="scope">
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
  name: 'AccessKeyList',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      }
    },
  },
  methods: {
    highlightRow({row, rowIndex}) {
      return (this.$store.state.highlightedTableDataId === row.id) ? 'hl-row' : '';
    },
    async loadData() {
      let apiRes = await this.T.callAPI_get('/api/v1/access-keys/do/list', {
        query: this.T.createListQuery({
          fields: [ 'id', 'userId', 'name', 'secret', 'createTime' ],
          sort  : [ '-seq' ],
        }),
      });
      if (!apiRes.ok) return;

      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
    async quickSubmitData(d, operation) {
      switch(operation) {
        case 'delete':
          if (!await this.T.confirm(this.$t('Are you sure you want to delete the Access Key?'))) return;
          break;
      }

      let apiRes = null;
      switch(operation) {
        case 'delete':
          apiRes = await this.T.callAPI('/api/v1/access-keys/:id/do/delete', {
            params: { id: d.id },
            alert : { okMessage: this.$t('Access Key deleted') },
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', d.id);

      await this.loadData();
    },
    openSetup(d, target) {
      let prevRouteQuery = this.T.packRouteQuery();

      switch(target) {
        case 'add':
          this.$router.push({
            name: 'access-key-add',
            query: prevRouteQuery,
          });
          break;
      }
    },
    showSecret(d) {
      this.$set(this.showSecretMap, d.id, true);
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

      showSecretMap: {},
    }
  },
}
</script>

<style scoped>
</style>

<style>
</style>
