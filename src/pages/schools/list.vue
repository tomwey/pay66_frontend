<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">校区列表</h3>
      <div class="buttons" v-if="$hasPermission(101,1002)">
        <el-button type="primary" @click="openForm">创建校区</el-button>
      </div>
    </div>
    <div class="search-bar"></div>
    <div class="list">
      <el-table
        :data="list"
        fit
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center"></el-table-column>
        <el-table-column label="ID" prop="id" align="center" width="60"></el-table-column>
        <el-table-column label="名字" prop="name" align="center" width="120"></el-table-column>
        <el-table-column label="负责人姓名/电话" align="center" width="150">
          <template slot-scope="scope">
            {{scope.row.contact_name}}
            <br />
            {{scope.row.contact_phone}}
          </template>
        </el-table-column>
        <el-table-column prop="students_count" label="学生人数" sortable align="center" width="120"></el-table-column>
        <el-table-column prop="address" label="校区地址"></el-table-column>
        <el-table-column label="关联登录账号" width="150">
          <template slot-scope="scope">
            <div class="accounts">
              <div class="account" v-for="account in scope.row.assoc_accounts" :key="account.id">
                {{account.name}} | {{account.mobile}} |
                <span
                  :key="role.code"
                  v-for="role in account.roles"
                >{{role.name}}</span>
              </div>
            </div>
            <el-button size="mini" type="primary" plain @click="bindAccounts(scope.row);">关联登录账号</el-button>
          </template>
        </el-table-column>
        <el-table-column label="是否合作学校" align="center" width="120">
          <template slot-scope="scope">{{scope.row.is_co_school ? '是' : '否'}}</template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="120">
          <template slot-scope="scope">
            <state-tag
              :type="scope.row.opened ? 'success' : 'danger'"
              :label="scope.row.opened ? '正常' : '已禁用'"
            ></state-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="create_time" align="center" width="99"></el-table-column>
        <el-table-column label="操作" align="center" width="80">
          <template slot-scope="scope">
            <el-button
              size="mini"
              v-if="$hasPermission(101,1004)"
              style="margin-bottom: 10px; margin-left: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>
            <el-button
              size="mini"
              type="danger"
              v-if="$hasPermission(101,1008)"
              style="margin-bottom: 10px;"
              @click="deleteItem(scope.row);"
            >删除</el-button>
            <el-button
              size="mini"
              type="warning"
              v-if="scope.row.opened && $hasPermission(101,1010)"
              @click="openItem(scope.row, false);"
            >禁用</el-button>
            <el-button
              size="mini"
              type="success"
              v-if="!scope.row.opened && $hasPermission(101,1009)"
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
          v-if="pager.totalSize >= pager.pageSize"
          @current-change="pager.changeFunc"
        ></el-pagination>
      </div>
    </div>
    <!-- 表单 -->
    <el-dialog
      :title="isAdd ? '创建校区' : '修改校区'"
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

    <!-- 账号 -->
    <el-dialog
      :title="'关联登录账号'"
      :visible.sync="isShow2"
      width="580px"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      center
    >
      <el-checkbox-group v-model="currAccounts">
        <el-checkbox
          :label="account.id"
          v-for="account in accounts"
          :key="account.id"
        >{{account.name}}</el-checkbox>
      </el-checkbox-group>
      <div slot="footer" class="dialog-footer">
        <el-button @click="isShow2 = false">取 消</el-button>
        <el-button type="primary" v-loading="commiting" @click="doBind">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
export default {
  name: "list",
  components: {
    commForm: resolve => require(["@/components/CommForm"], resolve),
    stateTag: resolve => require(["@/components/state-tag"], resolve)
  },
  data() {
    return {
      loading: false,
      commiting: false,
      list: [],
      isAdd: false,
      isShow: false,
      isShow2: false,
      accounts: [],
      currAccounts: [],
      currItem: null,
      pager: {
        totalSize: 30,
        pageSize: 20,
        page: 1,
        changeFunc: val => {
          this.pager.page = val;
          this.loadData();
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
          label: "负责人姓名",
          field: "contact_name",
          type: 1,
          rules: [
            { required: true, message: "负责人姓名不能为空", trigger: "blur" }
          ]
        },
        {
          label: "负责人电话",
          field: "contact_phone",
          type: 1,
          rules: [
            { required: true, message: "负责人电话不能为空", trigger: "blur" }
          ]
        },
        {
          label: "详细地址",
          field: "address",
          type: 1,
          rules: [
            { required: true, message: "详细地址不能为空", trigger: "blur" }
          ]
        },
        {
          label: "是否合作学校",
          field: "is_co_school",
          type: 5,
          rules: []
        },
        {
          label: "校区简介",
          field: "bio",
          type: 12,
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
    loadData() {
      this.loading = true;
      this.$get("admin/common/school/list", null, res => {
        // console.log(res);
        this.loading = false;
        if (res.code == 0) {
          this.list = res.data;
          this.pager.totalSize = res.total;
        }
      });
      // console.log(this.pager.page);
    },
    handleSelectionChange(rows) {},
    openForm(type) {
      this.formData = {};
      this.isAdd = true;
      this.isShow = true;
    },
    openModel() {
      // this.$refs.commForm.clearValidates();
      this.$refs.commForm && this.$refs.commForm.clearValidates();
    },
    editItem(item) {
      this.formData = Object.assign({}, item);
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
          this.$post("admin/common/school/delete", { ids: item.id }, res => {
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
        "admin/common/school/open_or_close",
        { ids: item.id, state: flag ? 1 : 0 },
        res => {
          this.loading = false;
          if (res.code == 0) {
            item.opened = flag;
          }
        }
      );
    },
    loadAccounts() {
      this.loading = true;
      this.$get("admin/common/account/list", null, res => {
        // console.log(res);
        this.loading = false;
        if (res.code == 0) {
          this.accounts = res.data.filter(res => {
            return !res.is_admin;
          });
        }
      });
    },
    bindAccounts(item) {
      // this.loading = true;
      this.currItem = item;
      this.currAccounts = item.assoc_accounts.map(ele => {
        return ele.id;
      });
      this.isShow2 = true;
      this.loadAccounts();
    },
    doBind() {
      this.commiting = true;
      this.$post(
        "admin/common/school/bind_account",
        {
          obj_ids: [this.currItem.id],
          ids: this.currAccounts
        },
        res => {
          this.commiting = false;
          if (res.code == 0) {
            this.isShow2 = false;
            this.$message({
              type: "success",
              message: "关联成功！"
            });
            this.loadData();
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
        "admin/common/school/save",
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

