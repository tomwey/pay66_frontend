<template>
  <div class="error-403">
    <div class="body">
      <i class="el-icon-error" type="danger"></i>
      <p>您无此操作权限，禁止访问！</p>
    </div>
  </div>
</template>
<script>
export default {
  name: "not-access"
};
</script>
<style lang="scss" scoped>
.error-403 {
  //   padding: 60px;
  .body {
    // width: 88px;
    text-align: center;
    // margin: 0 auto;
    padding-top: 180px;
    font-size: 16px;
    color: #888;
    i {
      font-size: 28px;
      color: #f56c6c;
    }
  }
}
</style>
