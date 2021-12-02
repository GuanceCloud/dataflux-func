<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          脚本包导出历史
          <div class="header-control">
            <el-button @click="openSetup(null, 'export')" size="small">
              <i class="fa fa-fw fa-cloud-download"></i>
              导出脚本包
            </el-button>
          </div>
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()">当前过滤条件无匹配数据</h1>
          <h1 class="no-data-title" v-else>从未导出或安装过脚本包</h1>

          <p class="no-data-tip">
            如需备份、分发脚本集，可以使用导出功能
            <br>导出后的文件，可在系统的「脚本包导入」功能中进行导入
          </p>
        </div>
        <template v-else>
          <el-timeline>
            <el-timeline-item
              placement="top"
              size="large"
              v-for="d in data"
              :key="d.id"
              type="primary"
              :timestamp="`${T.getDateTimeString(d.createTime)} (${T.fromNow(d.createTime)})`">
              <el-card shadow="hover" class="history-card">
                <div class="history-summary">
                  <span class="text-info">脚本集：</span>
                  <el-tag size="medium" type="info" v-for="item in d.summaryJSON.scriptSets" :key="item.id">
                    <code>{{ item.title || item.id }}</code>
                  </el-tag>
                </div>

                <div class="history-summary" v-if="!T.isNothing(d.summaryJSON.dataSources)">
                  <span class="text-info">数据源：</span>
                  <el-tag size="medium" type="info" v-for="item in d.summaryJSON.dataSources" :key="item.id">
                    <code>{{ item.title || item.id }}</code>
                  </el-tag>
                </div>
                <div class="history-summary" v-if="!T.isNothing(d.summaryJSON.envVariables)">
                  <span class="text-info">环境变量：</span>
                  <el-tag size="medium" type="info" v-for="item in d.summaryJSON.envVariables" :key="item.id">
                    <code>{{ item.title || item.id }}</code>
                  </el-tag>
                </div>

                <div class="history-note" v-if="d.note">
                  <span class="text-info">备注:</span>
                  <pre class="text-info text-small">{{ d.note }}</pre>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </template>
      </el-main>

    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'ScriptSetExportHistoryList',
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
    async loadData() {
      let apiRes = await this.T.callAPI_get('/api/v1/script-set-export-history/do/list', {
        query: { pageSize: 50 },
      });
      if (!apiRes.ok) return;

      this.data = apiRes.data;

      this.$store.commit('updateLoadStatus', true);
    },
    openSetup(d, target) {
      switch(target) {
        case 'export':
          this.$router.push({
            name: 'script-set-export',
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
    return {
      data: [],
    }
  },
}
</script>

<style scoped>
.history-summary {
  margin-bottom: 5px;
}
.history-title {
  font-size: x-large;
}
.history-card {
  width: 620px;
}
.history-note {
}
.history-note pre {
  margin: 5px 0 0 10px;
  font-weight: normal;
}
</style>

<style>
</style>
