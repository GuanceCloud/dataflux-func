<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>{{ $t('Script Set Export History') }}</span>
          <div class="header-control">
            <el-button @click="openSetup(null, 'export')" size="small">
              <i class="fa fa-fw fa-cloud-download"></i>
              {{ $t('Export Script Sets') }}
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()"><i class="fa fa-fw fa-search"></i>{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>从未导出过脚本集</h1>

          <p class="no-data-tip">
            如需备份、分发脚本集，可以使用导出功能
            <br>导出后的文件，可在系统的「脚本集导入」功能中进行导入
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
                <template v-for="t in C.IMPORT_DATA_TYPE">
                  <div class="history-summary" v-if="!T.isNothing(d.summaryJSON[t.key])">
                    <span class="text-info">{{ $t(t.name) }}{{ $t(':') }}</span>
                    <p>
                      <span v-for="item in d.summaryJSON[t.key]" :key="item.id">
                        <span>{{ item[t.showField] || item.id }}</span>
                        <small>{{ $t('(') }}ID <code class="text-code">{{ item.id }}</code>{{ $t(')') }}</small>
                        <br>
                      </span>
                    </p>
                  </div>
                </template>

                <div class="history-note" v-if="!T.isNothing(d.note)">
                  <span class="text-info">{{ $t('Note')}}{{ $t(':') }}</span>
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
        query: { pageSize: 20 },
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
.history-title {
  font-size: x-large;
}
.history-card {
  width: 620px;
}
.history-summary {
  font-size: 16px;
  margin-bottom: 15px;
}
.history-summary > p {
  margin: 10px 0 0 10px;
  line-height: 1.8;
}
.history-note {
}
.history-note pre {
  margin: 10px 0 0 10px;
  font-weight: normal;
  line-height: 1.5;
}
</style>

<style>
</style>
