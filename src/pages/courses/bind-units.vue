<template>
  <div class="list-wrapper panel" v-loading="loading">
    <search-controls :controls="searchControls" @search="loadData"></search-controls>
    <div class="list">
      <el-table
        :data="list"
        fit
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center"></el-table-column>
        <el-table-column label="封面图" align="center" width="120">
          <template slot-scope="scope">
            <img :src="scope.row.cover_url" style="max-width: 100%;" />
          </template>
        </el-table-column>
        <el-table-column label="单元名称" prop="name" width="150"></el-table-column>
        <el-table-column label="单元简介" prop="intro"></el-table-column>
        <el-table-column label="上课时长(分钟)" prop="teach_length" align="center" width="120"></el-table-column>
        <el-table-column label="单元内容" align="center" width="100">
          <template slot-scope="scope">
            <span class="view-content" @click="viewBody(scope.row);">查看内容</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="memo" align="center" width="120"></el-table-column>
        <el-table-column label="在该课程中顺序" align="center" width="120">
          <template slot-scope="scope">
            <el-input type="number" v-model="scope.row.sort"></el-input>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="bottom-bar">
      <div class="page-container">
        <span class="total">共{{pager.totalSize}}条</span>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="pager.totalSize"
          :page-size="pager.pageSize"
          :current-page="pager.page"
          @current-change="pager.changeFunc"
        ></el-pagination>
      </div>
    </div>

    <!-- 课程单元内容查看 -->
    <el-dialog
      :title="currUnit.name"
      :visible.sync="showUnitContent"
      width="80%"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      center
    >
      <el-table
        :data="contents"
        fit
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center"></el-table-column>
        <el-table-column label="内容名称" prop="name"></el-table-column>
        <el-table-column label="内容类型" prop="type_name" align="left" width="120"></el-table-column>
        <el-table-column label="文件附件" align="center" width="120">
          <template slot-scope="scope">
            <a :href="scope.row.file_url" target="_blank">下载附件</a>
          </template>
        </el-table-column>
        <el-table-column label="文件大小" align="right" width="120">
          <template slot-scope="scope">{{scope.row.file_size | calcFileSize}}</template>
        </el-table-column>
        <el-table-column label="下载/打开次数" prop="download_count" align="center" width="140"></el-table-column>
        <el-table-column label="备注" prop="memo" align="center" width="120"></el-table-column>
        <el-table-column label="创建时间" prop="create_time" width="180"></el-table-column>
        <!--<el-table-column label="操作" align="center" width="80">
          <template slot-scope="scope">
            <el-button size="mini" style="margin-bottom: 10px;" @click="openForm(scope.row);">编辑</el-button>
            <el-button
              size="mini"
              type="danger"
              style="margin-bottom: 10px;"
              @click="deleteItem(scope.row);"
            >删除</el-button>
          </template>
        </el-table-column>-->
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showUnitContent = false" size="small">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
export default {
  name: "bind-units",
  props: {
    course: {
      type: Object,
      required: true
    }
  },
  components: {
    commForm: resolve => require(["@/components/CommForm"], resolve),
    stateTag: resolve => require(["@/components/state-tag"], resolve),
    searchControls: resolve => require(["@/components/SearchControls"], resolve)
  },
  data() {
    return {
      loading: false,
      list: [],
      conds: [],
      searchControls: [
        {
          type: 1,
          label: "关键字",
          placeholder: "输入名字、简介",
          field: "name,intro",
          op: "kw"
        },
        {
          type: 1,
          label: "单元编号",
          field: "id"
        },
        {
          type: 2,
          label: "上架状态",
          field: "state",
          options: [
            {
              label: "全部",
              value: "-1"
            },
            {
              label: "已上架",
              value: 1
            },
            {
              label: "已下架",
              value: 0
            }
          ],
          key: "opened"
        },
        {
          type: 72,
          label: "创建时间",
          field: "created_at"
        }
      ],
      currUnit: {},
      contents: [],
      showUnitContent: false,
      pager: {
        totalSize: 0,
        pageSize: 20,
        page: 1,
        changeFunc: val => {
          this.pager.page = val;
          this.loadData(this.conds);
        }
      }
    };
  },
  watch: {},
  mounted() {
    this.loadData([]);
  },
  methods: {
    loadData(conds) {
      this.conds = conds || [];
      this.loading = true;
      let params = {};
      params.page = this.pager.page;
      params.size = this.pager.pageSize;

      if (this.conds.length > 0) {
        params.conds = JSON.stringify(this.conds);
      }

      this.$get("admin/common/course_unit/list", params, res => {
        // console.log(res);
        this.loading = false;
        if (res.code == 0) {
          this.list = res.data;
          this.pager.totalSize = res.total || 0;
        }
      });
      // console.log(this.pager.page);
    },
    search() {
      this.loadData();
    },
    handleSelectionChange(rows) {
      console.log(rows);
    },
    openForm(unit) {
      if (unit) {
        sessionStorage.setItem("item", JSON.stringify(unit));
      } else {
        sessionStorage.setItem("item", null);
      }
      this.$router.push({
        path: !!unit ? "/courses/units/edit" : "/courses/units/new"
      });
    },
    deleteItem(item) {
      this.$confirm("删除后不能恢复，您确定吗？", "删除提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.loading = true;
          this.$post(
            "admin/common/course_unit/delete",
            { ids: item.id },
            res => {
              this.loading = false;
              if (res.code == 0) {
                this.$message({
                  type: "success",
                  message: "删除成功"
                });
                this.list.splice(this.list.indexOf(item), 1);
                this.pager.totalSize -= 1;
              }
            }
          );
        })
        .catch();
    },
    openItem(item, flag) {
      this.loading = true;
      this.$post(
        "admin/common/course_unit/open_or_close",
        { ids: item.id, state: flag ? 1 : 0 },
        res => {
          this.loading = false;
          if (res.code == 0) {
            item.opened = flag;
          }
        }
      );
    },
    viewBody(item) {
      this.currUnit = item;
      this.contents = item.contents;
      this.showUnitContent = true;
    }
  }
};
</script>
<style lang="scss" scoped>
.view-content {
  display: inline-block;
  padding: 10px;
  font-size: 14px;
  color: #409eff;
  cursor: pointer;
  user-select: none;
}
.list-wrapper {
  padding-bottom: 20px !important;
}
</style>


