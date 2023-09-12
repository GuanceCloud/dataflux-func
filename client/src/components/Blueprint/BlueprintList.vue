<i18n locale="zh-CN" lang="yaml">
Blueprint deleted: 蓝图已删除

No Blueprint has ever been added: 从未添加过任何蓝图

Are you sure you want to delete the Blueprint?: 是否确认删除此蓝图？

Add Blueprint to deploy data processing flow in a visualization way: 添加蓝图，使用可视化方式部署数据处理流程
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="common-page-header">
          <h1>{{ $t('Blueprint') }}</h1>
          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>

            <el-button @click="openSetup(null, 'add')" type="primary" size="small">
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
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No Blueprint has ever been added') }}</h1>

          <p class="no-data-tip">
            {{ $t('Add Blueprint to deploy data processing flow in a visualization way') }}
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="T.getHighlightRowCSS">

          <el-table-column label="ID" width="220">
            <template slot-scope="scope">
              <code class="text-main text-small">{{ scope.row.id }}</code>
              <CopyButton :content="scope.row.id" />
            </template>
          </el-table-column>

          <el-table-column :label="$t('Title')">
            <template slot-scope="scope">
              <span>{{ scope.row.title }}</span>
            </template>
          </el-table-column>

          <el-table-column width="135">
            <template slot-scope="scope">
              <el-button
                style="width: 100px"
                type="primary"
                size="small"
                plain
                @click="openContents(scope.row)">
                <i class="fa fa-fw fa-th-large"></i>
                {{ $t('Enter') }}
              </el-button>
            </template>
          </el-table-column>

          <el-table-column align="right" width="200">
            <template slot-scope="scope">
              <el-link @click="openSetup(scope.row, 'setup')">{{ $t('Setup') }}</el-link>
              <el-link @click="quickSubmitData(scope.row, 'delete')">{{ $t('Delete') }}</el-link>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <!-- 翻页区 -->
      <Pager :pageInfo="pageInfo" />
      <BlueprintSetup ref="setup" />
    </el-container>
  </transition>
</template>

<script>
import BlueprintSetup from '@/components/Blueprint/BlueprintSetup'

export default {
  name: 'BlueprintList',
  components: {
    BlueprintSetup,
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
    async loadData() {
      let _listQuery = this.dataFilter = this.T.createListQuery({
        fields: [ 'id', 'title', 'createTime' ],
        sort  : [ '-seq' ],
      });

      let apiRes = await this.T.callAPI_get('/api/v1/blueprints/do/list', {
        query: _listQuery,
      });
      if (!apiRes || !apiRes.ok) return;

      this.data = apiRes.data;
      this.pageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
    async quickSubmitData(d, operation) {
      switch(operation) {
        case 'delete':
          if (!await this.T.confirm(this.$t('Are you sure you want to delete the Blueprint?'))) return;
          break;
      }

      let apiRes = null;
      switch(operation) {
        case 'delete':
          apiRes = await this.T.callAPI('/api/v1/blueprints/:id/do/delete', {
            params: { id: d.id },
            alert : { okMessage: this.$t('Blueprint deleted') },
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', d.id);

      await this.loadData();
    },
    openSetup(d, target) {
      switch(target) {
        case 'add':
          this.$refs.setup.loadData();
          break;

        case 'setup':
          this.$store.commit('updateHighlightedTableDataId', d.id);
          this.$refs.setup.loadData(d.id);
          break;
      }
    },
    openContents(d) {
      let nextRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateHighlightedTableDataId', d.id);

      this.$router.push({
        name  : 'blueprint-canvas',
        params: { id: d.id },
        query : nextRouteQuery,
      });
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
  created() {
    this.$root.$on('reload.blueprintList', this.loadData);
  },
  destroyed() {
    this.$root.$off('reload.blueprintList');
  },
}
</script>

<style scoped>
</style>

<style>
</style>
