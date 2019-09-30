<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">班级列表</h3>
      <div class="buttons" v-if="$hasPermission(107,1002)">
        <el-button type="primary" @click="openForm">添加班级</el-button>
      </div>
    </div>
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
        <el-table-column label="ID" prop="id" align="center" width="80"></el-table-column>
        <el-table-column label="名字" prop="name" align="center" width="120"></el-table-column>
        <el-table-column label="班主任" prop="teacher_name" align="center" width="80"></el-table-column>
        <el-table-column label="所在校区" prop="school_name" align="center" width="120"></el-table-column>
        <el-table-column label="学习课程" width="180">
          <template slot-scope="scope">
            <div class="course" v-for="(item,index) in scope.row.courses" :key="index">{{item.name}}</div>
          </template>
        </el-table-column>
        <el-table-column label="学生人数" sortable prop="students_count" align="center" width="120"></el-table-column>
        <el-table-column label="开班日期" prop="found_on" align="center" width="120"></el-table-column>
        <el-table-column label="班级微信/QQ群" width="180">
          <template slot-scope="scope">
            微信号: {{scope.row.wechat}}
            <br />
            QQ号: {{scope.row.qq}}
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="memo" align="center" width="120"></el-table-column>
        <el-table-column label="创建时间" prop="create_time" width="99"></el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="150">
          <template slot-scope="scope">
            <el-button
              size="mini"
              v-if="$hasPermission(107,1004)"
              style="margin-bottom: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>
            <el-button
              size="mini"
              type="danger"
              v-if="$hasPermission(107,1008)"
              style="margin-bottom: 10px;"
              @click="deleteItem(scope.row);"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="bottom-bar">
      <!-- <div class="batch-actions">
        <span class="selected-rows">已选10条</span>
        <span class="actions">
          <span class="batch-tip">&nbsp;|&nbsp;批量</span>
          <el-button>导出</el-button>
          <el-button>删除</el-button>
          <el-button>启用</el-button>
          <el-button>禁用</el-button>
        </span>
      </div>-->
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
    <!-- 表单 -->
    <el-dialog
      :title="isAdd ? '添加班级' : '修改班级'"
      :visible.sync="isShow"
      width="580px"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @open="openModel"
      center
    >
      <comm-form :controls="controls" ref="commForm" :form-data="formData"></comm-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="isShow = false">取 消</el-button>
        <el-button type="primary" v-loading="commiting" @click="commit">提 交</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { MobileCheck } from "@/components/CommForm/validators";

