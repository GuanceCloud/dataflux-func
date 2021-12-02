<i18n locale="zh-CN" lang="yaml">
Change Password: 修改密码
You are signed in as a integrated user, please change your password in the origin system: 当前登录用户为集成登录用户，修改密码请前往原系统进行操作
Old password                                                                            : 旧密码
Please input old password                                                               : 请输入旧密码
New password                                                                            : 新密码
Please input new password                                                               : 请输入新密码
Confirm                                                                                 : 确认新密码
Please confirm new password                                                             : 请再输入一遍新密码
Captcha                                                                                 : 验证码
Please input captcha                                                                    : 请输入验证码

Password changed: 密码已修改

Invalid old password                                             : 旧密码错误
User not found                                                   : 当前用户不存在
Invalid captcha                                                  : 验证码错误或无效
Length of password should longer than 6                          : 密码至少6位
Password should contains uppercase, lowercase alphabet and number: 密码必须同时包含大写英文、小写英文和数字
New password not matches                                         : 两次输入密码不一致
</i18n>

<template>
  <transition name="fade">
    <el-container direction="vertical" v-show="$store.state.isLoaded">
      <!-- 标题区 -->
      <el-header height="60px">
        <h1>{{ $t('Change Password') }}</h1>
      </el-header>

      <!-- 编辑区 -->
      <el-main>
        <el-row :gutter="20">
          <el-col :span="15">
            <div class="common-form">
              <el-form ref="form" label-width="120px" :model="form" :rules="formRules" :disabled="$store.getters.isIntegratedUser">
                <el-form-item>
                  <InfoBlock v-if="$store.getters.isIntegratedUser" type="warning" :title="$t('You are signed in as a integrated user, please change your password in the origin system')"></InfoBlock>
                </el-form-item>

                <el-form-item :label="$t('Old password')" prop="oldPassword" :error="respError.oldPassword">
                  <el-input tabindex="1"
                    maxlength="100"
                    :placeholder="$t('Please input old password')"
                    show-password
                    v-model="form.oldPassword"></el-input>
                </el-form-item>

                <el-form-item :label="$t('New password')" prop="newPassword">
                  <el-input tabindex="2"
                    maxlength="100"
                    :placeholder="$t('Please input new password')"
                    show-password
                    v-model="form.newPassword"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Confirm')" prop="confirmNewPassword">
                  <el-input tabindex="3"
                    maxlength="100"
                    :placeholder="$t('Please confirm new password')"
                    show-password
                    v-model="form.confirmNewPassword"></el-input>
                </el-form-item>

                <el-form-item :label="$t('Captcha')" _captcha prop="captcha" :error="respError.captcha">
                  <el-input tabindex="4"
                    :maxlength="4"
                    :clearable="true"
                    @keyup.enter.native="submitData"
                    :placeholder="$t('Please input captcha')"
                    v-model="form.captcha">
                  </el-input>
                  <CaptchaImage
                    captcha-category='changePassword'
                    :captcha-token="form.captchaToken"
                    @click.native="refreshCaptcha(true)"></CaptchaImage>
                </el-form-item>

                <el-form-item>
                  <el-button tabindex="5" type="primary" @click="submitData">{{ $t('Change Password') }}</el-button>
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
        alert: { okMessage: this.$t('Password changed') },
      });
      if (!apiRes.ok) {
        this.refreshCaptcha();

        switch(apiRes.reason) {
          case 'EUserPassword':
            this.respError.oldPassword = this.$t('Invalid old password');
            break;

          case 'EBizBadData':
            this.respError.captcha = this.$t('User not found');
            break;

          case 'EUserCaptcha':
            this.respError.captcha = this.$t('Invalid captcha');
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
    formRules() {
      return {
        oldPassword: [
          {
            trigger : 'change',
            message : this.$t('Please input old password'),
            required: true,
          },
        ],
        newPassword: [
          {
            trigger : 'change',
            message : this.$t('Please input new password'),
            required: true,
          },
          {
            trigger : 'change',
            required: true,
            validator: (rule, value, callback) => {
              if (value.length < 6) {
                return callback(new Error(this.$t('Length of password should longer than 6')));
              }
              if (!value.match(/[a-z]/) || !value.match(/[A-Z]/) || !value.match(/[0-9]/)) {
                return callback(new Error(this.$t('Password should contains uppercase, lowercase alphabet and number')));
              }

              this.$refs.form.validateField('confirmNewPassword');
              return callback();
            },
          },
        ],
        confirmNewPassword: [
          {
            trigger : 'change',
            message : this.$t('Please confirm new password'),
            required: true,
          },
          {
            trigger : 'change',
            required: true,
            validator: (rule, value, callback) => {
              if (value !== this.form.newPassword) {
                return callback(new Error(this.$t('New password not matches')));
              }
              return callback();
            },
          }
        ],
        captcha: [
          {
            trigger : 'change',
            message : this.$t('Please input captcha'),
            required: true,
          },
        ],
      }
    },
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
  width: 330px;
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
