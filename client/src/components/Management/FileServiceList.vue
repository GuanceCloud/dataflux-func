<i18n locale="zh-CN" lang="yaml">
File Service    : 文件服务
New File Service: 新建文件服务

File Service disabled: 文件服务已禁用
File Service enabled : 文件服务已启用
File Service deleted : 文件服务已删除

Search File Service(ID, root): 搜索文件服务（ID、根目录）
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          {{ $t('File Service') }}
          <div class="header-control">
            <FuzzySearchInput
              :dataFilter="dataFilter"
              :searchTip="$t('Search File Service(ID, root)')">
            </FuzzySearchInput>

            <el-button @click="openSetup(null, 'add')" type="primary" size="mini">
              <i class="fa fa-fw fa-plus"></i>
              {{ $t('New File Service') }}
            </el-button>
          </div>
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered({ ignore: { origin: 'API,UI' } })">当前过滤条件无匹配数据</h1>
          <h1 class="no-data-title" v-else>从未创建过任何文件服务</h1>

          <p class="no-data-tip">
            出于安全性考虑，资源目录文件默认不对外提供
            <br>如需从外部直接访问资源目录下文件，必须先为资源目录下的某个文件夹创建文件服务，通过文件服务接口进行访问
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="highlightRow">

          <el-table-column label="文件服务">
            <template slot-scope="scope">
              <code class="file-service-title">{{ scope.row.root }}</code>

              <div>
                <span class="text-info">&#12288;文件服务ID:</span>
                <code class="text-code text-small">{{ scope.row.id }}</code><CopyButton :content="scope.row.id"></CopyButton>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="状态" width="200">
            <template slot-scope="scope">
              <span v-if="scope.row.isDisabled" class="text-bad">已禁用</span>
              <span v-else class="text-good">已启用</span>
            </template>
          </el-table-column>

          <el-table-column label="备注" width="200">
            <template slot-scope="scope">
              <span v-if="scope.row.note" class="text-info text-small">{{ scope.row.note }}</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="260" class-name="fix-list-button">
            <template slot-scope="scope">
              <el-link
                type="primary"
                :href="scope.row.openURL"
                :underline="false"
                target="_blank">{{ $t('Open') }}</el-link>

              <el-button v-if="scope.row.isDisabled" @click="quickSubmitData(scope.row, 'enable')" type="text" size="small">启用</el-button>
              <el-button v-else @click="quickSubmitData(scope.row, 'disable')" type="text" size="small">禁用</el-button>

              <el-button @click="openSetup(scope.row, 'setup')" type="text" size="small">编辑</el-button>

              <el-button @click="quickSubmitData(scope.row, 'delete')" type="text" size="small">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

    </el-container>
  </transition>
</template>

<script>
import FuzzySearchInput from '@/components/FuzzySearchInput'

export default {
  name: 'FileServiceList',
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
        this.T.autoScrollTable(this.$store.state.FileServiceList_scrollY);
      });
    },
  },
  methods: {
    highlightRow({row, rowIndex}) {
      return (this.$store.state.highlightedTableDataId === row.id) ? 'hl-row' : '';
    },
    async loadData() {
      // 默认过滤条件
      let apiRes = await this.T.callAPI_get('/api/v1/file-services/do/list', {
        query: this.T.createListQuery(),
      });
      if (!apiRes.ok) return;

      // 补齐打开路径
      apiRes.data.forEach(d => {
        d.openURL = this.T.formatURL('/api/v1/fs/:id/', {
          baseURL: true,
          params: { id: d.id }
        });
      });

      this.data = apiRes.data;
      this.dataPageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
    async quickSubmitData(d, operation) {
      let operationName = this.OP_NAME_MAP[operation];

      try {
        switch(operation) {
          case 'delete':
          case 'disable':
            await this.$confirm(`${operationName}文件服务可能导致依赖此文件服务的系统无法正常工作<hr class="br">是否确认${operationName}？`, `${operationName}文件服务`,  {
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
          apiRes = await this.T.callAPI('post', '/api/v1/file-services/:id/do/modify', {
            params: { id: d.id },
            body  : { data: { isDisabled: true } },
            alert : { okMessage: this.$t('File Service disabled') },
          });
          break;

        case 'enable':
          apiRes = await this.T.callAPI('post', '/api/v1/file-services/:id/do/modify', {
            params: { id: d.id },
            body  : { data: { isDisabled: false } },
            alert : { okMessage: this.$t('File Service enabled') },
          });
          break;

        case 'delete':
          apiRes = await this.T.callAPI('/api/v1/file-services/:id/do/delete', {
            params: { id: d.id },
            alert : { okMessage: this.$t('File Service deleted') },
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', d.id);

      await this.loadData();
    },
    openSetup(d, target) {
      let prevRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateFileServiceList_scrollY', this.T.getTableScrollY());
      switch(target) {
        case 'add':
          this.$router.push({
            name : 'file-service-add',
            query: prevRouteQuery,
          })
          break;

        case 'setup':
          this.$store.commit('updateHighlightedTableDataId', d.id);

          this.$router.push({
            name  : 'file-service-setup',
            params: {id: d.id},
            query : prevRouteQuery,
          })
          break;
      }
    },
  },
  computed: {
    OP_NAME_MAP() {
      return {
        disable: '禁用',
        enable : '启用',
        delete : '删除',
      };
    },
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
.file-service-title {
  font-size: 16px;
}
</style>

<style>
</style>
