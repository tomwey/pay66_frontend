<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">就读学校列表</h3>
      <div class="buttons" v-if="$hasPermission(103,1002)">
        <el-button type="primary" @click="openForm">添加就读学校</el-button>
      </div>
    </div>
    <div class="search-bar"></div>
    <div class="list">
      <el-alert title="点击每行左边箭头可展开该行，查看在读年级列表~" :closable="false" type="warning" show-icon></el-alert>
      <el-table
        :data="list"
        fit
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="expand">
          <template slot-scope="scope">
            <el-table :data="scope.row.grades" fit stripe style="width: 100%">
              <el-table-column type="selection" width="55" align="center"></el-table-column>
              <el-table-column label="ID" prop="id" align="center" width="60"></el-table-column>
              <el-table-column label="年级名称" prop="name"></el-table-column>
              <el-table-column label="排序" prop="sort" align="center" width="60"></el-table-column>
              <el-table-column label="备注" prop="memo"></el-table-column>
              <el-table-column label="创建时间" prop="create_time" align="center" width="180"></el-table-column>
              <el-table-column label="操作" align="center" width="150">
                <template slot-scope="scope">
                  <el-button size="mini" @click="editItem2(scope.row);">编辑</el-button>
                  <el-button size="mini" type="danger" @click="deleteItem2(scope.row);">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
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
        <el-table-column label="年级数量" align="center" width="120">
          <template slot-scope="scope">
            <el-button
              type="primary"
              plain
              @click="addGrade(scope.row);"
              size="small"
            >添加年级({{scope.row.grades.length}})</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="students_count" label="学生人数" sortable align="center" width="120"></el-table-column>
        <el-table-column prop="address" label="学校地址"></el-table-column>
        <el-table-column label="状态" align="center" width="120">
          <template slot-scope="scope">
            <state-tag
              :type="scope.row.opened ? 'success' : 'danger'"
              :label="scope.row.opened ? '正常' : '已禁用'"
            ></state-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="create_time" align="center" width="99"></el-table-column>
        <el-table-column label="操作" align="center" width="240">
          <template slot-scope="scope">
            <el-button
              size="mini"
              v-if="$hasPermission(103,1004)"
              style="margin-bottom: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>
            <el-button
              size="mini"
              v-if="$hasPermission(103,1008)"
              type="danger"
              @click="deleteItem(scope.row);"
            >删除</el-button>
            <el-button
              size="mini"
              type="warning"
              v-if="scope.row.opened && $hasPermission(103,1010)"
              @click="openItem(scope.row, false);"
            >禁用</el-button>
            <el-button
              size="mini"
              type="success"
              v-if="!scope.row.opened  && $hasPermission(103,1009)"
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
      :title="isAdd ? '添加就读学校' : '修改就读学校'"
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

    <!-- 年级表单 -->

    <el-dialog
      :title="isAdd2 ? '添加就读年级' : '修改就读年级'"
      :visible.sync="isShow2"
      width="580px"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @open="openModel"
      center
    >
      <comm-form :controls="controls2" ref="commForm2" :form-data="formData2"></comm-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="isShow2 = false">取 消</el-button>
        <el-button type="primary" v-loading="commiting" @click="commit2">提 交</el-button>
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
      isAdd2: false,
      isShow2: false,
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
          label: "学校简介",
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
      controls2: [
        {
          label: "名字",
          field: "name",
          type: 1,
          rules: [{ required: true, message: "名字不能为空", trigger: "blur" }]
        },
        {
          label: "排序",
          field: "sort",
          type: 1,
          subtype: "number",
          rules: []
        },
        {
          label: "备注",
          field: "memo",
          type: 1,
          rules: []
        }
      ],
      formData: {},
      formData2: {},
      currSchool: null
    };
  },
  watch: {},
  mounted() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.loading = true;
      this.$get("admin/common/attend_school/list", null, res => {
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
    addGrade(school) {
      this.formData2 = {};
      this.isAdd2 = true;
      this.isShow2 = true;
      this.currSchool = school;
    },
    openModel() {
      // this.$refs.commForm.clearValidates();
      this.$refs.commForm && this.$refs.commForm.clearValidates();
      this.$refs.commForm2 && this.$refs.commForm2.clearValidates();
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
          this.$post(
            "admin/common/attend_school/delete",
            { ids: item.id },
            res => {
              this.loading = false;
              if (res.code == 0) {
                this.$message({
                  type: "success",
                  message: "删除成功"
                });
                this.list.splice(this.list.indexOf(item), 1);
              }
            }
          );
        })
        .catch();
    },
    openItem(item, flag) {
      this.loading = true;
      this.$post(
        "admin/common/attend_school/open_or_close",
        { ids: item.id, state: flag ? 1 : 0 },
        res => {
          this.loading = false;
          if (res.code == 0) {
            item.opened = flag;
          }
        }
      );
    },
    editItem2(item) {
      this.currSchool = null;
      // console.log(item);
      this.formData2 = Object.assign({}, item);
      this.isAdd2 = false;
      this.isShow2 = true;
    },
    deleteItem2(item) {
      // console.log(item);
      this.$confirm("删除后不能恢复，您确定吗？", "删除提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.loading = true;
          this.$post(
            "admin/common/attend_grade/delete",
            { ids: item.id },
            res => {
              this.loading = false;
              if (res.code == 0) {
                this.$message({
                  type: "success",
                  message: "删除成功"
                });
                this.loadData();
              }
            }
          );
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
    commit2() {
      this.$refs.commForm2.validateFields(valid => {
        if (valid) {
          this.doCommit2();
        }
      });
    },
    doCommit2() {
      this.commiting = true;
      if (this.currSchool) {
        this.formData2["attend_school_id"] = this.currSchool.id;
      }
      this.$post(
        "admin/common/attend_grade/save",
        {
          id: this.formData2.id,
          payload: JSON.stringify(this.formData2)
        },
        res => {
          this.commiting = false;
          if (res.code == 0) {
            this.isShow2 = false;
            this.$message({
              type: "success",
              message: "提交成功！"
            });
            this.loadData();
          }
        }
      );
    },
    doCommit() {
      this.commiting = true;
      this.$post(
        "admin/common/attend_school/save",
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

