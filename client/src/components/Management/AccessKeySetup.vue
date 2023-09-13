<i18n locale="zh-CN" lang="yaml">
Add Access Key: 添加 Access Key

'Auto generate...': 自动生成...

Please input title: 请输入标题

Access Key created: Access Key 已创建
</i18n>

<template>
  <el-dialog
    id="ScriptSetSetup"
    :visible.sync="show"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="750px">

    <template slot="title">
      {{ $t('Add Access Key') }}
    </template>

    <el-container direction="vertical">
      <el-main>
        <div class="setup-form">
          <el-form ref="form" label-width="135px" :model="form" :rules="formRules">
            <el-form-item :label="$t('Title')" prop="title">
              <el-input
                maxlength="200"
                v-model="form.title"></el-input>
            </el-form-item>

            <el-form-item label="ID">
              <el-input :value="$t('Auto generate...')" :disabled="true"></el-input>
            </el-form-item>

            <el-form-item label="Secret">
              <el-input :value="$t('Auto generate...')" :disabled="true"></el-input>
            </el-form-item>

            <el-form-item class="setup-footer">
              <el-button type="primary" v-prevent-re-click @click="submitData">{{ $t('Save') }}</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-main>
    </el-container>
  </el-dialog>
</template>

<script>
export default {
  name: 'AccessKeySetup',
  components: {
  },
  watch: {
    show(val) {
      if (!val) {
        this.$root.$emit('reload.accessKeyList');
      }
    },
  },
  methods: {
    async loadData() {
      this.T.jsonClear(this.form);
      this.data = {};

      this.show = true;
    },
    async submitData() {
      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      // AccessKey 只有添加
      return await this.addData();
    },
    async addData() {
      let apiRes = await this.T.callAPI('post', '/api/v1/access-keys/do/add', {
        body : { data: this.T.jsonCopy(this.form) },
        alert: { okMessage: this.$t('Access Key created') },
      });
      if (!apiRes || !apiRes.ok) return;

      this.$store.commit('updateHighlightedTableDataId', apiRes.data.id);
      this.show = false;
    },
  },
  data() {
    return {
      show: false,

      data: {},
      form: {
        title: null,
      },
      formRules: {
        title: [
          {
            trigger : 'blur',
            message : this.$t('Please input title'),
            required: true,
          }
        ],
      }
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
