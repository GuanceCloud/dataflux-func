<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          总览
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <el-divider content-position="left"><h1>资源计数</h1></el-divider>

        <el-card class="overview-card" shadow="hover" v-for="d in data.bizEntityCount" :key="d.name">
          <i v-if="C.OVERVIEW_ENTITY_MAP[d.name].icon" class="fa fa-fw overview-icon" :class="C.OVERVIEW_ENTITY_MAP[d.name].icon"></i>
          <i v-else-if="C.OVERVIEW_ENTITY_MAP[d.name].tagText" type="info" class="overview-icon overview-icon-text"><code>{{ C.OVERVIEW_ENTITY_MAP[d.name].tagText }}</code></i>

          <span class="overview-name">{{ C.OVERVIEW_ENTITY_MAP[d.name].name }}</span>
          <span class="overview-count">
            {{ d.count }}
            <span class="overview-count-unit">个</span>
          </span>
        </el-card>

        <el-divider class="overview-divider" content-position="left"><h1>脚本总览（共{{ data.scriptOverview.length }}个）</h1></el-divider>

        <el-table :data="data.scriptOverview" stripe style="width: 95%">
          <el-table-column label="类型" sortable sort-by="sset_type" width="90">
            <template slot-scope="scope">
              <el-tag size="small" v-if="scope.row.sset_type === 'official'">官方</el-tag>
              <el-tag size="small" v-else type="success">用户</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="脚本集" sortable :sort-by="['sset_title', 'sset_id']">
            <template slot-scope="scope">
              <span>{{ scope.row.sset_title || scope.row.sset_id }}</span>
            </template>
          </el-table-column>

          <el-table-column label="脚本" sortable :sort-by="['title', 'id']">
            <template slot-scope="scope">
              <span>{{ scope.row.title || scope.row.id }}</span>
            </template>
          </el-table-column>

          <el-table-column label="函数数量" sortable sort-by="funcCount" align="right" width="120">
            <template slot-scope="scope">
              <code v-if="!scope.row.funcCount">-</code>
              <code v-else>{{ scope.row.funcCount }} 个</code>
            </template>
          </el-table-column>

          <el-table-column label="代码大小" sortable sort-by="codeSize" align="right" width="120">
            <template slot-scope="scope">
              <code v-if="!scope.row.codeSize">-</code>
              <code v-else-if="scope.row.codeSize < 1024">{{ scope.row.codeSize }} 字节</code>
              <code v-else-if="scope.row.codeSize < 1024 * 1024">{{ parseInt(scope.row.codeSize / 1024) }} KB</code>
              <code v-else-if="scope.row.codeSize < 1024 * 1024 * 1024">{{ parseInt(scope.row.codeSize / 1024 / 1024) }} MB</code>
            </template>
          </el-table-column>

          <el-table-column label="发布版本" sortable sort-by="publishVersion" align="right" width="120">
            <template slot-scope="scope">
              <code v-if="!scope.row.publishVersion">-</code>
              <code v-else>v{{ `${scope.row.publishVersion}` }}</code>
            </template>
          </el-table-column>

          <el-table-column label="发布时间" sortable sort-by="latestPublishTimestamp" align="right" width="200">
            <template slot-scope="scope">
              <template v-if="!scope.row.latestPublishTime">
                <span v-if="scope.row.publishVersion === 0" class="text-info">从未发布</span>
                <span v-else class="text-info">系统内置</span>
              </template>
              <template v-else>
                <span>{{ scope.row.latestPublishTime | datetime }}</span>
                <br>
                <span class="text-info">（{{ scope.row.latestPublishTime | fromNow }}）</span>
              </template>
            </template>
          </el-table-column>
        </el-table>

        <el-divider class="overview-divider" content-position="left"><h1>最近操作记录（最近{{ data.latestOperations.length }}条）</h1></el-divider>

        <el-table :data="data.latestOperations" stripe style="width: 95%">
          <el-table-column label="时间" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.createTime | datetime }}</span>
              <br>
              <span class="text-info">（{{ scope.row.createTime | fromNow }}）</span>
            </template>
          </el-table-column>

          <el-table-column label="操作者">
            <template slot-scope="scope">
              <strong>{{ scope.row.username }}</strong>
              <br>

              <template v-if="scope.row.userId">
                <span class="text-info">ID：</span>
                <code class="text-code text-small">{{ scope.row.userId }}</code><CopyButton :content="scope.row.userId"></CopyButton>
                <br>
              </template>

              <span class="text-info">客户端ID：</span>
              <code class="text-code text-small">{{ scope.row.clientId }}</code><CopyButton :content="scope.row.clientId"></CopyButton>
            </template>
          </el-table-column>

          <el-table-column label="操作">
            <template slot-scope="scope">
              <span class="text-good" v-if="scope.row.respStatusCode >= 200 && scope.row.respStatusCode < 400">
                <i class="fa fa-fw fa-check-circle"></i>
              </span>
              <span class="text-bad" v-else>
                <i class="fa fa-fw fa-times-circle"></i>
              </span>

              <span>{{ scope.row._operationDescribe }}</span>
              <br>

              <template v-if="scope.row._operationEntityId">
                <span class="text-info">ID：</span>
                <code class="text-code text-small">{{ scope.row._operationEntityId }}</code><CopyButton :content="scope.row._operationEntityId"></CopyButton>
              </template>
            </template>
          </el-table-column>

          <el-table-column width="120">
            <template slot-scope="scope">
              <strong v-if="T.endsWith(scope.row.reqRoute, '/do/modify')" class="text-watch">
                <i class="fa fa-fw fa-exclamation-triangle"></i>
                修改操作
              </strong>
              <strong v-if="T.endsWith(scope.row.reqRoute, '/do/delete')" class="text-bad">
                <i class="fa fa-fw fa-exclamation-circle"></i>
                删除操作
              </strong>
            </template>
          </el-table-column>

          <el-table-column label="耗时" align="right" width="100">
            <template slot-scope="scope">
              {{ scope.row.reqCost }} <span class="text-info">毫秒</span>
            </template>
          </el-table-column>

          <el-table-column align="right" width="150">
            <template slot-scope="scope">
              <el-button @click="showDetail(scope.row)" type="text" size="small">显示HTTP请求详情</el-button>
            </template>
          </el-table-column>

        </el-table>
      </el-main>

      <LongTextDialog title="完整内容如下" ref="longTextDialog"></LongTextDialog>
    </el-container>
  </transition>
