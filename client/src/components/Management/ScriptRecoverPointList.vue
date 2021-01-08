<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          脚本库还原点
          <div class="header-control">
            <el-button @click="openSetup(null, 'add')" type="primary" size="mini">
              <i class="fa fa-fw fa-camera"></i>
              创建还原点
            </el-button>
          </div>
        </h1>
      </el-header>

      <!-- 列表区 -->
      <el-main>
        <div class="no-data-area" v-if="T.isNothing(data)">
          <h1 class="no-data-title" v-if="T.isPageFiltered()">当前过滤条件无匹配数据</h1>
          <h1 class="no-data-title" v-else>当前未全新安装系统，尚无任何还原点</h1>

          <p class="no-data-tip">
            在进行发布脚本、导入脚本集、安装官方脚本集等操作之前，系统会自动创建还原点，保存整个脚本库状态
            <br>如您在某项操作之后，函数遇到无法解决的问题，可以尝试恢复到执行操作时的还原点
          </p>
        </div>
        <el-timeline v-else>
          <el-timeline-item
            placement="top"
            size="large"
            v-for="d in data"
            :key="d.id"
            type="primary"
            :timestamp="`${T.toDateTime(d.createTime)}（${T.fromNow(d.createTime)}）`">
            <el-card shadow="hover" class="recover-point-card">
              <span class="text-info">#</span>
              <span class="text-main text-large">{{ d.seq }}</span>
              <span class="recover-point-title" :class="C.SCRIPT_RECOVER_POINT_MAP[d.type].textClass">{{ C.SCRIPT_RECOVER_POINT_MAP[d.type].name }}</span>

              <div class="recover-point-operation">
                <el-button :type="d.nodeType" plain @click="quickSubmitData(d, 'recover')" size="small">还原至此状态</el-button>
              </div>

              <div class="recover-point-note" v-if="d.note">
                <pre class="text-info text-small">{{ d.note }}</pre>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'ScriptRecoverPointList',
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
    async loadData(pageNumber) {
      // 只加载近100条
      let apiRes = await this.T.callAPI('/api/v1/script-recover-points/do/list', {
        query: {pageSize: 50},
        alert: {entity: '脚本库还原点', showError: true},
      });
      if (!apiRes.ok) return;

      this.data = apiRes.data;

      this.$store.commit('updateLoadStatus', true);
    },
    async quickSubmitData(d, operation) {
      let operationName = this.OP_NAME_MAP[operation];

      try {
        switch(operation) {
          case 'recover':
            await this.$confirm(`执行恢复后，脚本集、脚本、函数等数据将完整恢复到还原点创建时刻的状态且<span class="text-bad">立即生效</span>
                <hr class="br">是否确认恢复？`, '恢复脚本',  {
              dangerouslyUseHTMLString: true,
              confirmButtonText: '确认恢复',
              cancelButtonText: '取消',
              type: 'warning',
            });
            break;
        }

      } catch(err) {
        return; // 取消操作
      }

      let apiRes = null;
      switch(operation) {
        case 'recover':
          apiRes = await this.T.callAPI('post', '/api/v1/script-recover-points/:id/do/recover', {
            params: {id: d.id},
            alert : {entity: '脚本库', action: '还原', showError: true},
          });
          break;
      }
      if (!apiRes || !apiRes.ok) return;

      await this.loadData();
    },
    openSetup(d, target) {
      switch(target) {
        case 'add':
          this.$router.push({
            name: 'script-recover-point-add',
          })
          break;
      }
    },
  },
  computed: {
    OP_NAME_MAP() {
      return {
        recover: '还原',
      };
    },
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
.recover-point-title {
  font-size: x-large;
}
.recover-point-card {
  width: 800px;
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
