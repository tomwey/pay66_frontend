<template>
  <div class="login">
    <div class="login-wrapper">
      <div class="logo-area">
        <div class="brand">
          <img
            :src="$store.getters.configs.logo"
            :alt="$store.getters.configs.brand"
            :title="$store.getters.configs.brand"
            class="logo"
          />
          <span class="name">{{$store.getters.configs.brand}}</span>
        </div>
        <p class="slogen" v-if="$store.getters.configs.slogan">{{$store.getters.configs.slogan}}</p>
      </div>
      <div class="login-box">
        <h2 class="title">登录</h2>
        <div class="form-box">
          <div class="input-box">
            <el-input v-model="loginForm.login" type="number" placeholder="请输入手机号">
              <i slot="prefix" class="iconfont icon-mobile"></i>
            </el-input>
          </div>
          <div class="input-box">
            <el-input
              v-model="loginForm.password"
              type="password"
              @keyup.enter.native="login"
              placeholder="请输入密码"
            >
              <i slot="prefix" class="iconfont icon-pass"></i>
            </el-input>
          </div>

          <el-button
            type="primary"
            :loading="commiting"
            :disabled="!loginForm.login || !loginForm.password"
            size="full"
            @click="login"
          >登录</el-button>
        </div>
        <p class="forget-password" @click="forgetPassword">忘记密码？</p>
      </div>
      <p class="wdj-desc" v-if="$store.getters.configs.services">{{$store.getters.configs.services}}</p>
    </div>
  </div>
</template>
<script>
export default {
  name: "login",
  data() {
    return {
      commiting: false,
      redirect: null,
      loginForm: {
        login: "",
        password: ""
      },
      rules: {
        login: [{ required: true, message: "请输入手机号", trigger: "blur" }],
        password: [{ required: true, message: "请输入密码", trigger: "blur" }]
      }
    };
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect;
      },
      immediate: true
    }
  },
  methods: {
    forgetPassword() {
      // console.log(123);
      this.$router.push({ path: "/forget_pwd" });
    },
    login() {
      // console.log(234);
      this.commiting = true;
      this.$store
        .dispatch("Login", {
          login: this.loginForm.login,
          password: this.loginForm.password
        })
        .then(() => {
          // console.log(123);
          this.commiting = false;
          this.$router.push({ path: this.redirect || "/" });
        })
        .catch(() => {
          this.commiting = false;
          // Message({
          //   message: error.message,
          //   type: "error",
          //   duration: 5 * 1000
          // });
        });
    }
  }
};
</script>

<style lang="scss" scoped>
.login {
  background: rgb(245, 247, 250);
  width: 100%;
  min-height: 100%;

  .login-wrapper {
    position: absolute;
    min-height: 730px;
    width: 100%;
    height: 100%;
    left: 0;
    left: 0;
    background: rgb(245, 247, 250);
    .logo-area {
      position: absolute;
      width: 100%;
      top: 12%;
      text-align: center;
      left: 0;
      .brand {
        height: 30px;
        line-height: 30px;
        .logo {
          max-height: 30px;
          cursor: pointer;
          border-radius: 50%;
        }

        .name {
          font-size: 18px;
          line-height: 18px;
          color: #333;
          padding-left: 10px;
          vertical-align: 8px;
        }
      }

      .slogen {
        font-size: 16px;
        line-height: 1.25;
        text-align: center;
        color: #666666;
        font-family: "microsoft yahei";
        margin-top: 15px;
      }
    }
    .login-box {
      width: 400px;
      background-color: #ffffff;
      box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.06),
        0 6px 12px 0 rgba(0, 0, 0, 0.06);
      padding: 40px 50px 30px;
      position: absolute;
      left: 50%;
      top: 45%;
      margin-left: -200px;
      margin-top: -150px;
      .title {
        font-size: 18px;
        color: #333;
        margin: 0;
        padding: 0;
        text-align: center;
        padding: 0 15px 15px;
        margin-bottom: 15px;
        font-weight: normal;
      }
      .input-box {
        margin-bottom: 30px;
      }
      .el-button--full {
        width: 100%;
      }

      // .el-button--wdj-green {
      //   background: rgb(98, 170, 71);
      //   color: #fff;
      //   border: 0;
      // }

      .iconfont {
        // vertical-align: -12px;
        height: 100%;
        width: 25px;
        text-align: center;
        transition: all 0.3s;
        line-height: 40px;
        margin-left: 3px;
      }

      .forget-password {
        font-size: 14px;
        color: #409eff; //rgb(98, 168, 58);
        text-align: center;
        margin-top: 5px;
        padding: 15px;
        cursor: pointer;
        user-select: none;
      }
    }
    .wdj-desc {
      width: 284px;
      line-height: 20px;
      font-family: "PingFang SC";
      font-size: 14px;
      letter-spacing: -0.2px;
      text-align: center;
      color: #b2b2b2;
      position: absolute;
      bottom: 30px;
      left: 50%;
      margin-left: -142px;
      padding: 0 35px;
      &::before,
      &::after {
        content: "";
        position: absolute;
        border-bottom: 2px solid #bbb;
        width: 30px;
        top: 9px;
        right: 0;
      }

      &::before {
        left: 0;
        right: auto;
      }
    }
  }
}
</style>


