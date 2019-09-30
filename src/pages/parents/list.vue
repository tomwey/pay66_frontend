<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">家长列表</h3>
      <div class="buttons" v-if="$hasPermission(109,1002)">
        <el-button type="primary" @click="openForm">添加家长信息</el-button>
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
        <el-table-column label="手机号" prop="mobile" align="center" width="150"></el-table-column>
        <el-table-column label="头像" align="center" width="120">
          <template slot-scope="scope">
            <img
              :src="scope.row.avatar || require('@/assets/default_avatar.png')"
              style="width:32px;height:32px;"
            />
          </template>
        </el-table-column>
        <el-table-column label="登录次数" prop="login_count" align="center" width="120"></el-table-column>
        <el-table-column label="最后登录时间/IP" prop="last_login_ip" align="center" width="150">
          <template slot-scope="scope">
            {{scope.row.last_login_at}}
            <br />
            {{scope.row.last_login_ip}}
          </template>
        </el-table-column>

        <el-table-column label="状态" align="center" width="120">
          <template slot-scope="scope">
            <state-tag
              :type="scope.row.opened ? 'success' : 'danger'"
              :label="scope.row.opened ? '正常' : '已禁用'"
            ></state-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" prop="create_time" width="99"></el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="240">
          <template slot-scope="scope">
            <el-button
              size="mini"
              v-if="$hasPermission(109,1004)"
              style="margin-bottom: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>
            <el-button
              size="mini"
              type="danger"
              v-if="$hasPermission(109,1008)"
              style="margin-bottom: 10px;"
              @click="deleteItem(scope.row);"
            >删除</el-button>
            <el-button
              size="mini"
              type="warning"
              v-if="scope.row.opened && $hasPermission(109,1010)"
              @click="openItem(scope.row, false);"
            >禁用</el-button>
            <el-button
              size="mini"
              type="success"
              v-if="!scope.row.opened && $hasPermission(109,1009)"
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
      :title="isAdd ? '添加家长信息' : '修改家长信息'"
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
          label: "关键字",
          field: "kw",
          key: "name,mobile,id",
          op: "kw"
        },
        {
          type: 72,
          label: "注册时间",
          field: "created_at"
        }
      ],
      pickerOptions: {
        shortcuts: [
          {
            text: "最近一周",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit("pick", [start, end]);
            }
          },
          {
            text: "最近一个月",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
              picker.$emit("pick", [start, end]);
            }
          },
          {
            text: "最近三个月",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
              picker.$emit("pick", [start, end]);
            }
          }
        ]
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
        // {
        //   label: "头像",
        //   field: "avatar",
        //   type: 1,
        //   rules: []
        // },
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
    loadData(conds = []) {
      this.conds = conds || [];
      this.loading = true;
      let params = {};
      params.page = this.pager.page;
      params.size = this.pager.pageSize;

      if (this.conds.length > 0) {
        params.conds = JSON.stringify(this.conds);
      }

      this.$get("admin/common/parent/list", params, res => {
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
          this.$post("admin/common/parent/delete", { ids: item.id }, res => {
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
        "admin/common/parent/open_or_close",
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
        "admin/common/parent/save",
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

