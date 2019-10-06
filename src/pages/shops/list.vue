<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">门店列表</h3>
      <div class="buttons" v-if="$hasPermission(107,1002)">
        <el-button type="primary" @click="openForm">添加门店</el-button>
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
        <el-table-column label="所属商家" prop="merchant.name" align="center" width="120"></el-table-column>
        <el-table-column label="门店类型" prop="type_name" align="center" width="120"></el-table-column>
        <el-table-column label="经营范围" align="center" width="120">
          <template
            slot-scope="scope"
          >{{scope.row.category ? (scope.row.category.parent ? scope.row.category.parent.name + '/' + scope.row.category.name : scope.row.category.name) : ''}}</template>
        </el-table-column>
        <el-table-column label="联系电话" prop="phone" align="center" width="120"></el-table-column>
        <el-table-column label="门店地址" prop="address" width="120"></el-table-column>
        <el-table-column label="备注" prop="memo"></el-table-column>
        <el-table-column label="创建时间" prop="create_time" width="100"></el-table-column>
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
      :title="isAdd ? '添加门店' : '修改门店'"
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
// import { MobileCheck } from "@/components/CommForm/validators";

export default {
  name: "list",
  components: {
    commForm: resolve => require(["@/components/CommForm"], resolve),
    // stateTag: resolve => require(["@/components/state-tag"], resolve),
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
          label: "所属商家",
          field: "merchant_id",
          type: 2,
          options: [],
          rules: [
            { required: true, message: "所属商家不能为空", trigger: "change" }
          ]
        },
        {
          label: "门店类型",
          field: "_type",
          type: 2,
          options: [
            {
              label: "直营",
              value: 1
            },
            {
              label: "加盟",
              value: 2
            }
          ],
          rules: [
            { required: true, message: "门店类型不能为空", trigger: "change" }
          ]
        },
        {
          label: "经营范围",
          field: "scope",
          type: 21,
          options: [],
          props: {},
          changeFunc: val => {
            console.log(val);
            // this.loadStudents(val);
            this.loadCategories(val);
          },
          rules: [
            { required: true, message: "经营范围不能为空", trigger: "change" }
          ]
        },
        {
          label: "门头照片",
          field: "outer_images",
          type: 8,
          accept: ".jpg,.png,.gif,.jpeg",
          limit: 5,
          rules: [
            { required: true, message: "门头照片不能为空", trigger: "blur" }
          ]
        },
        {
          label: "店内照片",
          field: "inner_images",
          type: 8,
          accept: ".jpg,.png,.gif,.jpeg",
          limit: 5,
          rules: [
            // { required: true, message: "店内照片不能为空", trigger: "blur" }
          ]
        },
        {
          label: "联系电话",
          field: "phone",
          type: 1,
          rules: [
            { required: true, message: "联系电话不能为空", trigger: "blur" }
          ]
        },
        {
          label: "门店地址",
          field: "address",
          type: 1,
          rules: [
            { required: true, message: "门店地址不能为空", trigger: "blur" }
          ]
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
    // this.loadCategories();
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

      this.$get("admin/common/shop/list", params, res => {
        // console.log(res);
        this.loading = false;
        if (res.code == 0) {
          this.list = res.data;
          this.pager.totalSize = res.total || 0;
        }
      });
      // console.log(this.pager.page);
    },
    loadCategories(val = null, cb = null) {
      if (val && !Array.isArray(val)) {
        return;
      }
      let pid = null;
      if (val && val.length > 0) {
        pid = val[0];
      }
      // console.log(val);
      this.$get(
        "admin/common/category/list",
        { conds: JSON.stringify([{ k: "pid", op: "=", v: pid }]) },
        res => {
          console.log(res);
          this.loading = false;
          if (res.code == 0) {
            // this.list = res.data;
            // this.pager.totalSize = res.total || 0;
            if (pid) {
              const arr = this.controls[3].options;
              let temp = [];
              res.data.forEach(ele => {
                temp.push({ label: ele.name, value: ele.id });
              });
              for (let i = 0; i < arr.length; i++) {
                if (arr[i].value == pid) {
                  arr[i].children = temp;
                  break;
                }
              }
            } else {
              let temp = [];
              res.data.forEach(ele => {
                temp.push({ label: ele.name, value: ele.id, children: [] });
              });
              this.controls[3].options = temp;
            }
          }
          if (cb) {
            cb();
          }
        }
      );
    },
    search() {
      this.loadData();
    },
    handleSelectionChange(rows) {},
    openForm(type) {
      this.formData = {};
      this.loadCategories();
      this.loadMerchants();
      this.isAdd = true;
      this.isShow = true;
    },
    loadMerchants() {
      this.$get("admin/common/merchant/list", null, res => {
        console.log(res);
        this.loading = false;
        if (res.code == 0) {
          // this.list = res.data;
          // this.pager.totalSize = res.total || 0;
          let temp = [];
          res.data.forEach(ele => {
            temp.push({ label: ele.name, value: ele.id });
          });
          this.controls[1].options = temp;
        }
      });
    },
    openModel() {
      // this.$refs.commForm.clearValidates();
      this.$refs.commForm && this.$refs.commForm.clearValidates();
    },
    editItem(item) {
      this.formData = Object.assign({}, item);
      this.loadCategories(null, () => {
        if (this.formData.category && this.formData.category.parent) {
          this.loadCategories([this.formData.category.parent.id]);
          // this.controls[3].changeFunc([this.formData.category.parent.id]);
          this.formData["scope"] = [
            this.formData.category.parent.id,
            parseInt(this.formData.scope)
          ];
        }
      });

      // console.log(this.formData);
      this.loadMerchants();
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
          this.$post("admin/common/shop/delete", { ids: item.id }, res => {
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
    commit() {
      this.$refs.commForm.validateFields(valid => {
        if (valid) {
          this.doCommit();
        }
      });
    },
    doCommit() {
      const params = Object.assign({}, this.formData);
      params["scope"] = this.formData.scope[1];
      console.log(params);
      // return;

      this.commiting = true;
      this.$post(
        "admin/common/shop/save",
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
</style>

