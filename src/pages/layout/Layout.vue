<template>
  <div class="app-wrapper">
    <div class="sidebar-container">
      <div class="logo">
        <img
          :src="$store.getters.configs.logo"
          :alt="$store.getters.configs.brand"
          :title="$store.getters.configs.brand"
        />
        <span class="brand">{{$store.getters.configs.brand}}</span>
      </div>
      <div class="menus">
        <el-menu router :show-timeout="200" :default-active="$route.path" mode="vertical">
          <el-menu-item index="/dashboard">
            <i class="iconfont icon-home"></i>
            <span slot="title">概况</span>
          </el-menu-item>
          <el-menu-item index="/orders" v-if="has_permission([108])">
            <i class="iconfont icon-order"></i>
            <span slot="title">订单管理</span>
          </el-menu-item>

          <el-submenu index="/agents" v-if="has_permission([101,102])">
            <template slot="title">
              <i class="iconfont icon-agent2"></i>
              <span slot="title">业务团队</span>
            </template>

            <el-menu-item index="/agents/configs" v-if="has_permission([101])">
              <i class="iconfont icon-earn_config2"></i>
              <span slot="title">提成配置</span>
            </el-menu-item>

            <el-menu-item index="/merchants/accounts" v-if="has_permission([101])">
              <i class="iconfont icon-list"></i>
              <span slot="title">账号列表</span>
            </el-menu-item>
          </el-submenu>

          <el-submenu index="/merchants" v-if="has_permission([101,102])">
            <template slot="title">
              <i class="iconfont icon-merchant"></i>
              <span slot="title">商家管理</span>
            </template>

            <el-menu-item index="/merchants" v-if="has_permission([101])">
              <i class="iconfont icon-list"></i>
              <span slot="title">商家列表</span>
            </el-menu-item>

            <el-menu-item index="/merchants/authorizes" v-if="has_permission([101])">
              <i class="iconfont icon-authorize"></i>
              <span slot="title">商家授权</span>
            </el-menu-item>

            <el-menu-item index="/merchants/categories" v-if="has_permission([102])">
              <i class="iconfont icon-category"></i>
              <span slot="title">经营类别</span>
            </el-menu-item>

            <el-menu-item index="/merchants/accounts" v-if="has_permission([103])">
              <i class="iconfont icon-account"></i>
              <span slot="title">员工账号</span>
            </el-menu-item>
          </el-submenu>

          <el-menu-item index="/merchants/shops" v-if="has_permission([103])">
            <i class="iconfont icon-shop"></i>
            <span slot="title">门店管理</span>
          </el-menu-item>

          <el-menu-item index="/devices" v-if="has_permission([107])">
            <i class="iconfont icon-device"></i>
            <span slot="title">设备管理</span>
          </el-menu-item>

          <el-menu-item index="/users" v-if="has_permission([108])">
            <i class="iconfont icon-membership"></i>
            <span slot="title">会员管理</span>
          </el-menu-item>

          <!-- <el-menu-item index="/redpacks" v-if="has_permission([108])">
            <i class="iconfont icon-stu2"></i>
            <span slot="title">红包管理</span>
          </el-menu-item>-->

          <el-menu-item index="/stats" v-if="has_permission([108])">
            <i class="iconfont icon-stat"></i>
            <span slot="title">数据中心</span>
          </el-menu-item>

          <!-- <el-menu-item index="/messages" v-if="has_permission([108])">
            <i class="iconfont icon-stu2"></i>
            <span slot="title">消息中心</span>
          </el-menu-item>-->

          <el-menu-item index="/accounts" v-if="has_permission(106)">
            <i class="iconfont icon-account"></i>
            <span slot="title">账号管理</span>
          </el-menu-item>
          <el-menu-item index="/configs" v-if="has_permission(106)">
            <i class="iconfont icon-sys_config"></i>
            <span slot="title">系统设置</span>
          </el-menu-item>

          <!-- <el-submenu index="/accounts" v-if="has_permission([122,123])">
            <template slot="title">
              <i class="iconfont icon-account"></i>
              <span slot="title">账号管理</span>
            </template>

            <el-menu-item index="/accounts/roles" v-if="has_permission([123])">
              <i class="iconfont icon-stu1"></i>
              <span slot="title">角色管理</span>
            </el-menu-item>

            <el-menu-item index="/accounts" v-if="has_permission([122])">
              <i class="iconfont icon-list"></i>
              <span slot="title">账号列表</span>
            </el-menu-item>
          </el-submenu>-->
        </el-menu>
      </div>
    </div>
    <div class="right-side">
      <div class="topbar">
        <div class="breadcrumb-wrap">
          <breadcrumb />
        </div>
        <div class="account-wrap">
          <el-dropdown @command="handleCommand" trigger="click">
            <span class="el-dropdown-link">
              {{$store.getters.name}}
              <i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="change_pwd">修改密码</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
      <div class="main-content">
        <div class="content">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import { Navbar, Sidebar, AppMain } from "./components";
