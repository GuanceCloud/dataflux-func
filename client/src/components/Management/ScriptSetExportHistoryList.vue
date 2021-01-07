<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          脚本包导出历史
          <div class="header-control">
            <el-button @click="openSetup(null, 'export')" size="mini">
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
              :timestamp="`${T.toDateTime(d.createTime)}（${T.fromNow(d.createTime)}）`">
              <el-card shadow="hover" class="history-card">
                <div class="history-summary">
                  <small class="text-info">内容:</small>
                  <p v-for="scriptSet in d.scriptSets" :key="scriptSet.id">
                    &#12288;
                    <el-tag>{{ scriptSet.title || scriptSet.id }}</el-tag>
                    <el-tag size="mini" type="info" v-for="script in scriptSet.scripts" :key="script.id">{{ script.title || script.id }}</el-tag>
                  </p>
                </div>

                <div class="history-note" v-if="d.note">
                  <small class="text-info">备注:</small>
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
      let apiRes = await this.T.callAPI('/api/v1/script-set-export-history/do/list', {
        alert: {entity: '导出历史', showError: true},
      });
      if (!apiRes.ok) return;

      let data = apiRes.data;

      data.forEach(history => {
        let scriptSetMap = {};

        history.summaryJSON.scriptSets.forEach(d => {
          scriptSetMap[d.id] = d;
          scriptSetMap[d.id].scripts = [];
        });
        history.summaryJSON.scripts.forEach(d => {
          if (!scriptSetMap[d.scriptSetId]) return;
          scriptSetMap[d.scriptSetId].scripts.push(d);
        });

        history.scriptSets = Object.values(scriptSetMap);
      });

      this.data = data;

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
    isLoaded() {
      return this.$store.state.isLoaded;
    },
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
.history-title {
  font-size: x-large;
}
.history-card {
  width: 800px;
}
.history-note {
}
.history-note pre {
  margin: 5px 0 0 10px;
  font-weight: normal;
}
.history-summary {
}
.history-summary .el-tag+.el-tag {
  margin-left: 5px;
}
</style>

<style>
</style>
