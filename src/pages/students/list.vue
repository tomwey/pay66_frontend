<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">学生列表</h3>
      <div class="buttons">
        <!-- <el-button @click="createClass">组班</el-button> -->
        <!-- <el-button @click="batchImport">批量导入学生</el-button> -->
        <el-upload
          ref="upload"
          action="/"
          :show-file-list="false"
          :on-change="importExcel"
          :auto-upload="false"
          v-if="$hasPermission(108,1013)"
          style="display: inline-block;"
        >
          <el-button slot="trigger" icon="el-icon-upload" size="small">批量导入学生</el-button>
        </el-upload>&emsp;
        <el-button v-if="$hasPermission(108,1002)" type="primary" @click="openForm">添加学生信息</el-button>
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
        <!-- <el-table-column label="ID" prop="id" align="center" width="120"></el-table-column> -->
        <el-table-column label="名字" align="center" width="80">
          <template slot-scope="scope">
            <a
              href="javascript:;"
              class="name-link"
              @click="showDetail(scope.row);"
            >{{scope.row.name}}</a>
          </template>
        </el-table-column>
        <el-table-column label="手机号" prop="mobile" align="center" width="120"></el-table-column>
        <el-table-column label="头像" align="center" width="80">
          <template slot-scope="scope">
            <img
              :src="scope.row.avatar_url || require('../../assets/default_avatar.png')"
              style="width: 32px;height: 32px;"
            />
          </template>
        </el-table-column>
        <el-table-column label="所属校区" prop="school_name" align="center" width="120"></el-table-column>
        <el-table-column label="学习班级" width="180">
          <template slot-scope="scope">
            <div v-for="(p,index) in scope.row.classes" :key="index">{{index + 1}}、{{p.name}}</div>
          </template>
        </el-table-column>
        <el-table-column label="家长信息" width="180">
          <template slot-scope="scope">
            <div v-for="(p,index) in scope.row.parents" :key="index">{{p.name}}&nbsp;{{p.mobile}}</div>
            <el-button
              type="primary"
              v-if="$hasPermission(108,1020)"
              plain
              size="mini"
              @click="bindParents(scope.row);"
            >绑定家长</el-button>
          </template>
        </el-table-column>
        <el-table-column label="性别/年龄" align="center" width="120">
          <template slot-scope="scope">{{scope.row.gender}}&nbsp;{{scope.row.age}}岁</template>
        </el-table-column>
        <el-table-column label="在读学校/年级" align="center" width="150">
          <template
            slot-scope="scope"
          >{{scope.row.from_school && scope.row.from_school.name}}&nbsp;{{scope.row.grade && scope.row.grade.name}}</template>
        </el-table-column>
        <el-table-column label="住址" prop="address" align="center" width="150"></el-table-column>
        <el-table-column label="注册时间" prop="create_time" width="99"></el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="150">
          <template slot-scope="scope">
            <el-button
              size="mini"
              v-if="$hasPermission(108,1004)"
              style="margin-bottom: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>
            <el-button
              size="mini"
              v-if="$hasPermission(108,1008)"
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
        <span class="total">共{{pager.totalSize}}条，每页{{pager.pageSize}}条</span>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="pager.totalSize"
          :page-size="pager.pageSize"
          :current-page="pager.page"
          v-if="pager.totalSize >= pager.pageSize"
          @current-change="pager.changeFunc"
        ></el-pagination>
      </div>
    </div>

    <!-- 表单 -->
    <el-dialog
      :title="isAdd ? '添加学生信息' : '修改学生信息'"
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

    <!-- 绑定家长 -->
    <el-dialog
      title="绑定家长"
      :visible.sync="parentsDialogVisible"
      width="580px"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @open="openModel"
      center
    >
      <bind-parents @selected="didSelect"></bind-parents>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="parentsDialogVisible = false">取 消</el-button>
        <el-button
          size="small"
          type="primary"
          :disabled="selectedParents.length === 0"
          v-loading="commiting"
          @click="bind"
        >确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import { MobileCheck } from "@/components/CommForm/validators";
import XLSX from "xlsx";

