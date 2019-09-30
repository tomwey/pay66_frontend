<template>
  <div class="bind-parents" v-loading="loading">
    <!-- <div class="searchbar">
      <div class="keyword-input">
        <span class="filter-label">关键字</span>
        <el-input
          v-model="conds.keyword"
          size="small"
          placeholder="输入姓名、手机号、编号搜索"
          style="width: 278px;"
        />&emsp;
        <el-button size="small" type="primary" @click="search" plain>搜索</el-button>
      </div>
      <div class="date-control">
        <span class="filter-label">注册时间</span>
        <el-date-picker
          v-model="conds.date"
          type="daterange"
          align="right"
          size="small"
          @change="search"
          unlink-panels
          value-format="yyyy-MM-dd"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :picker-options="pickerOptions"
        ></el-date-picker>
      </div>
    </div>-->
    <search-controls :controls="searchControls" @search="search"></search-controls>
    <el-table :data="list" fit stripe style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center"></el-table-column>
      <el-table-column label="ID" prop="id" width="80" align="center"></el-table-column>
      <el-table-column label="家长名字" prop="name" align="center"></el-table-column>
      <el-table-column label="手机号" prop="mobile" align="center"></el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: "bind-parents",
  components: {
    searchControls: resolve => require(["@/components/SearchControls"], resolve)
  },
  data() {
    return {
      list: [],
      loading: false,
      searchControls: [
        {
          type: 1,
          label: "关键字",
          placeholder: "输入姓名、手机号、编号",
          field: "name,mobile,id",
          op: "kw"
        },
        {
          type: 72,
          label: "注册时间",
          field: "created_at"
        }
      ]
    };
  },
  methods: {
    search(conds) {
      //   this.loadData();
      this.loading = true;
      let params = {};
      if (conds.length > 0) {
        params.conds = JSON.stringify(conds);
      }
      // console.log(params);
      this.$get("admin/common/parent/list", params, res => {
        // console.log(res);
        this.loading = false;
        if (res.code == 0) {
          this.list = res.data;
          //   this.pager.totalSize = res.total || 0;
        }
      });
    },
    handleSelectionChange(val) {
      //   console.log(val);
      this.$emit("selected", val);
    }
  }
};
</script>

<style lang="scss" scoped>
.searchbar {
  background: rgb(247, 248, 249);
  padding: 15px;
  .keyword-input {
    margin-bottom: 15px;
    .filter-label {
      padding-left: 14px;
    }
    .el-button {
      vertical-align: 1px;
    }
  }
  .filter-label {
    display: inline-block;
    margin-right: 10px;
    vertical-align: middle;
    font-size: 14px;
    color: #333;
  }
}
</style>


