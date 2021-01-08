<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          AccessKey 列表
          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>
            <el-button @click="openSetup(null, 'add')" type="primary" size="mini">
              <i class="fa fa-fw fa-plus"></i>
              新建AccessKey
            </el-button>
          </div>
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()">当前过滤条件无匹配数据</h1>
          <h1 class="no-data-title" v-else>从未创建过任何AccessKey</h1>

          <p class="no-data-tip">
            添加AccessKey，允许外部系统调用本平台的接口进行管理
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="highlightRow">

          <el-table-column label="名称">
            <template slot-scope="scope">
              <span>{{ scope.row.name }}</span>
            </template>
          </el-table-column>

          <el-table-column label="AccessKey ID">
            <template slot-scope="scope">
              <code class="text-code text-small">{{ scope.row.id }}</code><CopyButton :content="scope.row.id"></CopyButton>
            </template>
          </el-table-column>

          <el-table-column label="AccessKey Secret">
            <template slot-scope="scope">
              <template v-if="!showSecretMap[scope.row.id]">
                <el-button @click="showSecret(scope.row)" type="text" size="small">显示</el-button>
              </template>
              <template v-else>
                <code class="text-code text-small">{{ scope.row.secret }}</code><CopyButton :content="scope.row.secret"></CopyButton>
              </template>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.createTime | datetime }}</span>
              <br>
              <span class="text-info">（{{ scope.row.createTime | fromNow }}）</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="200">
            <template slot-scope="scope">
              <el-button @click="quickSubmitData(scope.row, 'delete')" type="text" size="small">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

      <!-- 翻页区 -->
      <el-footer v-if="!T.isNothing(data)"
        class="paging-area" height="45px">
        <el-pagination
          background
          @size-change="T.changePageSize"
          @current-change="T.goToPageNumber"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :current-page="dataPageInfo.pageNumber"
          :page-size="dataPageInfo.pageSize"
          :page-count="dataPageInfo.pageCount"
          :total="dataPageInfo.totalCount">
        </el-pagination>
      </el-footer>
    </el-container>
  </transition>
</template>

<script>
import FuzzySearchInput from '@/components/FuzzySearchInput'

export default {
  name: 'AccessKeyList',
  components: {
    FuzzySearchInput,
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
      let apiRes = await this.T.callAPI('/api/v1/access-keys/do/list', {
        query: this.T.createListQuery({
          fields: ['id', 'userId', 'name', 'secret', 'createTime'],
          sort  : ['-seq'],
        }),
        alert: {entity: 'AccessKey', action: '获取',  showError: true},
      });
      if (!apiRes.ok) return;

      this.data = apiRes.data;
      this.dataPageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
    async quickSubmitData(d, operation) {
      let operationName = this.OP_NAME_MAP[operation];

      try {
        switch(operation) {
          case 'delete':
            await this.$confirm(`${operationName}AccessKey 可能导致相关系统无法正常工作<hr class="br">是否确认${operationName}？`, `${operationName}AccessKey`,  {
              dangerouslyUseHTMLString: true,
              confirmButtonText: `确认${operationName}`,
              cancelButtonText: '取消',
              type: 'warning',
            });
            break;
        }

      } catch(err) {
        return; // 取消操作
      }

      let apiRes = null;
      switch(operation) {
        case 'delete':
          apiRes = await this.T.callAPI('/api/v1/access-keys/:id/do/delete', {
            params: {id: d.id},
            alert : {entity: 'AccessKey', action: '删除', showError: true},
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
    OP_NAME_MAP() {
      return {
        delete : '删除',
      };
    },
    isLoaded() {
      return this.$store.state.isLoaded;
    },
  },
  props: {
  },
  data() {
    let _dataFilter = this.T.createListQuery();

    return {
      data: [],
      dataPageInfo: {
        totalCount: 0,
        pageCount : 0,
        pageSize  : 20,
        pageNumber: 1,
      },

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
