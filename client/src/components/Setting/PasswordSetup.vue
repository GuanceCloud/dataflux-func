<template>
  <transition name="fade">
    <el-container direction="vertical" v-if="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>
          修改密码
        </h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" :model="form" :rules="formRules" :disabled="$store.getters.isIntegratedUser" label-width="100px">
                <el-form-item>
                  <InfoBlock v-if="$store.getters.isIntegratedUser" type="warning" title="当前登录用户为集成登录用户，修改密码请前往原系统进行操作"></InfoBlock>
                </el-form-item>

                <el-form-item label="旧密码" prop="oldPassword" :error="respError.oldPassword">
                  <el-input tabindex="1"
                    maxlength="100"
                    placeholder="请输入旧密码"
                    show-password
                    v-model="form.oldPassword"></el-input>
                </el-form-item>

                <el-form-item label="新密码" prop="newPassword">
                  <el-input tabindex="2"
                    maxlength="100"
                    placeholder="请输入新密码"
                    show-password
                    v-model="form.newPassword"></el-input>
                </el-form-item>

                <el-form-item label="确认新密码" prop="confirmNewPassword">
                  <el-input tabindex="3"
                    maxlength="100"
                    placeholder="请再输入一遍新密码"
                    show-password
                    v-model="form.confirmNewPassword"></el-input>
                </el-form-item>

                <el-form-item label="验证码" _captcha prop="captcha" :error="respError.captcha">
                  <el-input tabindex="4"
                    :maxlength="4"
                    :clearable="true"
                    @keyup.enter.native="submitData"
                    placeholder="请输入验证码"
                    v-model="form.captcha">
                  </el-input>
                  <CaptchaImage
                    captcha-category='changePassword'
                    :captcha-token="form.captchaToken"
                    @click.native="refreshCaptcha(true)"></CaptchaImage>
                </el-form-item>

                <el-form-item>
                  <el-button tabindex="5" type="primary" @click="submitData">修改密码</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
          <el-col :span="9" class="hidden-md-and-down">
          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </transition>
</template>

<script>
import CaptchaImage from '@/components/CaptchaImage'

export default {
  name: 'PasswordSetup',
  components: {
    CaptchaImage,
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

      this.T.jsonClear(this.respError);

      let _formData = this.T.jsonCopy(this.form);
      let apiRes = await this.T.callAPI('post', '/api/v1/auth/do/change-password', {
        body: {
          captchaToken: _formData.captchaToken,
          captcha     : _formData.captcha,
          changePassword: {
            oldPassword: _formData.oldPassword,
            newPassword: _formData.newPassword,
          },
        },
        alert : {entity: '密码', action: '修改', showSuccess: true},
      });
      if (!apiRes.ok) {
        this.refreshCaptcha();

        switch(apiRes.reason) {
          case 'EUserPassword':
            this.respError.oldPassword = '旧密码错误';
            break;

          case 'EBizBadData':
            this.respError.captcha = '当前用户不存在';
            break;

          case 'EUserCaptcha':
            this.respError.captcha = '验证码错误或无效';
            break;
        }

        return;
      };

      this.$refs.form.resetFields();
    },
    refreshCaptcha(clearInputedCaptcha) {
      this.form.captchaToken = Math.random().toString();
      if (clearInputedCaptcha) {
        this.form.captcha = '';
      }
    },
  },
  computed: {
  },
  props: {
  },
  data() {
    return {
      respError: {
        oldPassword: null,
        captcha    : null,
      },
      form: {
        captchaToken      : null,
        captcha           : null,
        oldPassword       : null,
        newPassword       : null,
        confirmNewPassword: null,
      },
      formRules: {
        oldPassword: [
          {
            trigger : 'change',
            message : '请输入旧密码',
            required: true,
          },
        ],
        newPassword: [
          {
            trigger : 'change',
            message : '请输入新密码',
            required: true,
          },
          {
            trigger : 'change',
            required: true,
            validator: (rule, value, callback) => {
              if (value.length < 6 || !value.match(/[a-z]/) || !value.match(/[A-Z]/) || !value.match(/[0-9]/)) {
                return callback(new Error('密码至少6位，且同时包含大写英文、小写英文和数字'));
              } else if (this.form.confirmNewPassword) {
                this.$refs.form.validateField('confirmNewPassword');
              }
              return callback();
            },
          },
        ],
        confirmNewPassword: [
          {
            trigger : 'change',
            message : '请再次输入新密码',
            required: true,
          },
          {
            trigger : 'change',
            required: true,
            validator: (rule, value, callback) => {
              if (value !== this.form.newPassword) {
                return callback(new Error('两次输入密码不一致'));
              }
              return callback();
            },
          }
        ],
        captcha: [
          {
            trigger : 'change',
            message : '请输入验证码',
            required: true,
          },
        ],
      },
    }
  },
  created() {
    // 进入页面刷新验证码框
    this.refreshCaptcha(true);

    this.$store.commit('updateLoadStatus', true);
  },
}
</script>

<style>
.common-form [_captcha] .el-input {
  width: 255px;
}
.common-form [_captcha] .captcha-image {
  display: inline-block;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  float: right;
  height: 38px;
  width: 136px;
  overflow: hidden;
}
.common-form [_captcha] .captcha-image svg {
  transform: scale(1.15);
  left: 8px;
  top: 5px;
  position: relative;
}
</style>
