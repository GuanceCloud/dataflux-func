<i18n locale="zh-CN" lang="yaml">
Root: 根目录

File Service disabled: 文件服务已禁用
File Service enabled : 文件服务已启用
File Service deleted : 文件服务已删除

No File Service has ever been added: 从未添加过任何文件服务

Are you sure you want to disable the File Service?: 是否确认禁用此文件服务？
Are you sure you want to delete the File Service?: 是否确认删除此文件服务？

Expose folders in the Resource as File Services to allow external systems to access files directly: 将资源目录下的文件夹创建为文件服务，即可在系统外部直接访问文件
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="common-page-header">
          <h1>{{ $t('File Service') }}</h1>
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
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No File Service has ever been added') }}</h1>

          <p class="no-data-tip">
            {{ $t('Expose folders in the Resource as File Services to allow external systems to access files directly') }}
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="T.getHighlightRowCSS">

          <el-table-column :label="$t('Root')">
            <template slot-scope="scope">
              <code class="file-service-title">{{ scope.row.root }}</code>

              <div>
                <span class="text-info">ID</span>
                &nbsp;<code class="text-main">{{ scope.row.id }}</code>
                <CopyButton :content="scope.row.id" />

                <template v-if="scope.row.note">
                  <br>
                  <span class="text-info">&#12288;{{ $t('Note') }}{{ $t(':') }}</span>
                  <span>{{ scope.row.note }}</span>
                </template>
              </div>
            </template>
          </el-table-column>

          <el-table-column :label="$t('Status')" width="120">
            <template slot-scope="scope">
              <span v-if="scope.row.isDisabled" class="text-bad">{{ $t('Disabled') }}</span>
              <span v-else class="text-good">{{ $t('Enabled') }}</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="260">
            <template slot-scope="scope">
              <el-link :href="scope.row.openURL" target="_blank">{{ $t('Open') }}</el-link>

              <el-link v-if="scope.row.isDisabled" v-prevent-re-click @click="quickSubmitData(scope.row, 'enable')">{{ $t('Enable') }}</el-link>
              <el-link v-else @click="quickSubmitData(scope.row, 'disable')">{{ $t('Disable') }}</el-link>

              <el-link @click="openSetup(scope.row, 'setup')">{{ $t('Setup') }}</el-link>

              <el-link @click="quickSubmitData(scope.row, 'delete')">{{ $t('Delete') }}</el-link>
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

      setImmediate(() => this.T.autoScrollTable());
    },
  },
  methods: {
    async loadData() {
      // 默认过滤条件
      let _listQuery = this.dataFilter = this.T.createListQuery();

      let apiRes = await this.T.callAPI_get('/api/v1/file-services/do/list', {
        query: _listQuery,
      });
      if (!apiRes || !apiRes.ok) return;

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
      let nextRouteQuery = this.T.packRouteQuery();

      this.$store.commit('updateTableList_scrollY');
      switch(target) {
        case 'add':
          this.$router.push({
            name : 'file-service-add',
            query: nextRouteQuery,
          })
          break;

        case 'setup':
          this.$store.commit('updateHighlightedTableDataId', d.id);

          this.$router.push({
            name  : 'file-service-setup',
            params: { id: d.id },
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
