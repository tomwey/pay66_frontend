<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">老师列表</h3>
      <div class="buttons" v-if="$hasPermission(110,1002)">
        <el-button type="primary" @click="openForm">创建老师</el-button>
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
        <el-table-column label="昵称" prop="nickname" align="center" width="120"></el-table-column>
        <el-table-column label="老师类型" width="100" align="center">
          <template slot-scope="scope">
            <el-tag type="primary">{{scope.row.type_name}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="其他电话" prop="mobile2" align="center" width="120"></el-table-column>
        <el-table-column label="账号状态" align="center" width="120">
          <template slot-scope="scope">
            <state-tag
              :type="scope.row.opened ? 'success' : 'danger'"
              :label="scope.row.opened ? '正常' : '已禁用'"
            ></state-tag>
          </template>
        </el-table-column>
        <el-table-column label="认证时间" width="99">
          <template slot-scope="scope">
            <el-button
              type="primary"
              size="mini"
              @click="doApprove([scope.row])"
              v-if="!scope.row.approve_time"
            >通过认证</el-button>
            <span v-if="!!scope.row.approve_time">{{scope.row.approve_time}}</span>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" prop="create_time" width="99"></el-table-column>
        <el-table-column label="国家/年龄" align="center" width="120">
          <template slot-scope="scope">{{scope.row.country || '--'}}&nbsp;{{scope.row.age}}岁</template>
        </el-table-column>
        <el-table-column label="微信/QQ" width="180">
          <template slot-scope="scope">
            微信号: {{scope.row.wechat}}
            <br />
            QQ号:{{scope.row.qq}}
          </template>
        </el-table-column>
        <el-table-column label="登录信息" width="180">
          <template slot-scope="scope">
            登录次数: {{scope.row.login_count}}
            <br />
            最后登录时间: {{scope.row.last_login_at}}
            <br />
            最后登录IP: {{scope.row.last_login_ip}}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="220">
          <template slot-scope="scope">
            <el-button
              size="mini"
              v-if="$hasPermission(110,1004)"
              style="margin-bottom: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>
            <el-button
              size="mini"
              type="danger"
              v-if="$hasPermission(110,1008)"
              style="margin-bottom: 10px;"
              @click="deleteItem(scope.row);"
            >删除</el-button>
            <el-button
              size="mini"
              type="warning"
              v-if="scope.row.opened && $hasPermission(110,1010)"
              @click="openItem(scope.row, false);"
            >禁用</el-button>
            <el-button
              size="mini"
              type="success"
              v-if="!scope.row.opened && $hasPermission(110,1009)"
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
      :title="isAdd ? '创建老师' : '修改老师信息'"
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
      currStudent: null,
      conds: [],
      searchControls: [
        {
          type: 1,
          label: "关键字",
          field: "kw",
          placeholder: "输入名字、昵称、手机搜索",
          key: "name,mobile,nickname",
          op: "kw"
        },
        {
          type: 2,
          label: "老师类型",
          field: "_type",
          options: [
            {
              label: "班主任",
              value: 1
            },
            {
              label: "讲师",
              value: 2
            },
            {
              label: "助教",
              value: 3
            }
          ]
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
              label: "已启用",
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
          label: "认证时间",
          field: "approved_at"
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
      controls: [],
      new_controls: [
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
          label: "老师类型",
          field: "_type",
          type: 3,
          options: [
            {
              label: "班主任",
              value: 1
            },
            {
              label: "讲师",
              value: 2
            },
            {
              label: "助教",
              value: 3
            }
          ],
          rules: [
            { required: true, message: "老师类型不能为空", trigger: "change" }
          ]
        },
        {
          label: "头像",
          field: "avatar",
          type: 8,
          accept: ".jpg,.png,.gif,.jpeg"
        },
        {
          label: "昵称",
          field: "nickname",
          type: 1
        },
        {
          label: "年龄",
          field: "age",
          type: 1,
          subtype: "number"
        },
        {
          label: "国家",
          field: "country",
          type: 1,
          // subtype: "number",
          rules: []
        },
        {
          label: "其他手机",
          field: "mobile2",
          type: 1,
          rules: [{ validator: MobileCheck, trigger: "change" }]
        },
        {
          label: "老师简介",
          field: "bio",
          type: 12
        },
        {
          label: "QQ",
          field: "qq",
          type: 1,
          rules: []
        },
        {
          label: "微信号",
          field: "wechat",
          type: 1,
          rules: []
        },
        {
          label: "备注",
          field: "memo",
          type: 1,
          rules: []
        }
      ],
      edit_controls: [
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
          ],
          disabled: true
        },
        {
          label: "老师类型",
          field: "_type",
          type: 3,
          options: [
            {
              label: "班主任",
              value: 1
            },
            {
              label: "讲师",
              value: 2
            },
            {
              label: "助教",
              value: 3
            }
          ],
          rules: [
            { required: true, message: "老师类型不能为空", trigger: "change" }
          ]
        },
        {
          label: "头像",
          field: "avatar",
          type: 8,
          accept: ".jpg,.png,.gif,.jpeg"
        },
        {
          label: "昵称",
          field: "nickname",
          type: 1
        },
        {
          label: "年龄",
          field: "age",
          type: 1,
          subtype: "number"
        },
        {
          label: "国家",
          field: "country",
          type: 1,
          // subtype: "number",
          rules: []
        },
        {
          label: "其他手机",
          field: "mobile2",
          type: 1,
          rules: [{ validator: MobileCheck, trigger: "change" }]
        },
        {
          label: "老师简介",
          field: "bio",
          type: 12
        },
        {
          label: "QQ",
          field: "qq",
          type: 1,
          rules: []
        },
        {
          label: "微信号",
          field: "wechat",
          type: 1,
          rules: []
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
  },
  methods: {
    showDetail(item) {
      sessionStorage.setItem("item", JSON.stringify(item));
      this.$router.push({ path: "/teachers/" + item.id });
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
      this.$get("admin/common/teacher/list", params, res => {
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
      this.controls = this.new_controls;
      this.isAdd = true;
      this.isShow = true;
      // this.loadOptions();
    },
    doApprove(teachers) {
      if (teachers.length === 0) {
        return;
      }

      let ids = [];
      teachers.forEach(t => {
        ids.push(t.id);
      });

      this.loading = true;
      this.$post(
        "admin/common/teacher/approve",
        { ids: ids.join(",") },
        res => {
          this.loading = false;
          if (res.code == 0) {
            this.$message({
              type: "success",
              message: "认证通过"
            });
            this.loadData(this.conds);
          }
        }
      );
    },
    openModel() {
      // this.$refs.commForm.clearValidates();
      this.$refs.commForm && this.$refs.commForm.clearValidates();
    },
    search() {
      // console.log(this.conds);
      this.loadData();
    },
    editItem(item) {
      this.controls = this.edit_controls;
      this.formData = Object.assign({}, item);
      this.isAdd = false;
      this.isShow = true;
      // this.loadOptions();
    },
    loadOptions() {
      this.$get("admin/common/teacher/list", null, res => {
        if (res.code == 0) {
          let arr = res.data;
          let temp = [];
          arr.forEach(s => {
            temp.push({ label: s.name, value: s.id });
          });
          this.controls[2].options = temp;
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
          this.$post("admin/common/teacher/delete", { ids: item.id }, res => {
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
        "admin/common/teacher/open_or_close",
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
        "admin/common/teacher/save",
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

