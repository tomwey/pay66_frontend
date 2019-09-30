<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">加盟商列表</h3>
      <div class="buttons" v-if="$hasPermission(100,1002)">
        <el-button type="primary" @click="openForm">添加加盟机构</el-button>
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
        <el-table-column label="品牌信息" align="center" width="120">
          <template slot-scope="scope">
            <img :src="scope.row.logo_url" style="max-width: 100%;" />
            <p class="name">{{scope.row.brand}}</p>
          </template>
        </el-table-column>
        <el-table-column label="公司名字" align="center" width="80">
          <template slot-scope="scope">
            <!-- <a
              href="javascript:;"
              class="name-link"
              @click="showDetail(scope.row);"
            >{{scope.row.name}}</a>-->
            <a
              class="name-link"
              :href="'http://b-' + scope.row.id + '.tgs.91coding.cn'"
              target="_blank"
            >{{scope.row.name}}</a>
          </template>
        </el-table-column>
        <el-table-column label="联系人手机" prop="mobile" align="center" width="120"></el-table-column>
        <el-table-column label="营业执照" align="center" width="180">
          <template slot-scope="scope">
            <img :src="scope.row.license_image_url" style="max-width: 100%;" />
            <p class="name">{{scope.row.license_no}}</p>
          </template>
        </el-table-column>
        <el-table-column label="超级管理员" width="180">
          <template slot-scope="scope">
            账号名字: {{scope.row.admin && scope.row.admin.name}}
            <br />
            登录手机: {{scope.row.admin && scope.row.admin.mobile}}
          </template>
        </el-table-column>
        <el-table-column label="公司地址" prop="address" align="center" width="150"></el-table-column>
        <el-table-column label="账户余额(元)" sortable prop="_balance" align="center" width="150"></el-table-column>
        <el-table-column label="注册时间" prop="create_time" width="99"></el-table-column>
        <el-table-column label="账号状态" width="99">
          <template slot-scope="scope">
            <state-tag
              :type="scope.row.opened ? 'success' : 'danger'"
              :label="scope.row.opened ? '正常' : '已禁用'"
            ></state-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="memo" align="center" width="120"></el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="220">
          <template slot-scope="scope">
            <el-button
              size="mini"
              v-if="$hasPermission(100,1004)"
              style="margin-bottom: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>
            <el-button
              size="mini"
              type="danger"
              v-if="$hasPermission(100,1008)"
              style="margin-bottom: 10px;"
              @click="deleteItem(scope.row);"
            >删除</el-button>
            <el-button
              size="mini"
              type="warning"
              v-if="scope.row.opened && $hasPermission(100,1010)"
              @click="openItem(scope.row, false);"
            >禁用</el-button>
            <el-button
              size="mini"
              type="success"
              v-if="!scope.row.opened && $hasPermission(100,1009)"
              @click="openItem(scope.row, true);"
            >启用</el-button>
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
      :title="isAdd ? '添加加盟机构' : '修改加盟机构'"
      :visible.sync="isShow"
      width="580px"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @open="openModel"
      center
    >
      <div class="form-box">
        <h3 class="title">基本信息</h3>
        <comm-form :controls="controls" ref="commForm" :form-data="formData"></comm-form>
      </div>

      <div class="form-box">
        <h3 class="title">超级管理员</h3>
        <comm-form :controls="controls2" ref="commForm2" :form-data="formData2"></comm-form>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="isShow = false">取 消</el-button>
        <el-button type="primary" v-loading="commiting" @click="commit">提 交</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import {
  MobileCheck,
  PasswordLengthCheck
} from "@/components/CommForm/validators";
import { Promise } from "q";
export default {
  name: "list",
  components: {
    commForm: resolve => require(["@/components/CommForm"], resolve),
    stateTag: resolve => require(["@/components/state-tag"], resolve),
    searchControls: resolve => require(["@/components/SearchControls"], resolve)
  },
  data() {
    var validatePassword2 = (rule, value, callback) => {
      if (value !== this.formData2.password) {
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
      parentsDialogVisible: false,
      selectedParents: [],
      currStudent: null,
      conds: [],
      searchControls: [
        {
          type: 1,
          label: "公司名字",
          field: "name",
          op: "like"
        },
        {
          type: 1,
          label: "品牌",
          field: "brand",
          op: "like"
        },
        {
          type: 1,
          label: "关键字",
          field: "kw",
          placeholder: "联系人手机、公司地址",
          key: "mobile,address",
          op: "kw"
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
              label: "正常",
              value: 1
            },
            {
              label: "已禁用",
              value: 0
            }
          ],
          key: "opened"
        },
        {
          type: 72,
          label: "注册时间",
          field: "created_at"
        }
      ],
      parentConds: {
        keyword: "",
        regdate: null
      },
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
          label: "公司名字",
          field: "name",
          type: 1,
          rules: [
            { required: true, message: "公司名字不能为空", trigger: "blur" }
          ]
        },
        {
          label: "品牌名字",
          field: "brand",
          type: 1,
          rules: [
            { required: true, message: "品牌名字不能为空", trigger: "blur" }
          ]
        },
        {
          label: "LOGO",
          field: "logo_id",
          type: 8,
          accept: ".jpg,.png,.gif,.jpeg",
          rules: [{ required: true, message: "LOGO不能为空", trigger: "blur" }]
        },
        {
          label: "统一社会信用代码",
          field: "license_no",
          type: 1,
          rules: [
            {
              required: true,
              message: "统一社会信用代码不能为空",
              trigger: "blur"
            }
          ]
        },
        {
          label: "营业执照",
          field: "license_image_id",
          type: 8,
          accept: ".jpg,.png,.gif,.jpeg",
          rules: [
            { required: true, message: "营业执照不能为空", trigger: "blur" }
          ]
        },
        {
          label: "联系人手机",
          field: "mobile",
          type: 1,
          rules: [
            { required: true, message: "联系人手机不能为空", trigger: "blur" },
            {
              validator: MobileCheck,
              trigger: "change"
            }
          ]
        },
        {
          label: "公司地址",
          field: "address",
          type: 1,
          rules: [
            { required: true, message: "公司地址不能为空", trigger: "blur" }
          ]
        },
        {
          label: "余额(元)",
          field: "_balance",
          type: 1,
          subtype: "number"
        },
        {
          label: "备注",
          field: "memo",
          type: 1,
          rules: []
        }
      ],
      controls2: [],
      new_controls2: [
        {
          label: "账号名字",
          field: "name",
          type: 1,
          rules: [{ required: true, message: "名字不能为空", trigger: "blur" }]
        },
        {
          label: "头像",
          field: "avatar",
          type: 8,
          accept: ".jpg,.jpeg,.png,.gif"
        },
        {
          label: "登录手机",
          field: "mobile",
          type: 1,
          rules: [
            { required: true, message: "登录手机不能为空", trigger: "blur" },
            {
              validator: MobileCheck,
              trigger: "change"
            }
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
        }
      ],
      edit_controls2: [
        {
          label: "账号名字",
          field: "name",
          type: 1,
          rules: [{ required: true, message: "名字不能为空", trigger: "blur" }]
        },
        {
          label: "头像",
          field: "avatar",
          type: 8,
          accept: ".jpg,.jpeg,.png,.gif"
        },
        {
          label: "登录手机",
          field: "mobile",
          type: 1,
          disabled: true,
          rules: [
            { required: true, message: "登录手机不能为空", trigger: "blur" },
            {
              validator: MobileCheck,
              trigger: "change"
            }
          ]
        }
      ],
      formData: {},
      formData2: {}
    };
  },
  watch: {},
  mounted() {
    this.loadData();
  },
  methods: {
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
      this.$router.push({ path: "/partners/" + item.id });
    },
    batchImport() {},
    loadData(conds = []) {
      this.conds = conds || [];

      this.loading = true;
      let params = {};
      params.page = this.pager.page;
      params.size = this.pager.pageSize;

      if (this.conds.length > 0) {
        params.conds = JSON.stringify(this.conds);
      }
      this.$get("admin/common/company/list", params, res => {
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
      this.formData2 = {};
      this.controls2 = this.new_controls2;
      this.isAdd = true;
      this.isShow = true;
      // this.loadOptions();
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

      this.formData2 = Object.assign({}, item.admin);
      this.controls2 = this.edit_controls2;

      this.isAdd = false;
      this.isShow = true;
      // this.loadOptions();
    },
    deleteItem(item) {
      this.$confirm("删除后不能恢复，您确定吗？", "删除提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.loading = true;
          this.$post("admin/common/company/delete", { ids: item.id }, res => {
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
        "admin/common/company/open_or_close",
        { ids: item.id, state: flag ? 1 : 0 },
        res => {
          this.loading = false;
          if (res.code == 0) {
            item.opened = flag;
          }
        }
      );
    },
    checkFormFields(formRef) {
      return new Promise(resolve => {
        if (!formRef || !this.$refs[formRef]) {
          resolve(false);
        } else {
          this.$refs[formRef].validateFields(valid => {
            resolve(valid);
          });
        }
      });
    },
    commit() {
      let promises = [];

      let counter = 0;
      promises.push(
        this.checkFormFields("commForm").then(flag => {
          if (flag) {
            counter++;
          }
        })
      );

      promises.push(
        this.checkFormFields("commForm2").then(flag => {
          if (flag) {
            counter++;
          }
        })
      );

      Promise.all(promises).then(() => {
        if (counter == promises.length) {
          this.doCommit();
        }
      });
    },
    doCommit() {
      this.commiting = true;
      let params = Object.assign({}, this.formData);
      params["admin"] = Object.assign({}, this.formData2);

      this.$post(
        "admin/common/company/save",
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
.form-box {
  margin-bottom: 60px;
  &:last-child {
    margin-bottom: 20px;
  }
  .title {
    margin-bottom: 20px;
  }
}
// .page-container {
//   text-align: center;
// }
</style>

