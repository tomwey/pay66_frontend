<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">角色管理</h3>
      <div class="buttons" v-if="$hasPermission(123,1002)">
        <el-button type="primary" @click="openForm">添加角色</el-button>
      </div>
    </div>
    <search-controls :controls="searchControls" @search="loadData"></search-controls>
    <div class="list">
      <el-table :data="list" fit style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center"></el-table-column>
        <el-table-column label="ID" prop="id" align="center" width="80"></el-table-column>
        <el-table-column label="名字" prop="name" align="center"></el-table-column>
        <el-table-column label="权限">
          <template slot-scope="scope">
            <!-- {{scope}} -->
            <!-- <span v-if="scope.row.is_admin">所有权限</span>-->
            <el-tree
              v-if="!scope.row.is_admin"
              :data="scope.row.permission_data"
              :props="treeOption"
            ></el-tree>
          </template>
        </el-table-column>
        <!-- <el-table-column label="图文数量" prop="articles_count" align="center" width="120"></el-table-column> -->
        <el-table-column label="备注" prop="memo" align="center" width="150"></el-table-column>
        <el-table-column label="状态" align="center" width="120">
          <template slot-scope="scope">
            <state-tag
              :type="scope.row.opened ? 'success' : 'danger'"
              :label="scope.row.opened ? '正常' : '已禁用'"
            ></state-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="create_time" width="99"></el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="240">
          <template slot-scope="scope">
            <el-button
              size="mini"
              v-if="$hasPermission(123,1004)"
              style="margin-bottom: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>
            <el-button
              size="mini"
              type="danger"
              v-if="$hasPermission(123,1008)"
              style="margin-bottom: 10px;"
              @click="deleteItem(scope.row);"
            >删除</el-button>
            <el-button
              size="mini"
              type="warning"
              v-if="scope.row.opened && $hasPermission(123,1010)"
              @click="openItem(scope.row, false);"
            >禁用</el-button>
            <el-button
              size="mini"
              type="success"
              v-if="!scope.row.opened && $hasPermission(123,1009)"
              @click="openItem(scope.row, true);"
            >启用</el-button>
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
      :title="isAdd ? '添加角色' : '修改角色'"
      :visible.sync="isShow"
      width="70%"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @open="openModel"
      center
    >
      <h2 class="title">基本资料</h2>
      <comm-form :controls="controls" ref="commForm" :form-data="formData"></comm-form>
      <div class="permissions" v-if="permissions.length > 0">
        <h2 class="title">权限设置</h2>
        <div class="permission" v-for="res in permissions" :key="res.code">
          <el-row>
            <el-col :span="6">
              <el-checkbox
                :indeterminate="res.isIndeterminate"
                v-model="res.checkAll"
                :key="res.code"
                @change="handleCheckAllChange(res, $event)"
              >
                <span class="resource-name">{{res.name}}</span>
              </el-checkbox>
            </el-col>
            <el-col :span="18">
              <el-checkbox-group
                v-model="res.selected_actions"
                @change="handleCheckedActionsChange(res, $event)"
              >
                <el-checkbox
                  v-for="action in res.actions"
                  :label="action.code"
                  :key="action.code"
                >{{action.name}}</el-checkbox>
              </el-checkbox-group>
            </el-col>
          </el-row>
          <!-- <div style="margin-bottom: 5px;"></div> -->
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="isShow = false">取 消</el-button>
        <el-button type="primary" size="small" v-loading="commiting" @click="commit">提 交</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
