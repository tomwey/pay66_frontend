<template>
  <div class="sidebar-wrapper">
    <div class="accounts">成都小么兼职</div>
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :show-timeout="200"
        :default-active="$route.path"
        :collapse="isCollapse"
        :background-color="variables.menuBg"
        :text-color="variables.menuText"
        :active-text-color="variables.menuActiveText"
        mode="vertical"
      >
        <!-- <el-submenu index="1">
        <template slot="title">
          <i class="el-icon-location"></i>
          <span slot="title">导航一</span>
        </template>
        <el-menu-item-group>
          <span slot="title">分组一</span>
          <el-menu-item index="1-1">选项1</el-menu-item>
          <el-menu-item index="1-2">选项2</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="分组2">
          <el-menu-item index="1-3">选项3</el-menu-item>
        </el-menu-item-group>
        <el-submenu index="1-4">
          <span slot="title">选项4</span>
          <el-menu-item index="1-4-1">选项1</el-menu-item>
        </el-submenu>
        </el-submenu>-->
        <el-menu-item index="1">
          <i class="el-icon-menu"></i>
          <span slot="title">概况</span>
        </el-menu-item>
        <el-menu-item index="2">
          <i class="el-icon-menu"></i>
          <span slot="title">项目管理</span>
        </el-menu-item>
        <el-menu-item index="3">
          <i class="el-icon-document"></i>
          <span slot="title">兼职管理</span>
        </el-menu-item>
        <el-menu-item index="4">
          <i class="el-icon-setting"></i>
          <span slot="title">报名管理</span>
        </el-menu-item>
        <el-menu-item index="4">
          <i class="el-icon-setting"></i>
          <span slot="title">签到联系人</span>
        </el-menu-item>
        <el-menu-item index="4">
          <i class="el-icon-setting"></i>
          <span slot="title">一级代理管理</span>
        </el-menu-item>
        <el-menu-item index="4">
          <i class="el-icon-setting"></i>
          <span slot="title">工资管理</span>
        </el-menu-item>
        <el-menu-item index="4">
          <i class="el-icon-setting"></i>
          <span slot="title">账号管理</span>
        </el-menu-item>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import variables from "@/styles/variables.scss";
import SidebarItem from "./SidebarItem";

export default {
  components: { SidebarItem },
  computed: {
    ...mapGetters(["sidebar"]),
    routes() {
      console.log(this.$router.options.routes);
      return this.$router.options.routes;
    },
    variables() {
      return variables;
    },
    isCollapse() {
      return !this.sidebar.opened;
    }
  }
};
</script>

