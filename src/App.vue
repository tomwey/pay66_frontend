<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: "app",
  mounted() {
    // console.log(123);
    // 加载配置
    this.$store.dispatch("GetAppConfigs");
  }
};
</script>