</template>

<script>
import LongTextDialog from '@/components/LongTextDialog'

export default {
  name: 'Overview',
  components: {
    LongTextDialog,
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
      let apiRes = await this.T.callAPI('/api/v1/func/overview', {
        alert: {entity: '总览', showError: true},
      });
      if (!apiRes.ok) return;

      apiRes.data.scriptOverview.forEach(d => {
        d.latestPublishTimestamp = 0;
        if (d.latestPublishTime) {
          d.latestPublishTimestamp = new Date(d.latestPublishTime).getTime();
        }
      });

      this.data = apiRes.data;
      this.$store.commit('updateLoadStatus', true);
    },
    showDetail(d) {
      this.$store.commit('updateHighlightedTableDataId', d.id);

      let httpInfoLines = [];

      httpInfoLines.push('===== 请求 =====')

      httpInfoLines.push(`${d.reqMethod.toUpperCase()} ${this.T.formatURL(d.reqRoute, {params: d.reqParamsJSON, query: d.reqQueryJSON})}`)

      if (d.reqBodyJSON) {
        httpInfoLines.push(JSON.stringify(d.reqBodyJSON, null, 2));
      }

      httpInfoLines.push('\n===== 响应 =====')

      httpInfoLines.push(`Status Code: ${d.respStatusCode}`);

      if (d.respBodyJSON) {
        httpInfoLines.push(JSON.stringify(d.respBodyJSON, null, 2));
      }

      let httpInfoTEXT = httpInfoLines.join('\n');

      let createTimeStr = this.moment(d.createTime).utcOffset(8).format('YYYYMMDD_HHmmss');
      let fileName = `http-dump.${createTimeStr}`;
      this.$refs.longTextDialog.update(httpInfoTEXT, fileName);
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
.overview-divider {
  margin-top: 100px;
}
.overview-card {
  width: 330px;
  height: 200px;
  display: inline-block;
  margin: 10px 20px;
  position: relative;
}
.overview-icon {
  position: absolute;
  font-size: 200px;
  left: 130px;
  top: 40px;
  color: #f5f5f5;
  line-height: 200px;
  z-index: 0;
}
.overview-icon-text {
  font-size: 120px;
}
.overview-name {
  font-size: 40px;
  display: block;
  z-index: 1;
  position: relative;
}
.overview-count {
  font-size: 80px;
  font-weight: 100;
  font-family: sans-serif;
  display: block;
  padding-left: 20px;
  z-index: 1;
  position: relative;
}
.overview-count-unit {
  font-size: 40px;
  font-weight: 200;
}
.text-data {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  color: grey;
}
</style>

<style>

</style>
