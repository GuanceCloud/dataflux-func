<i18n locale="zh-CN" lang="yaml">
Root: 根目录

File Service disabled: 文件服务已禁用
File Service enabled : 文件服务已启用
File Service deleted : 文件服务已删除

Search File Service(ID, root): 搜索文件服务（ID、根目录）
No File Service has ever been added: 从未添加过任何文件服务

Are you sure you want to disable the File Service?: 是否确认禁用此文件服务？
Are you sure you want to delete the File Service?: 是否确认删除此文件服务？
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
          <h1 class="no-data-title" v-if="T.isPageFiltered({ ignore: { origin: 'API,UI' } })">{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else>{{ $t('No File Service has ever been added') }}</h1>

          <p class="no-data-tip">
            出于安全性考虑，资源目录文件默认不对外提供
            <br>如需从外部直接访问资源目录下文件，必须先为资源目录下的某个文件夹创建文件服务，通过文件服务接口进行访问
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="highlightRow">

          <el-table-column :label="$t('Root')">
            <template slot-scope="scope">
              <code class="file-service-title">{{ scope.row.root }}</code>

              <div>
                <span class="text-info">&#12288;ID</span>
                <code class="text-code text-small">{{ scope.row.id }}</code><CopyButton :content="scope.row.id"></CopyButton>
              </div>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Status')" width="160">
            <template slot-scope="scope">
              <span v-if="scope.row.isDisabled" class="text-bad">{{ $t('Disabled') }}</span>
              <span v-else class="text-good">{{ $t('Enabled') }}</span>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Note')" width="160">
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

              <el-button v-if="scope.row.isDisabled" @click="quickSubmitData(scope.row, 'enable')" type="text">{{ $t('Enable') }}</el-button>
              <el-button v-else @click="quickSubmitData(scope.row, 'disable')" type="text">{{ $t('Disable') }}</el-button>

              <el-button @click="openSetup(scope.row, 'setup')" type="text">{{ $t('Setup') }}</el-button>

              <el-button @click="quickSubmitData(scope.row, 'delete')" type="text">{{ $t('Delete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-main>

    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'FileServiceList',
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

      this.$store.commit('updateLoadStatus', true);
    },
    async quickSubmitData(d, operation) {
      switch(operation) {
        case 'disable':
          if (!await this.T.confirm(this.$t('Are you sure you want to disable the File Service?'))) return;
          break;

        case 'delete':
          if (!await this.T.confirm(this.$t('Are you sure you want to delete the File Service?'))) return;
          break;
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
