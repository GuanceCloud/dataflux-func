<i18n locale="zh-CN" lang="yaml">
Script Market: 脚本市场

Detail : 详情
Install: 安装

Description : 描述
Requirements: 依赖
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ $t('Script Market') }} (WIP)</h1>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <el-card class="package-card" shadow="hover" v-for="p in packageList" :key="p.package">
          <i class="fa fa-fw fa-file-code-o package-icon"></i>
          <span class="package-name">{{ p.name }}</span>
          <code class="package-id">ID: {{ p.package }}</code>

          <div class="package-operation">
            <el-link type="primary">{{ $t('Detail') }}</el-link>
            <el-link type="primary">{{ $t('Install') }}</el-link>
          </div>
        </el-card>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'ScriptMarket',
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
      let _query = null;
      if (!this.T.isNothing(null)) {
      }
      let apiRes = await this.T.callAPI_get('/api/v1/script-packages/index', {
        query: _query,
      });
      if (!apiRes.ok) return;

      this.packageList = apiRes.data;

      this.$store.commit('updateLoadStatus', true);
    },
    showDetail(p) {
    },
  },
  computed: {
  },
  props: {
  },
  data() {
    return {
      packageList: [],
    }
  },
}
</script>

<style scoped>
.package-card {
  width: 330px;
  height: 150px;
  display: inline-block;
  margin: 10px 20px;
  position: relative;
}
.package-icon {
  position: absolute;
  font-size: 150px;
  left: 180px;
  top: 20px;
  color: #f5f5f5;
  line-height: 150px;
  z-index: 0;
}
.package-name {
  font-size: 36px;
  display: block;
  z-index: 1;
  position: relative;
}
.package-id {
  font-size: 18px;
  display: block;
  z-index: 1;
  position: relative;
}
.package-operation {
  position: absolute;
  left: 20px;
  bottom: 20px;
}
</style>

<style>
</style>
