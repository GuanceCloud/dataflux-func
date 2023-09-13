<i18n locale="zh-CN" lang="yaml">
Script Lib Recover: 脚本库还原
Create Recover Point: 创建还原点

Script Lib recovered: 脚本库已还原

No Recover Point has ever been created: 从未创建过任何还原点
System automatically creates Script Lib Recover Points before importing, installing Script Sets.: 在导入、安装脚本集前，系统会自动创建还原点。
Recover Points can also be created manually.                                                    : 也可以手动创建脚本库还原点。

'After recovery, the entire Script Lib will be reset to the state at the time the Recover Point was created and will take effect immediately.<hr class="br">Are you sure you want to recover?': '执行恢复后，整个脚本库将重置到还原点创建时的状态且立即生效。<hr class="br">是否确认恢复？'
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="common-page-header">
          <h1>{{ $t('Script Lib Recover') }}</h1>
          <div class="header-control">
          </div>
        </div>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()"><i class="fa fa-fw fa-search"></i>{{ $t('No matched data found') }}</h1>
          <h1 class="no-data-title" v-else><i class="fa fa-fw fa-info-circle"></i>{{ $t('No Recover Point has ever been created') }}</h1>

          <p class="no-data-tip">
            {{ $t('System automatically creates Script Lib Recover Points before importing, installing Script Sets.' )}}
            <br>{{ $t('Recover Points can also be created manually.') }}
          </p>
        </div>
        <el-timeline v-else>
          <el-timeline-item
            placement="top"
            size="large"
            v-for="d in data"
            :key="d.id"
            type="primary"
            :timestamp="`${T.getDateTimeString(d.createTime)} (${T.fromNow(d.createTime)})`">
            <el-card shadow="hover" class="recover-point-card">
              <span class="text-info">#</span>
              <span class="text-main text-large">{{ d.seq }}</span>
              <span class="recover-point-title" :class="C.SCRIPT_RECOVER_POINT_MAP.get(d.type).textClass">{{ C.SCRIPT_RECOVER_POINT_MAP.get(d.type).name }}</span>

              <div class="recover-point-operation">
                <el-button :type="d.nodeType" plain @click="quickSubmitData(d, 'recover')" size="small">
                  {{ $t('Recover') }}
                </el-button>
              </div>

              <div class="recover-point-note" v-if="d.note">
                <pre class="text-info text-small">{{ d.note }}</pre>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-main>

      <!-- 底部栏 -->
      <el-footer>
        <div class="setup-page-footer">
          <el-button @click="openSetup(null, 'add')">
            <i class="fa fa-fw fa-camera"></i>
            {{ $t('Create Recover Point') }}
          </el-button>
        </div>
      </el-footer>

      <ScriptRecoverPointAdd ref="setup" />

    </el-container>
  </transition>
</template>

<script>
import ScriptRecoverPointAdd from '@/components/Management/ScriptRecoverPointAdd'

export default {
  name: 'ScriptRecoverPointList',
  components: {
    ScriptRecoverPointAdd,
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
    async loadData(pageNumber) {
      // 只加载近若干条
      let apiRes = await this.T.callAPI_get('/api/v1/script-recover-points/do/list', {
        query: { pageSize: 20 },
      });
      if (!apiRes || !apiRes.ok) return;

      this.data = apiRes.data;
      this.$store.commit('updateLoadStatus', true);
    },
    async quickSubmitData(d, operation) {
      switch(operation) {
        case 'recover':
          if (!await this.T.confirm(this.$t('After recovery, the entire Script Lib will be reset to the state at the time the Recover Point was created and will take effect immediately.<hr class="br">Are you sure you want to recover?'))) return;
          break;
      }

      let apiRes = null;
      switch(operation) {
        case 'recover':
          apiRes = await this.T.callAPI('post', '/api/v1/script-recover-points/:id/do/recover', {
            params: { id: d.id },
            alert : { okMessage: this.$t('Script Lib recovered') },
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      await this.loadData();
    },
    openSetup(d, target) {
      switch(target) {
        case 'add':
          this.$refs.setup.loadData();
          break;
      }
    },
  },
  props: {
  },
  data() {
    return {
      data: [],
    }
  },
  created() {
    this.$root.$on('reload.scriptRecoverPointList', () => this.loadData());
  },
  destroyed() {
    this.$root.$off('reload.scriptRecoverPointList');
  },
}
</script>

<style scoped>
.recover-point-title {
  font-size: x-large;
}
.recover-point-card {
  width: 550px;
}
.recover-point-note {
  padding: 10px 0 0 10px;
}
.recover-point-note pre {
  margin: 5px 0 0 10px;
  font-weight: normal;
}
.recover-point-operation {
  float: right;
}
</style>

<style>
</style>