export default {
  name: "list",
  components: {
    commForm: resolve => require(["@/components/CommForm"], resolve),
    stateTag: resolve => require(["@/components/state-tag"], resolve),
    searchControls: resolve => require(["@/components/SearchControls"], resolve)
  },
  data() {
    return {
      loading: false,
      commiting: false,
      list: [],
      isAdd: false,
      isShow: false,
      conds: [],
      searchControls: [
        {
          type: 1,
          label: "名字",
          field: "name",
          op: "lk"
        },
        {
          type: 2,
          label: "班主任",
          field: "teacher_id",
          options: []
        },
        {
          type: 2,
          label: "所在校区",
          field: "school_id",
          options: []
        },
        {
          type: 2,
          label: "学习课程",
          field: "__assoc_course_id",
          options: []
        },
        {
          type: 72,
          label: "开班日期",
          field: "found_on"
        },
        {
          type: 72,
          label: "创建时间",
          field: "created_at"
        }
      ],

      pager: {
        totalSize: 0,
        pageSize: 20,
        page: 1,
        changeFunc: val => {
          this.pager.page = val;
          this.loadData(this.conds);
        }
      },
      controls: [
        {
          label: "名字",
          field: "name",
          type: 1,
          rules: [{ required: true, message: "名字不能为空", trigger: "blur" }]
        },
        {
          label: "班主任",
          field: "teacher_id",
          type: 2,
          options: [],
          rules: [
            { required: true, message: "班主任不能为空", trigger: "change" }
          ]
        },
        {
          label: "所属校区",
          field: "school_id",
          type: 2,
          options: [],
          rules: [
            { required: true, message: "所属校区不能为空", trigger: "change" }
          ]
        },
        {
          label: "学习课程",
          field: "course_ids",
          type: 4,
          options: [],
          rules: [
            { required: true, message: "学习课程不能为空", trigger: "change" }
          ]
        },
        {
          label: "开班日期",
          field: "found_on",
          type: 7
        },
        {
          label: "班级QQ群",
          field: "qq",
          type: 1
        },
        {
          label: "班级微信群",
          field: "wechat",
          type: 1
        },
        {
          label: "备注",
          field: "memo",
          type: 1,
          rules: []
        }
      ],
      formData: {}
    };
  },
  watch: {},
  mounted() {
    this.loadData();
    this.loadSchools();
    this.loadCourses();
    this.loadTeachers();
  },
  methods: {
    loadTeachers() {
      this.$get(
        "admin/common/teacher/list",
        { conds: JSON.stringify([{ k: "_type", op: "=", v: 1 }]) },
        res => {
          if (res.code == 0) {
            let temp = [];
            res.data.forEach(ele => {
              temp.push({ label: ele.name, value: ele.id });
            });
            this.controls[1].options = temp;
            this.searchControls[1].options = temp;
          }
        }
      );
    },
    loadSchools() {
      this.$get("admin/common/school/list", null, res => {
        if (res.code == 0) {
          let temp = [];
          res.data.forEach(ele => {
            temp.push({ label: ele.name, value: ele.id });
          });
          this.controls[2].options = temp;
          this.searchControls[2].options = temp;
        }
      });
    },
    loadCourses() {
      this.$get("admin/common/course/list", null, res => {
        if (res.code == 0) {
          let temp = [];
          res.data.forEach(ele => {
            temp.push({ label: ele.name, value: ele.id });
          });
          this.controls[3].options = temp;
          this.searchControls[3].options = temp;
        }
      });
    },
    loadData(conds = []) {
      this.conds = conds || [];
      this.loading = true;
      let params = {};
      params.page = this.pager.page;
      params.size = this.pager.pageSize;

      if (this.conds.length > 0) {
        params.conds = JSON.stringify(this.conds);
      }

      this.$get("admin/common/sys_class/list", params, res => {
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
    handleSelectionChange(rows) {},
    openForm(type) {
      this.formData = { course_ids: [] };
      this.loadTeachers();
      this.loadSchools();
      this.loadCourses();
      this.isAdd = true;
      this.isShow = true;
    },
    openModel() {
      // this.$refs.commForm.clearValidates();
      this.$refs.commForm && this.$refs.commForm.clearValidates();
    },
    editItem(item) {
      this.formData = Object.assign({}, item);
      this.loadTeachers();
      this.loadSchools();
      this.loadCourses();
      this.isAdd = false;
      this.isShow = true;
    },
    deleteItem(item) {
      this.$confirm("删除后不能恢复，您确定吗？", "删除提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.loading = true;
          this.$post("admin/common/sys_class/delete", { ids: item.id }, res => {
            this.loading = false;
            if (res.code == 0) {
              this.$message({
                type: "success",
                message: "删除成功"
              });
              this.list.splice(this.list.indexOf(item), 1);
              this.pager.totalSize -= 1;
            }
          });
        })
        .catch();
    },
    openItem(item, flag) {
      this.loading = true;
      this.$post(
        "admin/common/sys_class/open_or_close",
        { ids: item.id, state: flag ? 1 : 0 },
        res => {
          this.loading = false;
          if (res.code == 0) {
            item.opened = flag;
          }
        }
      );
    },
    commit() {
      this.$refs.commForm.validateFields(valid => {
        if (valid) {
          this.doCommit();
        }
      });
    },
    doCommit() {
      this.commiting = true;
      this.$post(
        "admin/common/sys_class/save",
        {
          id: this.formData.id,
          payload: JSON.stringify(this.formData)
        },
        res => {
          this.commiting = false;
          if (res.code == 0) {
            this.isShow = false;
            this.$message({
              type: "success",
              message: "提交成功！"
            });
            this.loadData();
          }
        }
      );
    }
  }
};
</script>
<style lang="scss" scoped>
</style>

