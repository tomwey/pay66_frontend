<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">设备列表</h3>
      <div class="buttons" v-if="$hasPermission(100,1002)">
        <el-button type="primary" @click="openForm">添加设备</el-button>
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
        <el-table-column label="设备类型/名字" prop="device_type" align="center" width="120"></el-table-column>
        <el-table-column label="设备编号" prop="serial_no" align="center" width="120"></el-table-column>
        <el-table-column label="所属商家/门店" align="center" width="150">
          <template
            slot-scope="scope"
          >{{scope.row.merchant ? scope.row.merchant.name : '--'}} / {{scope.row.shop ? scope.row.shop.name : '--'}}</template>
        </el-table-column>
        <el-table-column label="设备型号" prop="model" align="center" width="120"></el-table-column>
        <el-table-column label="设备运行模式" prop="run_mode" align="center" width="120"></el-table-column>
        <el-table-column label="SDK版本" align="center" width="80" prop="sdk_version"></el-table-column>
        <el-table-column label="程序版本" align="center" width="80" prop="app_version"></el-table-column>
        <el-table-column label="最后心跳时间" prop="last_heartbeat_at" width="120"></el-table-column>
        <el-table-column label="录入时间" prop="create_time" width="99"></el-table-column>
        <el-table-column label="状态" width="99">
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
      :title="isAdd ? '添加设备' : '修改设备'"
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
import { Promise } from "q";
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
      parentsDialogVisible: false,
      selectedParents: [],
      currStudent: null,
      conds: [],
      searchControls: [
        // {
        //   type: 1,
        //   label: "名字",
        //   field: "name",
        //   op: "like"
        // },
        // {
        //   type: 1,
        //   label: "品牌",
        //   field: "brand",
        //   op: "like"
        // },
        // {
        //   type: 1,
        //   label: "关键字",
        //   field: "kw",
        //   placeholder: "联系人手机、公司地址",
        //   key: "mobile,address",
        //   op: "kw"
        // },
        {
          type: 2,
          label: "设备状态",
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
          label: "录入时间",
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
          label: "设备类型/名字",
          field: "device_type",
          type: 2,
          options: [
            {
              label: "支付宝蜻蜓F4",
              value: "支付宝蜻蜓F4"
            }
          ],
          rules: [
            {
              required: true,
              message: "设备类型/名字不能为空",
              trigger: "change"
            }
          ]
        },
        {
          label: "设备序列号",
          field: "serial_no",
          type: 1,
          rules: [
            {
              required: true,
              message: "设备序列号不能为空",
              trigger: "blur"
            }
          ]
        },
        {
          label: "设备型号",
          field: "model",
          type: 1,
          rules: []
        },
        {
          label: "所属商家",
          field: "merchant_id",
          type: 2,
          options: [],
          changeFunc: (control, val) => {
            console.log(val);
            // this.formData["shop_id"] = "";
            this.$set(this.formData, "shop_id", null);
            this.loadShops(val);
          },
          rules: [
            {
              required: true,
              message: "所属商家不能为空",
              trigger: "change"
            }
          ]
        },
        {
          label: "所属门店",
          field: "shop_id",
          type: 2,
          options: [],
          rules: [
            {
              required: true,
              message: "所属门店不能为空",
              trigger: "change"
            }
          ]
        },
        {
          label: "设备运行模式",
          field: "run_mode",
          type: 1,
          rules: []
        },
        {
          label: "SDK版本号",
          field: "sdk_version",
          type: 1,
          rules: []
        },
        {
          label: "程序版本号",
          field: "app_version",
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
    loadData(conds = []) {
      this.conds = conds || [];

      this.loading = true;
      let params = {};
      params.page = this.pager.page;
      params.size = this.pager.pageSize;

      if (this.conds.length > 0) {
        params.conds = JSON.stringify(this.conds);
      }
      this.$get("admin/common/device/list", params, res => {
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
      this.loadMerchants();
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
          this.controls[3].options = temp;
        }
      });
    },
    loadShops(merchant_id) {
      this.$get(
        "admin/common/shop/list",
        {
          conds: JSON.stringify([{ k: "merchant_id", op: "=", v: merchant_id }])
        },
        res => {
          console.log(res);
          this.loading = false;
          if (res.code == 0) {
            // this.list = res.data;
            // this.pager.totalSize = res.total || 0;
            let temp = [];
            res.data.forEach(ele => {
              temp.push({ label: ele.name, value: ele.id });
            });
            this.controls[4].options = temp;
          }
        }
      );
    },
    editItem(item) {
      console.log(item);
      this.formData = Object.assign({}, item);
      this.isAdd = false;
      this.isShow = true;
      this.loadMerchants();
    },
    deleteItem(item) {
      this.$confirm("删除后不能恢复，您确定吗？", "删除提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.loading = true;
          this.$post("admin/common/device/delete", { ids: item.id }, res => {
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
        "admin/common/device/open_or_close",
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

      this.$post(
        "admin/common/device/save",
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

