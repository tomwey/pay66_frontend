<template>
  <div class="password">
    <div class="password-wrapper">
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

        <p class="slogen">{{$store.getters.configs.slogan}}</p>
      </div>
      <div class="login-box">
        <h2 class="title">重置密码</h2>
        <div class="form-box">
          <!-- <comm-form :controls="controls" :form-data="passwordForm"></comm-form> -->
          <el-form
            ref="passwordForm"
            :rules="rules"
            :model="passwordForm"
            label-position="left"
            :validate-on-rule-change="false"
            label-width="80px"
          >
            <el-form-item label="手机号" prop="mobile">
              <el-input
                v-model="passwordForm.mobile"
                :disabled="!!$store.getters.mobile"
                type="number"
                placeholder="输入手机号"
              ></el-input>
            </el-form-item>
            <el-form-item label="验证码" prop="code">
              <el-input v-model="passwordForm.code" type="number" placeholder="输入验证码">
                <el-button
                  slot="append"
                  :disabled="timerStarting"
                  @click="getCode"
                >{{countdown_text}}</el-button>
              </el-input>
            </el-form-item>
            <el-form-item label="新密码" prop="password">
              <el-input
                v-model="passwordForm.password"
                type="password"
                autocomplete="off"
                placeholder="输入新密码"
              ></el-input>
            </el-form-item>
            <el-form-item label="确认密码" prop="password2">
              <el-input
                v-model="passwordForm.password2"
                type="password"
                autocomplete="off"
                placeholder="输入确认密码"
              ></el-input>
            </el-form-item>
          </el-form>
        </div>
        <div class="commit-buttons">
          <el-button type="primary" @click="commit">提交</el-button>
          <el-button @click="back">返回</el-button>
        </div>
      </div>
      <p class="wdj-desc">{{$store.getters.configs.services}}</p>
    </div>
  </div>
</template>
<script>
import {
  MobileCheck,
  PasswordLengthCheck
} from "@/components/CommForm/validators";
import { getMerchID } from "@/utils/auth";
export default {
  name: "password",
  // components: {
  //   CommForm: resolve => {
  //     require(["@/components/CommForm"], resolve);
  //   }
  // },
  data() {
    var validatePassword2 = (rule, value, callback) => {
      if (value !== this.passwordForm.password) {
        callback(new Error("两次密码输入不一致"));
      } else {
        callback();
      }
    };
    return {
      timerStarting: false,
      seconds: 59,
      curr_seconds: 59,
      countdown_timer: null,
      countdown_text: "获取验证码",
      rules: {
        mobile: [
          { required: true, message: "手机号不能为空", trigger: "blur" },
          { validator: MobileCheck, trigger: "change" }
        ],
        code: [{ required: true, message: "验证码不能为空", trigger: "blur" }],
        password: [
          { required: true, message: "新密码不能为空", trigger: "blur" },
          { validator: PasswordLengthCheck, trigger: "change" }
        ],
        password2: [
          { required: true, message: "确认密码不能为空", trigger: "blur" },
          { validator: validatePassword2, trigger: "change" }
        ]
      },
      passwordForm: {
        mobile: this.$store.getters.mobile || "",
        code: "",
        password: "",
        password2: ""
      }
    };
  },
  methods: {
    back() {
      history.go(-1);
    },
    commit() {
      this.$refs["passwordForm"].validate(valid => {
        if (valid) {
          let params = {};
          params["merch_id"] = getMerchID();
          params["mobile"] = this.passwordForm.mobile;
          params["code"] = this.passwordForm.code;
          params["code_type"] = 7;
          params["password"] = this.passwordForm.password;

          this.$post("manager/admin/update_password", params, res => {
            if (res.code === 0) {
              this.$message({
                type: "success",
                message: "密码重置成功"
              });
              this.$store.dispatch("FedLogOut").then(() => {
                this.$router.push({ path: "/login" });
              });
            }
          });
        }
      });
    },
    getCode() {
      if (this.timerStarting) return;
      this.$refs["passwordForm"].validateField("mobile", res => {
        // console.log(res);
        if (!res) {
          this.$post(
            "auth_codes",
            {
              mobile: this.passwordForm.mobile,
              code_type: 7
            },
            res => {
              if (res.code === 0) {
                this.startTimer();
              }
            }
          );
        }
      });
    },
    startTimer() {
      this.timerStarting = true;
      this.curr_seconds = this.seconds;
      this.countdown_text = `${this.seconds}秒后重新获取`;

      if (!this.countdown_timer) {
        this.countdown_timer = setInterval(() => {
          this.curr_seconds -= 1;
          if (this.curr_seconds <= 0) {
            clearInterval(this.countdown_timer);
            this.countdown_timer = null;
            this.timerStarting = false;
            this.curr_seconds = this.seconds;
            this.countdown_text = "获取验证码";
          } else {
            this.countdown_text = `${this.curr_seconds}秒后重新获取`;
          }
        }, 1000);
      }
    }
  }
};
</script>
<style lang="scss" scoped>
.password {
  background: rgb(245, 247, 250);
  width: 100%;
  min-height: 100%;
  .password-wrapper {
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
      // .logo {
      //   max-height: 36px;
      //   cursor: pointer;
      // }

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
      padding: 40px 30px; //30px;
      position: absolute;
      left: 50%;
      top: 45%;
      margin-left: -200px;
      margin-top: -150px;

      .el-input-group__append {
        background: rgb(98, 168, 58) !important;
        border-color: rgb(98, 168, 58) !important;
        color: #fff;
      }

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
      .commit-buttons {
        margin-top: 30px;
        margin-left: 80px;
      }
    }
    .wdj-desc {
      width: 285px;
      line-height: 20px;
      font-family: PingFangSC;
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


