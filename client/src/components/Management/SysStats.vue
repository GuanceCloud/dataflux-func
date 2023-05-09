<i18n locale="zh-CN" lang="yaml">
System Status: 系统指标
Tasks / Func : 任务 / 函数
Cache        : 缓存
Database     : 数据库
Server       : Server（服务）
Worker       : Worker（工作单元）

Server CPU Percent         : Server CPU 使用率
Server Memory RSS          : Server 内存 RSS
Server Memory Heap Total   : Server 内存 Heap 总量
Server Memory Heap Used    : Server 内存 Heap 用量
Server Memory Heap External: Server 内存 Heap 外部对象用量
Worker CPU Percent         : Worker CPU 使用率
Worker Memory PSS          : Worker 内存 PSS
Func Call Count            : 函数调用次数
Worker Queue Length        : 工作队列长度
DB Table Total Used        : 数据库表总用量（数据 + 索引）
DB Table Data Used         : 数据库表数据用量
DB Table Index Used        : 数据库表索引用量
Cache Memory Used          : 缓存数据库内存用量
Cache Key Used             : 缓存数据库 Key 数量
Cache Key Count by Prefix  : 缓存数据库 Key 数量（按前缀区分）
Matched Route Count        : 接口访问次数（按路由区分）
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="page-header">
          <span>{{ $t('System Status') }}</span>
          <div class="header-control">
            <el-button @click="updateChart" type="primary" plain size="small" :disabled="isRefreshing">
              <i v-if="isRefreshing" class="fa fa-fw fa-circle-o-notch fa-spin"></i>
              <i v-else class="fa fa-fw fa-refresh"></i>
              {{ $t('Refresh') }}
            </el-button>
          </div>
        </div>
      </el-header>
      <el-main>
        <el-divider content-position="left"><h1>{{ $t('Tasks / Func') }}</h1></el-divider>
        <div id="workerQueueLength" class="chart"></div>
        <div id="funcCallCount" class="chart"></div>
        <div id="matchedRouteCount" class="chart"></div>

        <el-divider content-position="left"><h1>{{ $t('Cache') }}</h1></el-divider>
        <div id="cacheDBMemoryUsed" class="chart"></div>
        <div id="cacheDBKeyUsed" class="chart"></div>
        <div id="cacheDBKeyCountByPrefix" class="chart"></div>

        <el-divider content-position="left"><h1>{{ $t('Database') }}</h1></el-divider>
        <div id="dbTableTotalUsed" class="chart"></div>
        <div id="dbTableDataUsed" class="chart"></div>
        <div id="dbTableIndexUsed" class="chart"></div>

        <el-divider content-position="left"><h1>{{ $t('Server') }}</h1></el-divider>
        <div id="serverCPUPercent" class="chart"></div>
        <div id="serverMemoryRSS" class="chart"></div>
        <div id="serverMemoryHeapTotal" class="chart"></div>
        <div id="serverMemoryHeapUsed" class="chart"></div>
        <div id="serverMemoryHeapExternal" class="chart"></div>

        <el-divider content-position="left"><h1>{{ $t('Worker') }}</h1></el-divider>
        <div id="workerCPUPercent" class="chart"></div>
        <div id="workerMemoryPSS" class="chart"></div>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
import echarts from 'echarts'

