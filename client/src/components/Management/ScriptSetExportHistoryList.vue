<i18n locale="zh-CN" lang="yaml">
No Script Set has ever been exported: 从未导出过任何脚本集
Exporting Script Sets for backup or sharing Script Sets: 使用脚本集导出功能备份或分享脚本集
</i18n>
<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="list-page-header">
          <span>{{ $t('Script Set Export History') }}</span>
          <div class="header-control">
            <el-button @click="openSetup(null, 'export')" size="small">
              <i class="fa fa-fw fa-cloud-download"></i>
              {{ $t('Script Set Export') }}
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()"><i class="fa fa-fw fa-search"></i>{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No Script Set has ever been exported') }}</h1>

          <p class="no-data-tip">
            {{ $t('Exporting Script Sets for backup or sharing Script Sets') }}
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
                        <small>
                          {{ $t('(') }}
                          <span class="text-info">ID</span>
                          &nbsp;<code class="text-main">{{ item.id }}</code>
                          {{ $t(')') }}
                        </small>
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
      if (!apiRes || !apiRes.ok) return;

      /* 兼容处理 */
      apiRes.data.forEach(d => {
        // 数据源 -> 连接器
        if (d.summaryJSON && d.summaryJSON.dataSources) {
          d.summaryJSON.connectors = d.summaryJSON.dataSources;
        }

        // 备注
        if (this.T.isNothing(d.note)) {
          d.note = this.T.jsonFindSafe(d, 'summaryJSON.extra.note');
        }
      });

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
