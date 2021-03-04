<i18n locale="zh-CN" lang="yaml">
Disable user: 禁用用户
Enable user : 启用用户
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          成员列表
          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>
            <el-button @click="openSetup(null, 'add')" type="primary" size="mini">
              <i class="fa fa-fw fa-plus"></i>
              新建成员
            </el-button>
          </div>
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()">当前过滤条件无匹配数据</h1>
          <h1 class="no-data-title" v-else>从未创建过任何成员</h1>

          <p class="no-data-tip">
            添加成员，允许其他用户使用本平台
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="highlightRow">

          <el-table-column label="登录账号">
            <template slot-scope="scope">
              <code class="text-code text-small">{{ scope.row.username }}</code><CopyButton :content="scope.row.username"></CopyButton>
            </template>
          </el-table-column>

          <el-table-column label="姓名">
            <template slot-scope="scope">
              <span>{{ scope.row.name }}</span>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="100">
            <template slot-scope="scope">
              <span v-if="scope.row.isDisabled" class="text-bad">已禁用</span>
              <span v-else class="text-good">已启用</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="200">
            <template slot-scope="scope">
              <span v-if="$store.getters.isSuperAdmin" class="text-bad">系统管理员</span>
              <template v-else>
                <el-button v-if="scope.row.isDisabled" @click="quickSubmitData(scope.row, 'enable')" type="text" size="small">启用</el-button>
                <el-button v-if="!scope.row.isDisabled" @click="quickSubmitData(scope.row, 'disable')" type="text" size="small">禁用</el-button>

                <el-button @click="openSetup(scope.row, 'setup')" type="text" size="small">编辑</el-button>
              </template>
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
  name: 'UserList',
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
    '$store.state.isLoaded': function(val) {
      if (!val) return;

      setImmediate(() => {
        this.T.autoScrollTable(this.$store.state.UserList_scrollY);
      });
    },
  },
  methods: {
    highlightRow({row, rowIndex}) {
      return (this.$store.state.highlightedTableDataId === row.id) ? 'hl-row' : '';
    },
    async loadData() {
      let apiRes = await this.T.callAPI('/api/v1/users/do/list', {
        query: this.T.createListQuery({ sort: ['seq'] }),
        alert: {showError: true},
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
          case 'disable':
            await this.$confirm(`${operationName}成员会导致此成员无法继续使用系统<hr class="br">是否确认${operationName}？`, `${operationName}成员`,  {
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
        case 'disable':
          apiRes = await this.T.callAPI('post', '/api/v1/users/:id/do/modify', {
            params: {id: d.id},
            body  : {data: {isDisabled: true}},
            alert : {title: this.$t('Disable user'), showError: true},
          });
          break;

        case 'enable':
          apiRes = await this.T.callAPI('post', '/api/v1/users/:id/do/modify', {
            params: {id: d.id},
            body  : {data: {isDisabled: false}},
            alert : {title: this.$t('Enable user'), showError: true},
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', d.id);

      await this.loadData();
    },
    openSetup(d, target) {
      let prevRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateUserList_scrollY', this.T.getTableScrollY());
      switch(target) {
        case 'add':
          this.$router.push({
            name: 'user-add',
            query: prevRouteQuery,
          });
          break;

        case 'setup':
          this.$store.commit('updateHighlightedTableDataId', d.id);

          this.$router.push({
            name  : 'user-setup',
            params: {id: d.id},
            query : prevRouteQuery,
          });
          break;
      }
    },
  },
  computed: {
    OP_NAME_MAP() {
      return {
        disable: '禁用',
        enable : '启用',
      };
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
    }
  },
}
</script>

<style scoped>

</style>

<style>

</style>