export default {
  name: "list",
  components: {
    commForm: resolve => require(["@/components/CommForm"], resolve),
    bindParents: resolve => require(["./bind-parents"], resolve),
    searchControls: resolve => require(["@/components/SearchControls"], resolve)
  },
  data() {
    return {
      loading: false,
      commiting: false,
      list: [],
      isAdd: false,
      isShow: false,
      parentsDialogVisible: false,
      selectedParents: [],
      currStudent: null,
      conds: [],
      searchControls: [
        {
          type: 1,
          label: "学生名字",
          field: "name",
          op: "lk"
        },
        {
          type: 1,
          label: "学生编号",
          field: "id",
          op: "lk"
        },
        {
          type: 3,
          label: "学生性别",
          field: "gender",
          options: [
            {
              label: "男",
              value: "男"
            },
            {
              label: "女",
              value: "女"
            },
            {
              label: "未知",
              value: "未知"
            }
          ],
          op: "="
        },
        {
          type: 2,
          label: "在读学校",
          field: "attend_school_id",
          changeFunc: (control, value) => {
            // console.log(control, value);
            // this.searchControls[4].options =
            if (!value) {
              this.searchControls[4].options = [];
            } else {
              this.loadGrades(value);
            }
          },
          options: [],
          op: "="
        },
        {
          type: 2,
          label: "在读年级",
          field: "grade_id",
          options: [],
          op: "="
        },
        {
          type: 1,
          label: "家长信息",
          field: "kw",
          placeholder: "输入家长名字、手机",
          key: "__assoc_parents_name_mobile",
          op: "="
        },
        {
          type: 2,
          label: "所属校区",
          field: "school_id",
          options: [],
          op: "="
        },
        {
          type: 2,
          label: "学习班级",
          field: "__assoc_class_id",
          options: [],
          op: "="
        },
        {
          type: 72,
          label: "注册时间",
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
          label: "手机号",
          field: "mobile",
          type: 1,
          rules: [
            { required: true, message: "手机号不能为空", trigger: "blur" },
            { validator: MobileCheck, trigger: "change" }
          ]
        },
        {
          label: "头像",
          field: "avatar",
          type: 8,
          accept: ".jpg,.png,.gif,.jpeg"
        },
        {
          label: "所属校区",
          field: "school_id",
          type: 2,
          options: [],
          rules: [
            { required: true, message: "所属校区不能为空", trigger: "change" }
          ],
          changeFunc: (control, value) => {
            this.loadClasses(value);
          }
        },
        {
          label: "学习班级",
          field: "class_ids",
          type: 4,
          options: []
        },
        {
          label: "家庭住址",
          field: "address",
          type: 1,
          rules: [
            { required: true, message: "家庭住址不能为空", trigger: "blur" }
          ]
        },
        {
          label: "年龄",
          field: "age",
          type: 1,
          subtype: "number",
          rules: []
        },
        {
          label: "性别",
          field: "gender",
          type: 3,
          options: [
            {
              label: "男",
              value: "男"
            },
            {
              label: "女",
              value: "女"
            },
            {
              label: "未知",
              value: "未知"
            }
          ],
          rules: []
        },
        {
          label: "在读学校/年级",
          field: "from_school",
          type: 21,
          options: [],
          rules: [],
          changeFunc: val => {}
        },
        // {
        //   label: "在读年级",
        //   field: "grade",
        //   type: 2,
        //   options: [
        //     {
        //       label: "二年级",
        //       value: "二年级"
        //     },
        //     {
        //       label: "三年级",
        //       value: "三年级"
        //     },
        //     {
        //       label: "四年级",
        //       value: "四年级"
        //     }
        //   ],
        //   rules: []
        // },
        // {
        //   label: "头像",
        //   field: "avatar",
        //   type: 1,
        //   rules: []
        // },,

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
    this.loadOptions();
    this.loadClasses();
    this.loadSchools();
  },
  methods: {
    importExcel(file) {
      const types = file.name.split(".")[1];
      const fileType = ["xlsx", "xlc", "xlm", "xls", "xlt", "xlw", "csv"].some(
        item => item === types
      );
      if (!fileType) {
        alert("格式错误！请重新选择");
        return;
      }

      this.file2Xce(file).then(tabJson => {
        if (tabJson && tabJson.length > 0) {
          this.xlsxJson = tabJson;
          // console.log(tabJson[0]["sheet"]);
          this.importData(tabJson[0]["sheet"]);
        }
      });
    },
    importData(data) {
      this.loading = true;
      this.$post(
        "admin/common/student/import",
        { payload: JSON.stringify(data) },
        res => {
          this.loading = false;
          if (res.code == 0) {
            this.$message({
              type: "success",
              message: res.message
            });
            this.loadData();
          } else {
            this.$message({
              type: "error",
              message: res.message
            });
          }
        }
      );
    },
    file2Xce(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const data = e.target.result;
          this.wb = XLSX.read(data, {
            type: "binary"
          });
          const result = [];
          this.wb.SheetNames.forEach(sheetName => {
            result.push({
              sheetName: sheetName,
              sheet: XLSX.utils.sheet_to_json(this.wb.Sheets[sheetName])
            });
          });
          resolve(result);
        };
        reader.readAsBinaryString(file.raw);
      });
    },
    loadClasses(school_id = null) {
      let conds = JSON.stringify([{ k: "school_id", op: "=", v: school_id }]);
      this.$get("admin/common/sys_class/list", { conds: conds }, res => {
        if (res.code == 0) {
          let arr = res.data;
          let temp = [];
          arr.forEach(s => {
            temp.push({ label: s.name, value: s.id });
          });
          this.controls[4].options = temp;
          this.searchControls[7].options = temp;
        }
      });
    },
    loadSchools() {
      this.$get("admin/common/attend_school/list", null, res => {
        if (res.code == 0) {
          let arr = res.data;
          let temp = [];
          arr.forEach(ele => {
            let temp2 = [];
            (ele.grades || []).forEach(g => {
              temp2.push({ label: g.name, value: g.id });
            });
            temp.push({ label: ele.name, value: ele.id, children: temp2 });
          });
          // arr.forEach(s => {
          //   temp.push({ label: s.name, value: s.id });
          // });
          this.controls[8].options = temp;
          this.searchControls[3].options = temp;
        }
      });
    },
    loadGrades(school_id) {
      this.$get(
        "admin/common/attend_grade/list",
        {
          conds: JSON.stringify([
            { k: "attend_school_id", op: "=", v: school_id }
          ])
        },
        res => {
          if (res.code == 0) {
            let temp = [];
            (res.data || []).forEach(e => {
              temp.push({ label: e.name, value: e.id });
            });
            this.searchControls[4].options = temp;
          }
        }
      );
    },
    bindParents(stu) {
      this.parentsDialogVisible = true;
      this.currStudent = stu;
    },
    didSelect(val) {
      // console.log(val);
      this.selectedParents = Object.assign([], val);
    },
    bind() {
      // console.log(this.selectedParents);

      let ids = [];
      this.selectedParents.forEach(sp => {
        ids.push(sp.id);
      });

      if (!this.currStudent || ids.length == 0) return;

      this.commiting = true;
      this.$post(
        "admin/students/" + this.currStudent.id + "/bind_parents",
        { pids: ids },
        res => {
          this.commiting = false;
          if (res.code == 0) {
            this.$message({
              type: "success",
              message: "绑定成功！"
            });
            this.parentsDialogVisible = false;
            setTimeout(() => {
              this.pager.page = 1;
              this.loadData();
            }, 20);
          } else {
          }
        }
      );
    },
    getParentsInfo(stu) {
      var html = "";
      stu.parents.forEach(p => {
        html += `<p>${p.name} ${p.mobile}</p>`;
      });
      return html;
    },
    showDetail(item) {
      sessionStorage.setItem("item", JSON.stringify(item));
      this.$router.push({ path: "/students/" + item.id });
    },
    batchImport() {},
    loadData(conds = []) {
      this.conds = conds || [];

      this.loading = true;
      let params = { sorts: JSON.stringify([{ k: "created_at", v: "desc" }]) };
      params.page = this.pager.page;
      params.size = this.pager.pageSize;

      if (this.conds.length > 0) {
        params.conds = JSON.stringify(this.conds);
      }

      this.$get("admin/common/student/list", params, res => {
        // console.log(res);
        this.loading = false;
        if (res.code == 0) {
          this.list = res.data;
          this.pager.totalSize = res.total || 0;
        }
      });
      // console.log(this.pager.page);
    },
    handleSelectionChange(rows) {},
    openForm(type) {
      this.formData = {};
      this.isAdd = true;
      this.isShow = true;
      this.loadOptions();
      this.loadSchools();
      this.loadClasses(null);
    },
    openModel() {
      // this.$refs.commForm.clearValidates();
      this.$refs.commForm && this.$refs.commForm.clearValidates();
    },
    search() {
      // console.log(this.conds);
      this.loadData();
    },
    createClass() {},
    editItem(item) {
      this.formData = Object.assign({}, item);
      this.isAdd = false;
      this.isShow = true;
      this.formData.from_school = [
        this.formData.attend_school_id,
        this.formData.grade_id
      ];
      this.loadOptions();
      this.loadSchools();
      this.loadClasses(this.formData.school_id);
    },
    loadOptions() {
      this.$get("admin/common/school/list", null, res => {
        if (res.code == 0) {
          let arr = res.data;
          let temp = [];
          arr.forEach(s => {
            temp.push({ label: s.name, value: s.id });
          });
          this.controls[3].options = temp;
          this.searchControls[6].options = temp;
          // console.log(temp);
        }
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
          this.$post("admin/common/student/delete", { ids: item.id }, res => {
            this.loading = false;
            if (res.code == 0) {
              this.$message({
                type: "success",
                message: "删除成功"
              });
              this.list.splice(this.list.indexOf(item), 1);
            }
          });
        })
        .catch();
    },
    openItem(item, flag) {
      this.loading = true;
      this.$post(
        "admin/common/student/open_or_close",
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
      let params = Object.assign({}, this.formData);
      if (this.formData.from_school && this.formData.from_school.length == 2) {
        params["grade_id"] = this.formData.from_school[1];
        params["attend_school_id"] = this.formData.from_school[0];
      }
      this.$post(
        "admin/common/student/save",
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
.name-link {
  display: inline-block;
  width: 100%;
  color: #409eff;
  padding: 15px 0;
}
// .page-container {
//   text-align: center;
// }
</style>

