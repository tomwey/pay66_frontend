<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">订单列表</h3>
      <div class="buttons" v-if="$hasPermission(107,1002)">
        <el-button type="primary" @click="openForm">创建收款订单</el-button>
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
        <!-- <el-table-column label="ID" prop="id" align="center" width="80"></el-table-column> -->
        <el-table-column label="订单号" prop="order_no" width="180"></el-table-column>
        <el-table-column label="订单金额(元)" prop="money" width="120"></el-table-column>
        <el-table-column label="优惠金额(元)" prop="discount_money" width="100"></el-table-column>
        <el-table-column label="支付状态" prop="pay_state_name" align="center" width="80"></el-table-column>
        <el-table-column label="支付方式" prop="pay_type_name" align="center" width="80"></el-table-column>
        <el-table-column label="商家/门店/设备" width="180">
          <template slot-scope="scope">
            <strong>{{scope.row.merchant.name}}</strong>
            <br />
            门店: {{scope.row.shop.name}}
            <br />
            设备: {{scope.row.device.device_type}}
          </template>
        </el-table-column>
        <el-table-column label="收银员" align="center" prop="operator.name" width="80"></el-table-column>
        <el-table-column label="付款人" prop="buyer_id" width="150"></el-table-column>
        <el-table-column label="交易时间" prop="pay_time" width="100"></el-table-column>
        <el-table-column label="创建时间" prop="create_time" width="100"></el-table-column>
        <el-table-column label="交易失败描述" prop="error_memo" width="120"></el-table-column>
        <el-table-column label="备注" prop="memo"></el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="100">
          <template slot-scope="scope">
            <!-- <el-button
              size="mini"
              v-if="$hasPermission(107,1004)"
              style="margin-bottom: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>-->
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
      :title="isAdd ? '创建收款订单' : ''"
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
          label: "订单号",
          field: "order_no",
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
          label: "订单描述",
          field: "title",
          type: 1,
          rules: [
            { required: true, message: "订单描述不能为空", trigger: "blur" }
          ]
        },
        {
          label: "用户付款码",
          field: "_auth_code",
          type: 1,
          rules: [
            { required: true, message: "付款码不能为空", trigger: "blur" }
          ]
        },
        {
          label: "支付金额(元)",
          field: "_money",
          type: 1,
          subtype: "number",
          rules: [
            { required: true, message: "支付金额不能为空", trigger: "blur" }
          ]
        },
        {
          label: "优惠金额(元)",
          field: "_discount_money",
          type: 1,
          subtype: "number",
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
            this.$set(this.formData, "device_id", null);
            this.$set(this.formData, "operator_id", null);
            this.loadDevices(val);
            this.loadOperators(val);
          },
          rules: [
            { required: true, message: "所属商家不能为空", trigger: "change" }
          ]
        },
        {
          label: "所属设备",
          field: "device_id",
          type: 2,
          options: [],
          rules: [
            { required: true, message: "所属设备不能为空", trigger: "change" }
          ]
        },
        {
          label: "所属业务员",
          field: "operator_id",
          type: 2,
          options: [],
          rules: [
            { required: true, message: "所属业务员不能为空", trigger: "change" }
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

      params["sorts"] = JSON.stringify([{ k: "created_at", v: "desc" }]);

      this.$get("admin/common/order/list", params, res => {
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
      // this.loadCategories();
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
          this.controls[4].options = temp;
        }
      });
    },
    loadDevices(val) {
      console.log(val);
      this.$get(
        "admin/common/device/list",
        { conds: JSON.stringify([{ k: "merchant_id", op: "=", v: val }]) },
        res => {
          console.log(res);
          this.loading = false;
          if (res.code == 0) {
            // this.list = res.data;
            // this.pager.totalSize = res.total || 0;
            let temp = [];
            res.data.forEach(ele => {
              temp.push({ label: ele.device_type, value: ele.id });
            });
            this.controls[5].options = temp;
          }
        }
      );
    },
    loadOperators(val) {
      // console.log(val);
      this.$get(
        "admin/common/merch_account/list",
        { conds: JSON.stringify([{ k: "merchant_id", op: "=", v: val }]) },
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
            this.controls[6].options = temp;
          }
        }
      );
    },
    openModel() {
      // this.$refs.commForm.clearValidates();
      this.$refs.commForm && this.$refs.commForm.clearValidates();
    },
    editItem(item) {
      this.formData = Object.assign({}, item);
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
          this.$post("admin/common/order/delete", { ids: item.id }, res => {
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
      // params["scope"] = this.formData.scope[1];
      console.log(params);
      // return;

      this.commiting = true;
      this.$post(
        "admin/common/order/save",
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