export default {
  name: 'SysStats',
  components: {
  },
  watch: {
    $route: {
      immediate: true,
      async handler(to, from) {
        await this.loadData();
      }
    },
    '$store.getters.uiColorSchema': function(to, from) {
      let textStyle      = this.T.getEchartTextStyle();
      let splitLineStyle = this.T.getEchartSplitLineStyle();

      for (let chartId in this.charts) {
        let chart = this.charts[chartId];
        chart.setOption({
          textStyle: textStyle,
          title    : { textStyle: textStyle },
          xAxis    : { splitLine: { lineStyle: splitLineStyle } },
          yAxis    : { splitLine: { lineStyle: splitLineStyle } },
        });
      }
    },
  },
  methods: {
    async loadData() {
      this.$store.commit('updateLoadStatus', true);
    },
    genSeries(tsDataMap, opt) {
      let series = [];

      for (let name in tsDataMap) {
        let s = {
          name      : name,
          data      : tsDataMap[name],
          showSymbol: false,
        };

        if (this.T.notNothing(opt.seriesOptions)) {
          Object.assign(s, opt.seriesOptions);
        }

        switch(s.type) {
          case 'bar':
            s.label = s.label || {};
            s.label.normal = s.label.normal || {
              show    : true,
              position: 'right',
            };
            break;

          case 'pie':
            s.label = s.label || {};
            s.label.formatter = s.label.formatter || '{b}: {c} ({d}%)';
            break;
        }

        s.data.forEach(dp => {
          switch(opt.dataConvert) {
            case 'xyTranspose':
              dp.reverse();
              break;
          }
        });

        series.push(s);
      }

      series.sort((a, b) => {
        let a_dp = a.data.slice(-1)[0];
        let b_dp = b.data.slice(-1)[0];
        if (opt.dataConvert === 'xyTranspose') {
          return b_dp[0] - a_dp[0];
        } else {
          return b_dp[1] - a_dp[1];
        }
      });

      return series;
    },
    resizeBarChart(chart) {
      let chartSeries = chart.getOption().series;

      let dataLength = 0;
      chartSeries.forEach(s => {
        dataLength = Math.max(dataLength, s.data.length);
      });

      let height = dataLength * 25 * chartSeries.length + (chartSeries.length - 1) * 5 + 60 + 80;
      chart.getDom().style.height = `${height}px`;
      chart.resize();
    },
    async updateChart() {
      this.isRefreshing = true;

      let apiRes = await this.T.callAPI_get('/api/v1/monitor/sys-stats/do/get');
      if (!apiRes || !apiRes.ok) {
        this.isRefreshing = false;
        return;
      }

      let sysStats = apiRes.data;

      for (let metric in sysStats) {
        let chart = this.charts[metric];
        if (!chart) continue;

        let tsDataMap = sysStats[metric];
        if (this.T.isNothing(tsDataMap)) {
          chart.showLoading({
            text       : this.$t('No Data'),
            fontSize   : 20,
            showSpinner: false,
            textColor  : 'grey',
            maskColor  : 'white',
          });
        } else {
          chart.hideLoading();
        };

        if (Array.isArray(tsDataMap)) {
          tsDataMap = { '': tsDataMap };
        }

        // Prepare Series
        let series = null;
        switch(metric) {
          case 'workerQueueLength':
            series = this.genSeries(tsDataMap, {
              seriesOptions: { type: 'line' },
            });
            series.forEach(s => {
              s.name = '#' + s.name;
            });
            break;

          case 'funcCallCount':
            series = this.genSeries(tsDataMap, {
              seriesOptions: { type: 'line' },
            });
            series.forEach(s => {
              s.name = s.name + '(...)';
            });
            break;

          case 'matchedRouteCount':
            series = this.genSeries(tsDataMap, {
              dataConvert  : 'xyTranspose',
              seriesOptions: { type: 'bar' },
            });
            break;

          default:
            series = this.genSeries(tsDataMap, {
              seriesOptions: { type: 'line' },
            });
            break;
        }

        // Set Series
        chart.setOption({ series: series });

        // Resize Chart
        switch(metric) {
          case 'matchedRouteCount':
            this.resizeBarChart(chart);
            break;
        }
      };

      setTimeout(() => {
        this.isRefreshing = false;
      }, 1000);
    },
    createTitleOpt(title) {
      return {
        text     : title,
        left     : 100,
        textStyle: this.T.getEchartTextStyle(),
      };
    },
    createCommonTooltipOpt() {
      return { trigger: 'axis', axisPointer: { animation: false } };
    },
    createTSTooltipOpt(opt) {
      opt = opt || {};
      return {
        trigger: 'axis',
        axisPointer: { animation: false, type: 'cross' },
        showDelay: 0,
        hideDelay: 0,
        transitionDuration: 0,
        formatter: params => {
          let sortedParams = this.T.jsonCopy(params);
          sortedParams.sort((a, b) => {
            let valueDiff = b.data[1] - a.data[1];
            if (valueDiff > 0) {
              return 1;
            } else if (valueDiff < 0) {
              return -1;
            } else {
              if (b.seriesName < a.seriesName) {
                return 1;
              } else {
                return -1;
              }
            }
          });

          let nDigits = 'number' === typeof opt.nDigits ? opt.nDigits : 1;

          let tooltipHTML = this.T.getDateTimeString(params[0].data[0]);
          tooltipHTML += '<br>';
          tooltipHTML += '<table>';
          for (let i = 0; i < sortedParams.length; i++) {
            if (i >= 10) {
              tooltipHTML += '<tr><td colspan="100%" align="right">只展示Top10</td></tr>';
              break;
            }

            let p = sortedParams[i];
            let unit = opt.unit || '';
            if (Array.isArray(unit)) {
              unit = p.data[1] > 1 ? unit[0] : unit[1];
            }

            tooltipHTML += '<tr>';
            tooltipHTML += '<td style="font-size: 12px">' + p.marker + '</td>';
            if (p.seriesName) {
              tooltipHTML += '<td style="font-size: 12px">' + p.seriesName + '</td>';
              tooltipHTML += '<td style="font-size: 12px">:</td>';
            }
            tooltipHTML += '<td style="font-size: 12px" align="right">' + p.data[1].toFixed(nDigits) + '</td>';
            tooltipHTML += '<td style="font-size: 12px">' + unit + '</td>';
            tooltipHTML += '</tr>';
          }
          tooltipHTML += '</table>';
          return tooltipHTML;
        }
      };
    },
    createCommonGridOpt() {
      return {
        left        : 80,
        right       : 50,
        containLabel: true,
      };
    },
    createCountGridOpt() {
      return { left: 50, right: '35%', containLabel: true };
    },
    createTimeXAxisOpt() {
      return {
        type  : 'time',
        offset: 10,
        splitLine: {
          lineStyle: this.T.getEchartSplitLineStyle(),
        },
        axisLabel: {
          formatter: (value, index) => {
            return this.T.getDateTimeString(value, 'YYYY-MM-DD HH:mm');
          }
        }
      };
    },
    createCountXAxisOpt() {
      return {
        type: 'value',
        splitLine: {
          lineStyle: this.T.getEchartSplitLineStyle(),
        },
        max: (value) => Math.ceil(value.max * 1.1),
      };
    },
    createPercentYAxisOpt() {
      return {
        type       : 'value',
        offset     : 10,
        max        : value => Math.max(parseInt(value.max * 1.1), 100),
        min        : 0,
        boundaryGap: ['20%', '20%'],
        splitLine: {
          lineStyle: this.T.getEchartSplitLineStyle(),
        },
        axisLabel: {
          formatter: (value, index) => {
            return value + '%';
          }
        }
      };
    },
    createVolumnYAxisOpt(opt) {
      opt = opt || {};
      return {
        type  : 'value',
        offset: 10,
        min   : 0,
        max   : opt.max,
        splitLine: {
          lineStyle: this.T.getEchartSplitLineStyle(),
        },
        axisLabel: {
          formatter: (value, index) => {
            return value + ' MB';
          }
        }
      };
    },
    createCateYAxisOpt() {
      return {
        type     : 'category',
        position : 'right',
        offset   : 50,
        inverse  : true,
        axisLabel: { interval: 0 },
        splitLine: {
          lineStyle: this.T.getEchartSplitLineStyle(),
        },
      };
    },
    createCountYAxisOpt(opt) {
      opt = opt || {};
      return {
        type       : 'value',
        offset     : 10,
        min        : 0,
        max        : opt.max,
        minInterval: 1,
        splitLine: {
          lineStyle: this.T.getEchartSplitLineStyle(),
        },
      };
    },
  },
  computed: {
    CHART_CONFIGS() {
      let textStyle = this.T.getEchartTextStyle();
      return {
        serverCPUPercent: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('Server CPU Percent')),
          tooltip: this.createTSTooltipOpt({ unit: '%'}),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createPercentYAxisOpt(),
        },
        serverMemoryRSS: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('Server Memory RSS')),
          tooltip: this.createTSTooltipOpt({ unit: 'MB'}),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createVolumnYAxisOpt(),
        },
        serverMemoryHeapTotal: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('Server Memory Heap Total')),
          tooltip: this.createTSTooltipOpt({ unit: 'MB'}),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createVolumnYAxisOpt(),
        },
        serverMemoryHeapUsed: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('Server Memory Heap Used')),
          tooltip: this.createTSTooltipOpt({ unit: 'MB'}),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createVolumnYAxisOpt(),
        },
        serverMemoryHeapExternal: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('Server Memory Heap External')),
          tooltip: this.createTSTooltipOpt({ unit: 'MB'}),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createVolumnYAxisOpt(),
        },

        workerCPUPercent: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('Worker CPU Percent')),
          tooltip: this.createTSTooltipOpt({ unit: '%'}),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createPercentYAxisOpt(),
        },
        workerMemoryPSS: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('Worker Memory PSS')),
          tooltip: this.createTSTooltipOpt({ unit: 'MB'}),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createVolumnYAxisOpt(),
        },
        funcCallCount: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('Func Call Count')),
          tooltip: this.createTSTooltipOpt({ unit: ['Times', 'Time'], nDigits: 0 }),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createCountYAxisOpt(),
        },
        workerQueueLength: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('Worker Queue Length')),
          tooltip: this.createTSTooltipOpt({ unit: ['Tasks', 'Task'], nDigits: 0 }),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createCountYAxisOpt({ max: value => Math.max(parseInt(value.max * 1.1), 100) }),
        },

        dbTableTotalUsed: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('DB Table Total Used')),
          tooltip: this.createTSTooltipOpt({ unit: 'MB'}),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createVolumnYAxisOpt(),
        },
        dbTableDataUsed: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('DB Table Data Used')),
          tooltip: this.createTSTooltipOpt({ unit: 'MB'}),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createVolumnYAxisOpt(),
        },
        dbTableIndexUsed: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('DB Table Index Used')),
          tooltip: this.createTSTooltipOpt({ unit: 'MB'}),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createVolumnYAxisOpt(),
        },

        cacheDBMemoryUsed: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('Cache Memory Used')),
          tooltip: this.createTSTooltipOpt({ unit: 'MB'}),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createVolumnYAxisOpt(),
        },
        cacheDBKeyUsed: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('Cache Key Used')),
          tooltip: this.createTSTooltipOpt({ unit: ['Keys', 'Key'], nDigits: 0 }),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createCountYAxisOpt(),
        },
        cacheDBKeyCountByPrefix: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('Cache Key Count by Prefix')),
          tooltip: this.createTSTooltipOpt({ unit: ['Keys', 'Key'], nDigits: 0 }),
          grid   : this.createCommonGridOpt(),
          xAxis  : this.createTimeXAxisOpt(),
          yAxis  : this.createCountYAxisOpt(),
        },
        matchedRouteCount: {
          textStyle: textStyle,
          title  : this.createTitleOpt(this.$t('Matched Route Count')),
          tooltip: this.createCommonTooltipOpt({ nDigits: 0 }),
          grid   : this.createCountGridOpt(),
          xAxis  : this.createCountXAxisOpt(),
          yAxis  : this.createCateYAxisOpt(),
        },
      }
    },
  },
  props: {
  },
  data() {
    return {
      isRefreshing: false,

      charts: {},

      autoRefreshTimer: null,
    }
  },
  mounted() {
    setImmediate(() => {
      // 初始化Echarts
      for (let chartId in this.CHART_CONFIGS) {
        this.charts[chartId] = echarts.init(document.getElementById(chartId));
        this.charts[chartId].setOption(this.CHART_CONFIGS[chartId]);
      }

      // 更新图表数据
      this.updateChart();

      this.autoRefreshTimer = setInterval(() => {
        this.updateChart();
      }, 30 * 1000);
    });

    window.onresize = () => {
      for (let chartId in this.charts) this.charts[chartId].resize()
    }
  },
  beforeDestroy() {
    if (this.autoRefreshTimer) clearInterval(this.autoRefreshTimer);
    for (let chartId in this.charts) {
      let chart = this.charts[chartId];
      if (chart) chart.dispose();
    }
  },
}
</script>

<style scoped>
.chart {
  width : 100%;
  min-width: 1040px;
  height: 350px;
}
</style>
