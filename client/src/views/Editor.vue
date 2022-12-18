<template>
  <split-pane v-on:resize="resizeVueSplitPane" ref="vueSplitPane" :min-percent="0" :default-percent="20" split="vertical">
    <!-- 边栏导航区 -->
    <template slot="paneL">
      <div class="aside">
        <div class="aside-content">
          <i class="icon-bg" :class="currentTabIcon"></i>

          <el-tabs v-model="currentTab" stretch type="border-card">
            <el-tab-pane :label="$t('Script Lib')" name="aside-script">
              <AsideScript ref="asideScript"></AsideScript>
            </el-tab-pane>
            <el-tab-pane :label="$t('Connector')" name="aside-connector">
              <AsideConnector ref="asideConnector"></AsideConnector>
            </el-tab-pane>
            <el-tab-pane :label="$t('ENV')" name="aside-env-variable">
              <AsideEnvVariable ref="asideEnvVariable"></AsideEnvVariable>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </template>

    <!-- 编辑器 -->
    <template slot="paneR">
      <router-view />
    </template>
  </split-pane>
</template>

<script>
// @ is an alias to /src
// 边栏导航区
import AsideScript      from '@/components/Editor/AsideScript'
import AsideConnector   from '@/components/Editor/AsideConnector'
import AsideEnvVariable from '@/components/Editor/AsideEnvVariable'

export default {
  name: 'Editor',
  components: {
    // 边栏导航区
    AsideScript,
    AsideConnector,
    AsideEnvVariable,
  },
  watch: {
    $route: {
      immediate: true,
      handler(to, from) {
        const NO_FADE_ROUTES = [
          'code-editor',
          'code-viewer',
        ];
        if (NO_FADE_ROUTES.indexOf(to.name) >= 0) {
          this.transitionName = null;
        } else {
          this.transitionName = 'fade';
        }
      }
    },
    splitPanePercent(val) {
      this.resizeVueSplitPane(val);
    },
  },
  methods: {
    resizeVueSplitPane(percent) {
      if (percent > this.SPLIT_PANE_MAX_PERCENT) {
        percent = this.SPLIT_PANE_MAX_PERCENT;
      } else if (percent < this.SPLIT_PANE_MIN_PERCENT) {
        percent = this.SPLIT_PANE_MIN_PERCENT;
      }

      this.$refs.vueSplitPane.percent = percent;
      this.debouncedUpdatePanePercent(this.$store, percent);
    },
  },
  computed: {
    SPLIT_PANE_MAX_PERCENT: () => 35,
    SPLIT_PANE_MIN_PERCENT: () => 10,
    currentTabFromRoute() {
      switch(this.$route.name) {
        case 'connector-add':
        case 'connector-setup':
          return 'aside-connector';

        case 'env-variable-add':
        case 'env-variable-setup':
          return 'aside-env-variable';

        default:
          return 'aside-script';
      }
    },
    currentTabIcon() {
      let c = ['fa', 'fa-fw', 'icon-bg'];
      switch(this.currentTab) {
        case 'aside-script':
          c.push('fa-file-code-o');
          break;

        case 'aside-connector':
          c.push('fa-database');
          break;

        case 'aside-env-variable':
          c.push('fa-cogs');
          break;
      }
      return c;
    },
    splitPanePercent() {
      return this.$store.state.Editor_splitPanePercent || this.$store.getters.DEFAULT_STATE.Editor_splitPanePercent;
    },
  },
  data() {
    return {
      currentTab: null,
    }
  },
  created() {
    this.debouncedUpdatePanePercent = this.T.debounce((store, nextPercent) => {
      store.commit('updateEditor_splitPanePercent', nextPercent);
    }, 100);

    this.currentTab = this.currentTabFromRoute;
  },
  mounted() {
    // 加载分割位置
    this.resizeVueSplitPane(this.splitPanePercent);
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.aside {
  height: 100%;
  overflow: hidden;
}
.aside-content {
  position: relative;
  height: 100%;
}
.icon-bg {
  color: #f2f2f2;
  position: fixed;
  font-size: 300px;
  z-index: 0;
  bottom: -80px;
  left: -100px;
}
</style>

<style>
.aside-content > .el-tabs > .el-tabs__content > .el-tab-pane {
  height: 100%;
}
.aside-content > .el-tabs > .el-tabs__content > .el-tab-pane > div {
  height: 100%;
  padding-right: 5px;
  overflow-y: auto;
}
.aside-content > .el-tabs > .el-tabs__content {
  padding: 5px 1px 10px 5px;
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  bottom: 0;
}
.aside-content>.el-tabs>.el-tabs__content.el-tab-pane {
  padding: 10px;
  background-color: white;
}
.aside-content>.el-tabs.el-tabs--border-card {
  border: none;
  box-shadow: none;
}
.aside-tip {
  padding: 12px !important;
  max-width: 600px;
}
</style>
