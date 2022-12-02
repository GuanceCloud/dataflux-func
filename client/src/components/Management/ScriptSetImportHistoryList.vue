<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>{{ $t('Script Set Import History') }}</span>
          <div class="header-control">
            <el-button @click="openSetup(null, 'import')" size="small">
              <i class="fa fa-fw fa-cloud-upload"></i>
              {{ $t('Import Script Sets') }}
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()"><i class="fa fa-fw fa-search"></i>{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>从未导入或安装过脚本集</h1>

          <p class="no-data-tip">
            如需从外部引入脚本集，可以使用导入功能
            <br>导入用的文件，可在系统的「脚本集导出」功能中导出并下载
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
                  <div class="history-summary" v-if="T.notNothing(d.summaryJSON[t.key])">
                    <span class="text-info">{{ $t(t.name) }}{{ $t(':') }}</span>
                    <p>
                      <span v-for="item in d.summaryJSON[t.key]" :key="item.id">
                        <span :class="t.showClass">{{ item[t.showField] || item.id }}</span>
                        &#12288;
                        <small>{{ $t('(') }}ID <code class="text-code">{{ item.id }}</code>{{ $t(')') }}</small>
                        <br>
                      </span>
                    </p>
                  </div>
                </template>

                <div class="history-note" v-if="T.notNothing(d.note)">
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
  name: 'ScriptSetImportHistoryList',
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
      let apiRes = await this.T.callAPI_get('/api/v1/script-set-import-history/do/list', {
        query: { pageSize: 20 }
      });
      if (!apiRes.ok) return;

      let data = apiRes.data;

      // 旧版兼容
      data.forEach(d => {
        if (!d.summaryJSON || !d.summaryJSON.dataSources) return;
        d.summaryJSON.connectors = d.summaryJSON.dataSources;
      });

      this.data = data;
      this.$store.commit('updateLoadStatus', true);
    },
    openSetup(d, target) {
      switch(target) {
        case 'import':
          this.$router.push({
            name: 'script-set-import',
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
