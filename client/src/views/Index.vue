<i18n locale="zh-CN" lang="yaml">
Please select sign in method: 请选择登录方式
DataFlux Func builtin user  : DataFlux Func 内置用户
Username                    : 请输入账号
Password                    : 请输入密码
Captcha                     : 请输入验证码
Sign In                     : 登录

Please input username             : 请输入用户名
Please input password             : 请输入密码
Please input captcha              : 请输入验证码
Captcha should be a 4-digit number: 验证码为4位数字

Invalid username or password                                                                 : 用户名或密码错误
Invalid captcha                                                                              : 验证码错误或无效
User has been disabled                                                                       : 当前用户已被禁用
Integration sign-in func returned an unexpected value, please contact admin                  : 集成登录函数返回了未预期的结果，请联系系统管理员
Sign in failed. Error occured in integration sign-in func, please concat admin               : 登录失败。集成登录函数抛出异常，请联系系统管理员
Sign in failed. Integration sign-in func timeout, please concat admin                        : 登录失败，集成登录函数超时，请联系系统管理员
Sign in failed. Integration sign-in func returned `False` or empty value, please concat admin: 登录失败，集成登录函数返回`False`或空内容，请联系系统管理员
</i18n>

<template>
  <div class="sign-in">
    <div class="sign-in-area">
      <Logo type="auto" class="logo" width="400px" height="70px"></Logo>

      <div class="sign-in-panel">
        <el-form ref="form" :model="form" :rules="formRules" class="sign-in-form">
          <el-form-item prop="funcId" v-if="signInFuncs && signInFuncs.length > 0">
            <el-select v-model="form.funcId" :placeholder="$t('Please select sign in method')">
              <i slot="prefix" class="fth-man-icon fth-man-icon-integration"></i>
              <el-option :label="$t('DataFlux Func builtin user')" :value="BUILTIN_SIGN_IN_FUNC_ID"></el-option>
              <el-option v-for="opt in signInFuncs" :label="opt.name" :key="opt.id" :value="opt.id"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item prop="username">
            <el-input tabindex="1"
              maxlength="100"
              :placeholder="$t('Username')"
              v-model="form.username">
              <i slot="prefix" class="fth-man-icon fth-man-icon-account-number"></i>
            </el-input>
          </el-form-item>

          <el-form-item prop="password" :error="respError.password">
            <el-input tabindex="2"
              maxlength="100"
              show-password
              :placeholder="$t('Password')"
              v-model="form.password">
              <i slot="prefix" class="fth-man-icon fth-man-icon-password"></i>
            </el-input>
          </el-form-item>

          <el-form-item _captcha prop="captcha" :error="respError.captcha">
            <el-input tabindex="3"
              :maxlength="4"
              :clearable="true"
              @keyup.enter.native="submitData"
              :placeholder="$t('Captcha')"
              v-model="form.captcha">
              <i slot="prefix" class="fth-man-icon fth-man-icon-verification-code"></i>
            </el-input>
            <CaptchaImage
              captcha-category='signIn'
              :captcha-token="form.captchaToken"
              @click.native="refreshCaptcha()"></CaptchaImage>
          </el-form-item>
            <el-button tabindex="4" type="primary" @click="submitData">{{ $t('Sign In')}}</el-button>
          <el-form-item>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import CaptchaImage from '@/components/CaptchaImage'

