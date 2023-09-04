<i18n locale="zh-CN" lang="yaml">
Create Recover Point: 创建还原点
Script Lib Recover Points: 脚本库还原点

'Recover Point created by {userName}': '{userName} 创建的还原点'

Meaningful notes can provide a reliable reference for the future: 有意义的备注可以为将来提供可靠的参考

Please input note: 请输入备注

Script Lib Recover Point created: 脚本库还原点已创建
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <div class="common-page-header">
          <h1>{{ $t('Create Recover Point') }}</h1>
        </div>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="setup-form">
              <el-form ref="form" label-width="135px" :model="form" :rules="formRules">
                <el-form-item :label="$t('Note')" prop="note">
                  <el-input
                    type="textarea"
                    resize="none"
                    :autosize="{minRows: 5}"
                    maxlength="5000"
                    v-model="form.note"></el-input>
                  <InfoBlock :title="$t('Meaningful notes can provide a reliable reference for the future')" />
                </el-form-item>
              </el-form>
            </div>
          </el-col>
          <el-col :span="9" class="hidden-md-and-down">
          </el-col>
        </el-row>
      </el-main>

      <!-- 底部栏 -->
      <el-footer>
        <div class="setup-footer">
          <el-button @click="goToHistory">
            <i class="fa fa-fw fa-history"></i>
            {{ $t('Script Lib Recover Points' )}}
          </el-button>
          <el-button type="primary" @click="submitData">{{ $t('Create') }}</el-button>
        </div>
      </el-footer>
    </el-container>
  </transition>
</template>

<script>
export default {
  name: 'ScriptRecoverPointAdd',
  components: {
  },
  watch: {
  },
  methods: {
    async submitData() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      switch(this.T.setupPageMode()) {
        case 'add':
          return await this.addData();
      }
    },
    async addData() {
      let apiRes = await this.T.callAPI('post', '/api/v1/script-recover-points/do/add', {
        body : { data: this.T.jsonCopy(this.form) },
        alert: { okMessage: this.$t('Script Lib Recover Point created') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.goToHistory();
    },
    goToHistory() {
      this.$router.push({
        name: 'script-recover-point-list',
      });
    },
  },
  props: {
  },
  data() {
    let userName = this.$store.state.userProfile.name || this.$store.state.userProfile.username;
    let defaultNote = this.$t('Recover Point created by {userName}', { userName: userName });
    return {
      form: {
        note: defaultNote,
      },
      formRules: {
        note: [
          {
            trigger : 'change',
            message : this.$t('Please input note'),
            required: true,
            min     : 1,
          }
        ]
      }
    }
  },
  created() {
    this.$store.commit('updateLoadStatus', true);
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
