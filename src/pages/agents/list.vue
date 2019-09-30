<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">账号列表</h3>
      <div class="buttons" v-if="$hasPermission(122,1002)">
        <el-button type="primary" @click="openForm">添加账号</el-button>
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
        <el-table-column label="账号名字" prop="name" align="center" width="120"></el-table-column>
        <el-table-column label="登录手机" prop="mobile" align="center" width="120"></el-table-column>
        <el-table-column label="角色" width="120" align="center">
          <template slot-scope="scope">
            <el-tag>{{scope.row.role_name}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上级" width="120" align="center">
          <template slot-scope="scope">
            <div v-if="scope.row.parent">
              <el-tag>{{scope.row.parent.role_name}}</el-tag>
              &emsp;{{scope.row.parent.name}}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="登录次数" prop="login_count" align="center" width="80"></el-table-column>
        <el-table-column label="最后登录时间/IP" width="180">
          <template slot-scope="scope">
            {{scope.row.last_login_at}}
            <br />
            {{scope.row.last_login_ip}}
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="80">
          <template slot-scope="scope">
            <state-tag
              :type="scope.row.opened ? 'success' : 'danger'"
              :label="scope.row.opened ? '正常' : '已禁用'"
            ></state-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="create_time" width="100"></el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="240">
          <template slot-scope="scope">
            <el-button
              size="mini"
              v-if="$hasPermission(122,1004)"
              style="margin-bottom: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>
            <el-button
              size="mini"
              type="danger"
              v-if="$hasPermission(122,1008)"
              style="margin-bottom: 10px;"
              @click="deleteItem(scope.row);"
            >删除</el-button>
            <el-button
              size="mini"
              type="warning"
              v-if="scope.row.opened && $hasPermission(122,1010)"
              @click="openItem(scope.row, false);"
            >禁用</el-button>
            <el-button
              size="mini"
              type="success"
              v-if="!scope.row.opened && $hasPermission(122,1009)"
              @click="openItem(scope.row, true);"
            >启用</el-button>
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
      :title="isAdd ? '添加账号' : '修改账号'"
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
        <el-button size="small" @click="isShow = false">取 消</el-button>
        <el-button size="small" type="primary" v-loading="commiting" @click="commit">提 交</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import {
  MobileCheck,
  PasswordLengthCheck
} from "@/components/CommForm/validators";

export default {
  name: "list",
  components: {
    commForm: resolve => require(["@/components/CommForm"], resolve),
    stateTag: resolve => require(["@/components/state-tag"], resolve),
    searchControls: resolve => require(["@/components/SearchControls"], resolve)
  },
  data() {
    let that = this;
    var validatePassword2 = (rule, value, callback) => {
      if (value !== this.formData.password) {
        callback(new Error("两次密码输入不一致"));
      } else {
        callback();
      }
    };
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
          label: "账号名字",
          field: "name",
          op: "lk"
        },
        {
          type: 1,
          label: "账号名字",
          field: "mobile",
          op: "lk"
        },
        {
          type: 2,
          label: "账号状态",
          field: "state",
          options: [
            {
              label: "全部",
              value: "-1"
            },
            {
              label: "启用",
              value: 1
            },
            {
              label: "禁用",
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
      pager: {
        totalSize: 0,
        pageSize: 20,
        page: 1,
        changeFunc: val => {
          this.pager.page = val;
          this.loadData(this.conds);
        }
      },
      controls: [],
      controls1: [
        {
          label: "账号名字",
          field: "name",
          type: 1,
          rules: [
            { required: true, message: "账号名字不能为空", trigger: "blur" }
          ]
        },
        {
          label: "登录手机",
          field: "mobile",
          type: 1,
          rules: [
            { required: true, message: "登录手机不能为空", trigger: "blur" },
            { validator: MobileCheck, trigger: "change" }
          ]
        },
        {
          label: "密码",
          field: "password",
          type: 1,
          subtype: "password",
          rules: [
            { required: true, message: "密码不能为空", trigger: "blur" },
            { validator: PasswordLengthCheck, trigger: "change" }
          ]
        },
        {
          label: "确认密码",
          field: "password2",
          type: 1,
          subtype: "password",
          rules: [
            { required: true, message: "确认密码不能为空", trigger: "blur" },
            { validator: validatePassword2, trigger: "change" }
          ]
        },
        {
          label: "上级",
          field: "pid",
          type: 2,
          options: [],
          rules: [
            // { required: true, message: "角色不能为空", trigger: "change" }
          ]
        },
        {
          label: "角色",
          field: "role",
          type: 3,
          options: [],
          rules: [
            { required: true, message: "角色不能为空", trigger: "change" }
          ]
        }
      ],
      controls2: [
        {
          label: "账号名字",
          field: "name",
          type: 1,
          rules: [
            { required: true, message: "账号名字不能为空", trigger: "blur" }
          ]
        },
        {
          label: "登录手机",
          field: "mobile",
          type: 1,
          rules: [
            { required: true, message: "登录手机不能为空", trigger: "blur" },
            { validator: MobileCheck, trigger: "change" }
          ]
        },
        {
          label: "上级",
          field: "pid",
          type: 2,
          options: [],
          rules: [
            // { required: true, message: "角色不能为空", trigger: "change" }
          ]
        },
        {
          label: "角色",
          field: "role",
          type: 3,
          options: [],
          rules: [
            { required: true, message: "角色不能为空", trigger: "change" }
          ]
        }
      ],
      formData: {}
    };
  },
  watch: {},
  mounted() {
    this.loadData();
  },
  methods: {
    showDetail(item) {},
    handleSelectionChange(rows) {},
    loadData(conds = []) {
      this.conds = conds || [];
      this.loading = true;
      let params = {};
      params.page = this.pager.page;
      params.size = this.pager.pageSize;

      let temp = [{ k: "__assoc_type", op: "=", v: 2 }];
      // if (this.conds.length > 0) {
      params.conds = JSON.stringify(this.conds.concat(temp));
      // } else {
      // }

      this.$get("admin/common/account/list", params, res => {
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
      this.controls = this.controls1;
      this.formData = {};
      this.isAdd = true;
      this.isShow = true;
      this.loadAccounts();
      this.loadRoles();
    },
    openModel() {
      // this.$refs.commForm.clearValidates();
      this.$refs.commForm && this.$refs.commForm.clearValidates();
    },
    editItem(item) {
      // console.log(item);
      this.formData = Object.assign({}, item);
      this.formData.role = this.formData.role.toString();
      if (this.formData.parent) {
        this.formData.pid = this.formData.parent.id;
      }
      // this.formData["show_cases"] = ids.join(",");

      this.isAdd = false;
      this.isShow = true;

      this.controls = this.controls2;

      this.loadRoles();
      this.loadAccounts();

      // this.loadTags();
      // this.loadSchools();
      // this.loadStudents([item.school_id]);
      // this.loadAssignments();
    },
    loadRoles() {
      this.loading = true;
      this.$get("admin/configs/agent_roles", null, res => {
        // console.log(res);
        this.loading = false;
        if (res.code == 0) {
          const control = this.controls[this.controls.length - 1];
          // const temp = [];
          // res.data.forEach(ele => {
          //   temp.push({ label: ele.name, value: ele.id });
          // });
          control.options = res.data;
        }
      });
    },
    loadAccounts() {
      // this.loading = true;
      this.$get(
        "admin/common/account/list",
        {
          conds: JSON.stringify([
            { k: "mobile", op: "not", v: this.$store.state.user.mobile },
            { k: "role", op: "=", v: 4 }
          ])
        },
        res => {
          console.log(res);
          // this.loading = false;
          if (res.code == 0) {
            const control = this.controls[this.controls.length - 2];
            const temp = [];
            res.data.forEach(ele => {
              temp.push({ label: ele.name, value: ele.id });
            });
            console.log(temp);
            control.options = temp;
          }
        }
      );
    },
    deleteItem(item) {
      this.$confirm("删除后不能恢复，您确定吗？", "删除提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.loading = true;
          this.$post("admin/common/account/delete", { ids: item.id }, res => {
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
        "admin/common/account/open_or_close",
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
      let student_id = this.formData.student_id;
      let params = Object.assign({}, this.formData);

      this.$post(
        "admin/common/account/save",
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
.name-link {
  display: inline-block;
  width: 100%;
  color: #409eff;
  padding: 15px 0;
}
</style>