export default {
  name: "tags",
  components: {
    commForm: resolve => require(["@/components/CommForm"], resolve),
    stateTag: resolve => require(["@/components/state-tag"], resolve),
    searchControls: resolve => require(["@/components/SearchControls"], resolve)
  },
  data() {
    return {
      loading: false,
      commiting: false,
      permissions: [],
      list: [],
      treeOption: {
        children: "children",
        label: "name"
      },
      isAdd: false,
      isShow: false,
      conds: [],
      searchControls: [
        {
          type: 1,
          label: "名字",
          field: "name",
          op: "lk"
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
    this.loadData([]);
  },
  methods: {
    handleCheckAllChange(res, val) {
      res.selected_actions = val
        ? res.actions.map(item => {
            return item.code;
          })
        : [];
      this.$set(res, "isIndeterminate", false);
    },
    handleCheckedActionsChange(res, value) {
      let checkedCount = value.length;
      this.$set(res, "checkAll", checkedCount === res.actions.length);
      this.$set(
        res,
        "isIndeterminate",
        checkedCount > 0 && checkedCount < res.actions.length
      );
    },
    loadData(conds) {
      this.conds = conds || [];
      this.loading = true;
      let params = {};
      params.page = this.pager.page;
      params.size = this.pager.pageSize;

      if (this.conds.length > 0) {
        params.conds = JSON.stringify(this.conds);
      }

      this.$get("admin/common/role/list", params, res => {
        // console.log(res);
        this.loading = false;
        if (res.code == 0) {
          // this.list = res.data;

          this.list = res.data.map(item => {
            let temp = [];
            item.permissions.forEach(per => {
              // temp.push({ label: per.resource_name, children: [] })
              // let actions = [];
              // per.action_names.forEach(action => {
              //   actions.push({ label: action });
              // });
              temp.push({ name: per.name, children: per.actions });
            });
            item.permission_data = temp;
            return item;
          });

          this.pager.totalSize = res.total || 0;
        }
      });
      // console.log(this.pager.page);
    },
    search() {
      this.loadData();
    },
    loadPermissions() {
      this.loading = true;
      this.permissions = [];

      this.$get(
        "admin/permissions",
        { role_id: this.formData.id || "" },
        res => {
          console.log(res);
          this.loading = false;
          if (res.code == 0) {
            // this.permissions = res.data;
            this.permissions = res.data.map(item => {
              item.checkAll =
                item.actions.length === item.selected_actions.length;
              item.isIndeterminate =
                item.selected_actions.length > 0 &&
                item.selected_actions.length < item.actions.length;
              return item;
            });
          }
        }
      );
    },
    handleSelectionChange(rows) {},
    openForm(type) {
      this.formData = {};
      this.isAdd = true;
      this.isShow = true;
      this.loadPermissions();
    },
    openModel() {
      // this.$refs.commForm.clearValidates();
      this.$refs.commForm && this.$refs.commForm.clearValidates();
    },
    editItem(item) {
      this.formData = Object.assign({}, item);
      this.isAdd = false;
      this.isShow = true;
      this.loadPermissions();
    },
    deleteItem(item) {
      this.$confirm("删除后不能恢复，您确定吗？", "删除提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.loading = true;
          this.$post("admin/common/role/delete", { ids: item.id }, res => {
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
        "admin/common/role/open_or_close",
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
      const temp = [];
      this.permissions.forEach(res => {
        if (res.selected_actions.length > 0) {
          // temp.push(`${res.code}:${res.selected_actions.join(",")}`);
          const obj = {};
          obj[res.code] = res.selected_actions;
          temp.push(obj);
        }
      });

      console.log(temp);

      const params = Object.assign({}, this.formData);
      if (temp.length > 0) {
        params["_permissions"] = temp;
      }

      this.$post(
        "admin/common/role/save",
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
.title {
  font-size: 18px;
  color: #333;
  margin: 0;
  font-weight: normal;
  margin-bottom: 40px;
  padding-left: 10px;
  // border-left: 2px solid rgb(98, 168, 58); //rgb(98, 170, 71);
}

.permissions {
  // padding-left: 120px;
  margin-top: 40px;
  .permission {
    // margin-left: 120px;
    margin-bottom: 30px;
    .resource-name {
      font-size: 15px;
      font-weight: 700;
      // color: #333;
    }
  }
}
</style>