export default {
  name: 'Index',
  components: {
    CaptchaImage,
  },
  watch: {
  },
  methods: {
    async submitData() {
      this.submitFailed = false;

      try {
        await this.$refs.form.validate();
      } catch(err) {
        return console.error(err);
      }

      this.T.jsonClear(this.respError);

      let _formData = this.T.jsonCopy(this.form);

      let signInURL = null;
      let signInBody = {
        captchaToken: _formData.captchaToken,
        captcha     : _formData.captcha,
        signIn: {
          username: _formData.username,
          password: _formData.password,
        }
      };

      if (this.isBuiltInSignIn) {
        signInURL = '/api/v1/auth/do/sign-in';

      } else {
        signInURL = '/api/v1/func/integration/sign-in';
        signInBody.signIn.funcId = _formData.funcId;
      }

      let apiRes = await this.T.callAPI('post', signInURL, {
        body : signInBody,
        alert: { muteError: true }, // 登录失败直接在页面展示，无需弹框
      });
      if (!apiRes.ok) {
        this.refreshCaptcha();

        switch(apiRes.reason) {
          /* 内置登录失败 */
          case 'EUserPassword':
            this.respError.password = this.$t('Invalid username or password');
            break;

          case 'EUserCaptcha':
            this.respError.captcha = this.$t('Invalid captcha');
            break;

          case 'EUserDisabled':
            this.respError.captcha = this.$t('User has been disabled');
            break;

          /* 集成登录失败 */
          case 'EFuncResultParsingFailed':
            this.respError.captcha = this.$t('Integration sign-in func returned an unexpected value, please contact admin');
            break;

          case 'EFuncFailed.SignInFuncRaisedException':
            this.respError.captcha = apiRes.message || this.$t('Sign in failed. Error occured in integration sign-in func, please concat admin');
            break;

          case 'EFuncFailed.SignInFuncTimeout':
            this.respError.captcha = this.$t('Sign in failed. Integration sign-in func timeout, please concat admin');
            break;

          case 'EFuncFailed.SignInFuncReturnedFalseOrNothing':
            this.respError.captcha = this.$t('Sign in failed. Integration sign-in func returned `False` or empty value, please concat admin');
            break;
        }

        this.submitFailed = true;
        return;
      }

      this.$refs.form.resetFields();

      let xAuthToken = apiRes.data.xAuthToken;
      this.$store.commit('updateXAuthToken', xAuthToken);
      this.$store.dispatch('reloadUserProfile');
    },
    refreshCaptcha() {
      this.form.captchaToken = Math.random().toString();
      this.form.captcha = '';
    },
  },
  computed: {
    BUILTIN_SIGN_IN_FUNC_ID() {
      return 'builtIn';
    },
    signInFuncs() {
      return this.$store.getters.CONFIG('INTEGRATED_SIGN_IN_FUNC');
    },
    isBuiltInSignIn() {
      return this.T.isNothing(this.signInFuncs) || this.form.funcId === this.BUILTIN_SIGN_IN_FUNC_ID;
    },
    formRules() {
      return {
        username: [
          {
            trigger : 'change',
            message : this.$t('Please input username'),
            required: true,
          },
        ],
        password: [
          {
            trigger : 'change',
            message : this.$t('Please input password'),
            required: true,
          },
        ],
        captcha: [
          {
            trigger : 'change',
            message : this.$t('Please input captcha'),
            required: true,
          },
          {
            trigger : 'change',
            message : this.$t('Captcha should be a 4-digit number'),
            length  : 4,
            pattern : /^\d{4}$/g
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
        password: null,
        captcha : null,
      },
      form: {
        captchaToken: null,
        captcha     : null,
        funcId      : 'builtIn', // 集成登录专用
        username    : null,
        password    : null,
      },
      submitFailed: false,
    }
  },
  created() {
    // 进入页面刷新验证码框
    this.refreshCaptcha();
  },
}
</script>

<style scoped>
.logo {
  display: block;
  margin: 10px auto;
}
.sign-in {
  background-color: #f3f3f7;
  height: 100%;
  width: 100%;
  z-index: 9999;
}
.sign-in-area {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%,-60%);
}
.sign-in-panel {
  width: 554px;
  background-color: #fff;
}
.sign-in-form {
  padding: 40px 54px;
  padding-bottom: 60px;
  border-radius: 3px;
  box-shadow: 0 1px 2px 0 rgba(155,155,184,.15);
}
.sign-in-title {
  font-size: 20px;
  color: #222;
  margin-bottom: 18px;
}
@font-face {
  font-family: 'fth-man-icons';
  src: url(../assets/font/fth-man-icons.woff);
}
.fth-man-icon {
  font-family: fth-man-icons !important;
  speak: none;
  font-size: 16px;
  font-style: normal;
  font-weight: 700;
  font-variant: normal;
  text-transform: none;
  color: #666;
}
.fth-man-icon-integration:before {
  content: "\E902";
}
.fth-man-icon-account-number:before {
  content: "\E900";
}
.fth-man-icon-password:before {
    content: "\E909";
}
.fth-man-icon-verification-code:before {
    content: "\E90E";
}
</style>
<style>
.sign-in-form input {
  height: 47px;
  font-size: 16px;
}
.sign-in-form button {
  height: 46px;
  width: 100%;
  font-size: 16px;
}
.sign-in-form .el-input__inner {
  padding-left: 46px;
}
.sign-in-form .el-input__prefix {
  left: 13px;
  top: 2px;
  font-size: 16px;
}
.sign-in-form [_captcha] .el-input {
  width: 288px;
}
.sign-in-form [_captcha] .captcha-image {
  display: inline-block;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  float: right;
  height: 45px;
  width: 136px;
  overflow: hidden;
}
.sign-in-form [_captcha] .captcha-image svg {
  transform: scale(1.15);
  left: 8px;
  top: 9px;
  position: relative;
}
</style>
