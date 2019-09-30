<template>
  <div class="student-detail">
    <div class="main-area">
      <div class="left">
        <div class="base-info">
          <img :src="currStudent.avatar || require('@/assets/default_avatar.png')" />
          <p class="name">{{currStudent.name}}</p>
          <p class="mobile">{{currStudent.mobile}}</p>
        </div>
        <div class="detail-info">
          <table class="table">
            <tr>
              <td class="label">学员编号：</td>
              <td class="value">{{currStudent.id}}</td>
            </tr>
            <tr>
              <td class="label">关联家长：</td>
              <td class="value"></td>
            </tr>
            <tr>
              <td class="label">性别：</td>
              <td class="value">{{currStudent.gender}}</td>
            </tr>
            <tr>
              <td class="label">年龄：</td>
              <td class="value">{{currStudent.age}}岁</td>
            </tr>
            <tr>
              <td class="label">在读学校：</td>
              <td class="value">{{currStudent.from_school}}</td>
            </tr>
            <tr>
              <td class="label">年级：</td>
              <td class="value">{{currStudent.grade}}</td>
            </tr>
            <tr>
              <td class="label">家庭住址：</td>
              <td class="value">{{currStudent.address}}</td>
            </tr>
          </table>
        </div>
      </div>
      <div class="right">
        <div class="tabs">
          <span
            class="tab"
            :class="{active:tabIndex == index}"
            v-for="(tab, index) in tabs"
            :key="index"
            @click="selectTab(index)"
          >{{tab.name}}</span>
        </div>

        <div class="list" v-show="tabIndex == 0">
          <el-table
            :data="list"
            fit
            stripe
            style="width: 100%"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" align="center"></el-table-column>
            <!-- <el-table-column label="ID" prop="id" align="center" width="120"></el-table-column> -->
            <el-table-column label="课程名字" align="center">Scratch入门课程</el-table-column>
            <el-table-column label="课程类型" prop="mobile" align="center" width="120"></el-table-column>
            <el-table-column label="课次" align="center" width="80"></el-table-column>
            <el-table-column label="班级" prop="school_name" align="center" width="120"></el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "detail",
  data() {
    return {
      currStudent: JSON.parse(sessionStorage.getItem("item")) || {},
      tabs: [
        {
          name: "已报课程"
        },
        {
          name: "课表"
        }
      ],
      tabIndex: 0,
      list: []
    };
  },
  methods: {
    selectTab(idx) {
      this.tabIndex = idx;
    },
    handleSelectionChange(rows) {}
  }
};
</script>
<style lang="scss" scoped>
$theme-color: #409eff;
.main-area {
  width: 100%;
  display: flex;
  .left {
    flex: 0 0 220px;
    // padding: 20px;
    border-right: 1px solid #eee;
    min-height: 640px;
  }
  .right {
    flex: 1;
    padding: 10px 20px 20px;
  }
}

.tabs {
  border-bottom: 1px solid #eee;
  .tab {
    font-size: 14px;
    font-weight: 700;
    color: #333;
    display: inline-block;
    padding: 10px 0;
    width: 56px;
    text-align: center;

    cursor: pointer;
    user-select: none;

    margin: 0 0 -1px 10px;
    &.active {
      border-bottom: 2px solid $theme-color;
      color: $theme-color;
    }
  }
}

.base-info {
  text-align: center;
  padding: 20px;
  box-sizing: content-box;
  img {
    max-width: 60px;
    border-radius: 32px;
  }
  border-bottom: 1px solid #eee;
  p {
    margin: 0;
    margin-top: 10px;
  }
  .name {
    font-size: 16px;
    font-weight: 500;
    color: #333;
  }
  .mobile {
    font-size: 12px;
    color: #999;
  }
}
.detail-info {
  padding: 20px;
  font-size: 14px;
  color: #333;
  .table {
    padding: 0;
    margin: 0;
    border: 0;
    td {
      vertical-align: top;
      padding: 5px 0;
    }
    .label {
      width: 72px;
      color: #999;
    }
    .value {
      //   width: 50%;
    }
  }
}
</style>