// import ResizeMixin from "./mixin/ResizeHandler";
import Breadcrumb from "@/components/Breadcrumb";

export default {
  name: "Layout",
  components: {
    Breadcrumb
  },
  // mounted() {
  //   console.log(this.$store.getters.permissions);
  // },
  methods: {
    handleCommand(command) {
      // console.log(123);
      if (command === "logout") {
        this.$store.dispatch("FedLogOut").then(() => {
          this.$router.push({ path: "/login" });
        });
      } else if (command === "change_pwd") {
        // console.log("修改密码");
        this.$router.push({ path: "/change_pwd" });
      }
    },
    has_permission(code) {
      if (this.$store.getters.is_admin) return true;

      const arr = this.$store.getters.permissions;
      for (let i = 0; i < arr.length; i++) {
        let permission = arr[i];
        if (code.indexOf(permission.resource_code) !== -1) {
          return true;
        }
        // if (permission.resource_code === code) {
        //   let codes = permission.action_codes.map(_code => {
        //     return _code.toString();
        //   });
        //   if (codes.indexOf("1001") !== -1 || codes.indexOf("1002") !== -1) {
        //     return true;
        //   }
        // }
      }
      return false;
    }
  }
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
// @import "src/styles/mixin.scss";
$theme-color: #409eff;

.app-wrapper {
  width: 100%;
  height: 100%;
  background: #fff;
  position: relative;

  .iconfont {
    margin-right: 10px;
    color: #888;
    font-size: 18px;
  }

  .sidebar-container {
    width: 180px;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    background: #fff;
    box-shadow: 0px 4px 0px 0px rgba(0, 0, 0, 0.05);

    .logo {
      position: absolute;
      width: 100%;
      height: 70px;
      z-index: 1000;
      line-height: 70px;
      background: $theme-color; //rgb(98, 168, 58);
      text-align: center;
      // font-size: 24px;
      // font-weight: 700;
      color: #fff;
      img {
        max-height: 24px;
        border-radius: 50%;
        margin-right: 5px;
        vertical-align: middle;
        border: 2px solid #fff;
      }
      .brand {
        font-size: 18px;
        display: inline-block;
        vertical-align: middle;
      }
    }

    .menus {
      padding-top: 70px;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;

      .el-menu {
        border-right: 0;
      }

      .el-menu-item.is-active {
        color: $theme-color !important;
        background: rgb(245, 247, 250);
        i {
          color: $theme-color !important;
        }
      }

      .el-menu-item:focus,
      .el-menu-item:hover {
        outline: 0;
        background-color: rgb(245, 247, 250);
        color: $theme-color !important;
        i {
          color: $theme-color !important;
        }
      }
    }
  }

  .right-side {
    position: fixed;
    left: 180px;
    top: 0;
    width: calc(100% - 180px);
    // box-sizing: content-box;
    background: rgb(245, 247, 250);
    height: 100%;
    .topbar {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 999;
      width: 100%;
      height: 50px;
      line-height: 50px;
      background-color: #fff;
      border-bottom: 1px solid #ececec !important;
      padding: 0 15px 0 30px;
      color: #333;
      // clear: right;
      .account-wrap {
        position: absolute;
        right: 15px;
        top: -1px;
      }
    }

    .main-content {
      margin-top: 48px;
      height: calc(100% - 48px);
      padding: 20px;
      overflow: auto;
      .content {
        background: #fff;
        width: 100%;
        min-height: 640px;
        border-radius: 2px;
      }
    }
  }

  .account-wrap {
    .el-dropdown-link {
      cursor: pointer;
    }
  }
}
</style>


