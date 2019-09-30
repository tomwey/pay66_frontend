<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">作业提交列表</h3>
      <div class="buttons" v-if="$hasPermission(116,1002)">
        <el-button type="primary" @click="openForm">提交作业</el-button>
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
        <el-table-column label="作业名称" prop="title" align="center" width="120"></el-table-column>
        <!-- <el-table-column label="" prop="intro" align="center" width="150"></el-table-column> -->
        <el-table-column label="封面图" align="cover" width="120">
          <template slot-scope="scope">
            <img
              :src="scope.row.cover_url || require('@/assets/default_avatar.png')"
              style="width:100%;"
            />
          </template>
        </el-table-column>
        <el-table-column label="学生/班级" align="center" width="150">
          <template slot-scope="scope">
            <span
              class="student-link"
              @click="viewStudent(scope.row);"
            >{{scope.row.student.name}} / {{scope.row.school.name}} {{scope.row.sys_class.name}}</span>
          </template>
        </el-table-column>
        <el-table-column label="批改作业老师" align="center" width="120">
          <template slot-scope="scope">{{scope.row.teacher.name}}</template>
        </el-table-column>
        <el-table-column label="课程/课次/作业" align="center" width="150">
          <template slot-scope="scope">
            <span
              class="student-link"
              @click="viewStudent(scope.row);"
            >{{scope.row.course.name}} / 第{{scope.row.course_order}}次课 / {{scope.row.course_assignment.name}}</span>
          </template>
        </el-table-column>
        <el-table-column label="作业内容附件" width="150" align="center">
          <template slot-scope="scope">
            <span class="student-link" @click="viewAnnex(scope.row)">查看/下载附件</span>
          </template>
        </el-table-column>
        <el-table-column label="作业描述" width="120" align="center">
          <template slot-scope="scope">
            <div v-html="scope.row.body"></div>
          </template>
        </el-table-column>
        <el-table-column label="作业打分" sortable prop="score" align="center" width="120"></el-table-column>
        <el-table-column label="老师评语" prop="teacher_comment" align="center" width="120"></el-table-column>
        <el-table-column label="备注" prop="memo" align="center" width="80"></el-table-column>
        <el-table-column label="创建时间" prop="create_time" width="99"></el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="150">
          <template slot-scope="scope">
            <el-button
              size="mini"
              v-if="$hasPermission(116,1004)"
              style="margin-bottom: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>
            <el-button
              size="mini"
              v-if="$hasPermission(116,1008)"
              type="danger"
              style="margin-bottom: 10px;"
              @click="deleteItem(scope.row);"
            >删除</el-button>
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
    <!-- 表单 -->
    <el-dialog
      :title="isAdd ? '作业提交' : '作业信息修改'"
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

    <!-- 预览作业附件 -->
    <el-dialog
      :title="'作业内容附件查看'"
      :visible.sync="annexDialogShow"
      width="580px"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      center
    >
      <div style="text-align: center">
        <img :src="imgAnnex" style="width: 100%" v-if="!!imgAnnex" />
        <video :src="videoAnnex" height="300" autoplay v-if="!!videoAnnex" controls></video>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="annexDialogShow = false">关 闭</el-button>
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
    let that = this;
    return {
      loading: false,
      commiting: false,
      list: [],
      isAdd: false,
      isShow: false,
      annexDialogShow: false,
      currAnnex: null,
      imgAnnex: null,
      videoAnnex: null,
      conds: [],
      searchControls: [
        {
          type: 1,
          label: "作业名称",
          field: "title",
          // placeholder: "输入名字、简介",
          // key: "name,intro",
          op: "lk"
        },
        {
          type: 2,
          label: "所属校区",
          field: "school_id",
          options: [],
          key: "school_id"
        },
        {
          type: 21,
          label: "所属班级",
          field: "class_id",
          options: [],
          key: "class_id",
          changeFunc: val => {
            this.loadClasses(val, 1);
          }
        },
        {
          type: 21,
          label: "所属学生",
          field: "student_id",
          options: [],
          key: "student_id",
          changeFunc: val => {
            this.loadClasses(val);
          }
        },
        {
          type: 2,
          label: "作业老师",
          field: "teacher_id",
          options: []
        },
        {
          type: 2,
          label: "所属课程",
          field: "course_id",
          options: []
        },
        {
          type: 21,
          label: "所属作业",
          field: "cuc_id",
          options: [],
          changeFunc: val => {}
        },
        {
          type: 72,
          label: "提交时间",
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
          label: "作业名字",
          field: "title",
          placeholder: "一句话描述作业",
          type: 1,
          rules: [
            { required: true, message: "作业名字不能为空", trigger: "blur" }
          ]
        },
        {
          label: "所属班级/学生",
          field: "student_id",
          type: 21,
          options: [],
          props: {},
          changeFunc: val => {
            this.loadClasses(val);
          },
          rules: [
            { required: true, message: "所属学生不能为空", trigger: "change" }
          ]
        },
        {
          label: "批改作业老师",
          field: "teacher_id",
          type: 2,
          options: [],
          rules: [
            {
              required: true,
              message: "批改作业老师不能为空",
              trigger: "change"
            }
          ]
        },
        {
          label: "所属课程/作业",
          field: "cuc_id",
          type: 21,
          options: [],
          props: {},
          changeFunc: val => {
            // console.log(val);
            // this.loadUnitContents(val);
          },
          rules: [
            { required: true, message: "所属作业不能为空", trigger: "change" }
          ]
        },
        {
          label: "封面图",
          field: "cover",
          type: 8,
          accept: ".jpg,.jpeg,.png,.gif",
          rules: [
            { required: true, message: "封面图不能为空", trigger: "blur" }
          ]
        },
        {
          label: "作业内容附件",
          field: "annex",
          type: 8,
          fileSize: 50,
          rules: [
            //{ required: true, message: "封面图不能为空", trigger: "blur" }
          ]
        },
        {
          label: "作业描述",
          field: "body",
          type: 12,
          rules: []
        },
        {
          label: "作业打分",
          field: "score",
          type: 1,
          subtype: "number"
        },
        {
          label: "老师评语",
          field: "teacher_comment",
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
    viewAnnex(assignment) {
      // console.log(assignment.annex_asset);
      this.currAnnex = assignment.annex_asset;
      this.imgAnnex = null;
      this.videoAnnex = null;

      if (this.currAnnex) {
        if (this.currAnnex.content_type.indexOf("image/") >= 0) {
          this.imgAnnex = this.currAnnex.url;
          this.annexDialogShow = true;
        } else if (
          this.currAnnex.content_type.indexOf("/mp4") >= 0 ||
          this.currAnnex.content_type.indexOf("/mov") >= 0 ||
          this.currAnnex.content_type.indexOf("/3gp") >= 0
        ) {
          this.videoAnnex = this.currAnnex.url;
          this.annexDialogShow = true;
        } else {
          window.open(this.currAnnex.url);
        }
      } else {
        this.$message({
          type: "error",
          message: "附件不存在"
        });
      }
    },
    loadTeachers() {
      this.$get(
        "admin/common/teacher/list",
        { conds: JSON.stringify([{ k: "_type", op: "=", v: 2 }]) },
        res => {
          let temp = [];
          if (res.code == 0) {
            (res.data || []).forEach(ele => {
              temp.push({
                label: ele.name,
                value: ele.id
              });
            });
          }
          this.searchControls[4].options = temp;

          for (let i = 0; i < this.controls.length; i++) {
            if (this.controls[i].field === "teacher_id") {
              this.controls[i].options = temp;
              break;
            }
          }
          // resolve(temp);
        }
      );
    },
    loadCourses() {
      this.$get("admin/common/course/list", null, res => {
        let temp = [];
        if (res.code == 0) {
          (res.data || []).forEach(ele => {
            let temp1 = [];
            ele.units.forEach(unit => {
              let temp2 = [];
              (unit.assignments || []).forEach(c => {
                temp2.push({
                  label: c.name,
                  value: c.id
                });
              });
              temp1.push({
                label: unit.name + ` (${temp2.length})`,
                value: unit.id,
                children: temp2
              });
            });

            temp.push({
              label: ele.name + ` (${temp1.length})`,
              value: ele.id,
              leaf: false,
              children: temp1
            });
          });
        }

        for (let i = 0; i < this.controls.length; i++) {
          if (this.controls[i].field === "cuc_id") {
            this.controls[i].options = temp;
            break;
          }
        }

        this.searchControls[5].options = temp;
        this.searchControls[6].options = temp;
        // resolve(temp);
      });
    },
    loadSchools() {
      this.$get("admin/common/school/list", null, res => {
        let temp = [];
        if (res.code == 0) {
          (res.data || []).forEach(ele => {
            temp.push({
              label: ele.name,
              value: ele.id,
              leaf: false,
              children: []
            });
          });
        }
        this.searchControls[1].options = temp;
        this.searchControls[2].options = temp;
        this.searchControls[3].options = temp;

        for (let i = 0; i < this.controls.length; i++) {
          if (this.controls[i].field === "student_id") {
            this.controls[i].options = temp;
            break;
          }
        }
        // resolve(temp);
      });
    },
    loadClasses(val, level = 2) {
      // console.log(Val);
      let value = val[0];
      this.$get(
        "admin/common/sys_class/list",
        { conds: JSON.stringify([{ k: "school_id", op: "=", v: value }]) },
        res => {
          if (res.code == 0) {
            let arr = this.controls[1].options || [];
            for (let i = 0; i < arr.length; i++) {
              if (arr[i].value === value) {
                let temp = [];
                res.data.forEach(ele => {
                  let temp2 = [];
                  if (level === 2) {
                    (ele.students || []).forEach(s => {
                      temp2.push({
                        label: s.name,
                        value: s.id
                      });
                    });
                    temp.push({
                      label: ele.name + ` (${temp2.length})`,
                      value: ele.id,
                      children: temp2
                    });
                  } else {
                    temp.push({
                      label: ele.name,
                      value: ele.id
                    });
                  }
                });
                arr[i].children = temp;
                break;
              }
            }
          }
        }
      );
    },
    loadData(conds = []) {
      this.conds = conds || [];
      this.loading = true;
      let params = {};
      params.page = this.pager.page;
      params.size = this.pager.pageSize;

      if (this.conds.length > 0) {
        let temp2 = [];
        this.conds.forEach(ele => {
          let value = ele.v;
          if (ele.k === "student_id") {
            value = value.split(",");
            value = value[value.length - 1];
          } else if (ele.k === "class_id") {
            value = value.split(",");
            value = value[value.length - 1];
          } else if (ele.k === "cuc_id") {
            value = value.split(",");
            value = value[value.length - 1];
          }
          temp2.push({ k: ele.k, op: ele.op || "=", v: value });
        });
        params.conds = JSON.stringify(temp2);
      }

      this.$get("admin/common/assignment/list", params, res => {
        this.loading = false;
        if (res.code == 0) {
          this.list = res.data;
          this.pager.totalSize = res.total || 0;
        }
      });
    },
    search() {
      this.loadData();
    },
    handleSelectionChange(rows) {},
    openForm(type) {
      this.formData = {};
      this.isAdd = true;
      this.isShow = true;

      this.loadSchools();
      this.loadCourses();
      this.loadTeachers();
      // this.loadAssignments();
    },
    openModel() {
      // this.$refs.commForm.clearValidates();
      this.$refs.commForm && this.$refs.commForm.clearValidates();
    },
    editItem(item) {
      this.formData = Object.assign({}, item);
      this.formData["student_id"] = [
        item.school_id,
        item.class_id,
        item.student_id
      ];
      this.formData["cuc_id"] = [
        item.course_id,
        (item.course_assignment || {}).course_unit_id,
        item.cuc_id
      ];

      // console.log(this.formData);

      this.isAdd = false;
      this.isShow = true;

      this.loadSchools();
      this.loadClasses([item.school_id]);
      this.loadCourses();
      this.loadTeachers();
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
            "admin/common/assignment/delete",
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
    commit() {
      this.$refs.commForm.validateFields(valid => {
        if (valid) {
          this.doCommit();
        }
      });
    },
    doCommit() {
      this.commiting = true;
      let student_id = this.formData.student_id;
      let cuc_id = this.formData.cuc_id;
      let params = Object.assign({}, this.formData);
      // console.log(params);
      if (Array.isArray(student_id) && student_id.length > 2) {
        // student_id = student_id[1];
        params["student_id"] = student_id[2];
        params["class_id"] = student_id[1];
        params["school_id"] = student_id[0];
      }

      if (Array.isArray(cuc_id) && cuc_id.length > 2) {
        // student_id = student_id[1];
        params["cuc_id"] = cuc_id[2];
        params["course_id"] = cuc_id[0];
      }

      this.$post(
        "admin/common/assignment/save",
        {
          id: this.formData.id,
          payload: JSON.stringify(params)
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
.student-link {
  display: inline-block;
  font-size: 14px;
  color: #409eff;
  padding: 10px;
  cursor: pointer;
  user-select: none;
}
</style>

