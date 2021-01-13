<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          近期脚本故障
          <div class="header-control">
            <FuzzySearchInput :dataFilter="dataFilter"></FuzzySearchInput>
          </div>
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main class="common-table-container">
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()">当前过滤条件无匹配数据</h1>
          <h1 class="no-data-title" v-else>尚无任何近期脚本故障</h1>

          <p class="no-data-tip">
            脚本运行时可能产生各种问题，如未在函数内部处理，则会抛出到系统层
            <br>抛出的错误会被系统搜集，并展示在此
          </p>
        </div>
        <el-table v-else
          class="common-table" height="100%"
          :data="data"
          :row-class-name="highlightRow">

          <el-table-column label="执行方式" width="150">
            <template slot-scope="scope">
              <span :class="C.FUNC_EXEC_MODE_MAP[scope.row.execMode].textClass">
                {{ C.FUNC_EXEC_MODE_MAP[scope.row.execMode].name }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="时间" width="200">
            <template slot-scope="scope">
              <span>{{ scope.row.createTime | datetime }}</span>
              <br>
              <span class="text-info">（{{ scope.row.createTime | fromNow }}）</span>
            </template>
          </el-table-column>

          <el-table-column label="函数">
            <template slot-scope="scope">
              <template v-if="scope.row.func_id">
                <strong class="func-title">{{ scope.row.func_title || scope.row.func_name }}</strong>

                <br>
                <el-tag type="info" size="mini"><code>def</code></el-tag>
                <code class="text-main text-small">{{ `${scope.row.func_id}(${T.isNothing(scope.row.func_kwargsJSON) ? '' : '...'})` }}</code>
              </template>
              <template v-else>
                <div class="text-bad">函数已不存在</div>
                <br>
              </template>
            </template>
          </el-table-column>

          <el-table-column label="故障内容">
            <template slot-scope="scope">
              <pre class="text-data">{{ scope.row.einfoSample }}</pre>
              <el-button @click="showDetail(scope.row)" type="text" size="small">显示故障详情</el-button>
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

      <LongTextDialog title="调用栈如下" ref="longTextDialog"></LongTextDialog>
    </el-container>
  </transition>
</template>

<script>
import FuzzySearchInput from '@/components/FuzzySearchInput'
import LongTextDialog from '@/components/LongTextDialog'

export default {
  name: 'ScriptFailureList',
  components: {
    FuzzySearchInput,
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
    highlightRow({row, rowIndex}) {
      return (this.$store.state.highlightedTableDataId === row.id) ? 'hl-row' : '';
    },
    async loadData() {
      let apiRes = await this.T.callAPI('/api/v1/script-failures/do/list', {
        query: this.T.createListQuery(),
        alert: {entity: '函数故障列表', showError: true},
      });
      if (!apiRes.ok) return;

      // 缩减行数
      apiRes.data.forEach(d => {
        d.einfoSample = this.T.limitLines(d.einfoTEXT, -3, 100);
      });

      this.data = apiRes.data;
      this.dataPageInfo = apiRes.pageInfo;

      this.$store.commit('updateLoadStatus', true);
    },
    showDetail(d) {
      this.$store.commit('updateHighlightedTableDataId', d.id);

      let createTimeStr = this.moment(d.createTime).utcOffset(8).format('YYYYMMDD_HHmmss');
      let fileName = `${d.funcId}.error.${createTimeStr}`;
      this.$refs.longTextDialog.update(d.einfoTEXT, fileName);
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
.func-title {
  font-size: 16px;
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

