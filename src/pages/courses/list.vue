<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">课程列表</h3>
      <div class="buttons" v-if="$hasPermission(105,1002)">
        <el-button type="primary" @click="openForm">添加课程</el-button>
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
        <el-table-column label="课程名字/封面" align="center" width="120">
          <template slot-scope="scope">
            <div class="base-info">
              <img :src="scope.row.cover_url" />
              <p class="name">{{scope.row.name}}</p>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="所属分类" align="center" width="90">
          <template slot-scope="scope">
            <div
              style="margin-bottom: 10px;"
              v-for="(tag, index) in scope.row.categories"
              :key="index"
            >
              <el-tag>{{tag.name}}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="课程形式" align="center" width="150">
          <template slot-scope="scope">
            <el-tag>{{scope.row.teach_mode_name}}</el-tag>
          </template>
        </el-table-column>
        <!-- <el-table-column label="课程单元" align="center" width="120">
          <template slot-scope="scope">
            <span
              style="color: #409EFF;cursor:pointer;font-size: 14px;user-select:none;"
              @click="viewUnits(scope.row)"
            >查看/绑定课程单元</span>
          </template>
        </el-table-column>-->
        <el-table-column label="价格" prop="price" align="center" width="150"></el-table-column>
        <el-table-column label="简介" prop="intro" align="center" width="150"></el-table-column>
        <el-table-column label="详细介绍" align="center" width="120">
          <template slot-scope="scope">
            <span
              style="color: #409EFF;cursor:pointer;font-size: 14px;user-select:none;"
              @click="viewBody(scope.row)"
            >查看课程介绍</span>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sort" align="center" width="80"></el-table-column>
        <el-table-column label="状态" align="center" width="120">
          <template slot-scope="scope">
            <state-tag
              :type="scope.row.opened ? 'success' : 'danger'"
              :label="scope.row.opened ? '已上架' : '已下架'"
            ></state-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" prop="create_time" width="99"></el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="240">
          <template slot-scope="scope">
            <el-button
              size="mini"
              v-if="$hasPermission(105,1004)"
              style="margin-bottom: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>
            <el-button
              size="mini"
              type="danger"
              v-if="$hasPermission(105,1008)"
              style="margin-bottom: 10px;"
              @click="deleteItem(scope.row);"
            >删除</el-button>
            <el-button
              size="mini"
              type="warning"
              v-if="scope.row.opened && $hasPermission(105,1012)"
              @click="openItem(scope.row, false);"
            >下架</el-button>
            <el-button
              size="mini"
              type="success"
              v-if="!scope.row.opened && $hasPermission(105,1011)"
              @click="openItem(scope.row, true);"
            >上架</el-button>
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
    <!-- <el-dialog
      :title="isAdd ? '添加课程' : '修改课程'"
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
    </el-dialog>-->

    <!-- 课程介绍 -->
    <el-dialog
      :title="currCourse.name"
      :visible.sync="courseDialogShow"
      width="80%"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      center
    >
      <div class="body" v-html="currCourse.body"></div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="courseDialogShow = false" size="small">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 课程单元绑定 -->
    <!-- <el-dialog
      :title="currCourse.name + ' - 课程单元绑定'"
      :visible.sync="courseUnitsShow"
      width="80%"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      center
    >
      <bind-units :course="this.currCourse"></bind-units>

      <div slot="footer" class="dialog-footer">
        <el-button @click="courseUnitsShow = false" size="small">关 闭</el-button>
        <el-button type="primary" size="small" @click="bindUnits">保 存</el-button>
      </div>
    </el-dialog>-->
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
    // bindUnits: resolve => require(["./bind-units"], resolve)
  },
  data() {
    return {
      loading: false,
      commiting: false,
      currCourse: {},
      courseDialogShow: false,
      courseUnitsShow: false,
      list: [],
      conds: [],
      isAdd: false,
      isShow: false,
      searchControls: [
        {
          type: 1,
          label: "关键字",
          field: "keyword",
          placeholder: "输入课程名字或简介",
          op: "kw",
          key: "name,intro"
        },
        {
          type: 2,
          label: "课程形式",
          field: "teach_mode",
          options: [
            { label: "面授", value: 1 },
            { label: "直播", value: 2 },
            { label: "线上录播", value: 3 }
          ]
        },
        {
          type: 2,
          label: "所属分类",
          field: "category_ids",
          options: [],
          key: "__assoc_category_ids"
        },
        {
          type: 2,
          label: "上架状态",
          field: "state",
          options: [
            {
              label: "全部",
              value: "-1"
            },
            {
              label: "已上架",
              value: 1
            },
            {
              label: "已下架",
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
      controls: [
        {
          label: "名字",
          field: "name",
          type: 1,
          rules: [{ required: true, message: "名字不能为空", trigger: "blur" }]
        },
        {
          label: "封面图",
          field: "cover",
          type: 8,
          rules: [
            { required: true, message: "封面图不能为空", trigger: "blur" }
          ],
          accept: ".jpg,.png,.jpeg,.gif"
        },
        {
          label: "所属分类",
          field: "category_ids",
          type: 4,
          options: [],
          rules: [
            { required: true, message: "所属分类不能为空", trigger: "change" }
          ]
        },
        {
          label: "课程形式",
          field: "teach_mode",
          type: 3,
          options: [
            {
              label: "面授",
              value: 1
            },
            {
              label: "直播",
              value: 2
            },
            {
              label: "线上录播",
              value: 3
            }
          ],
          rules: [
            { required: true, message: "课程形式不能为空", trigger: "change" }
          ]
        },
        {
          label: "价格(元)",
          field: "price",
          type: 1,
          subtype: "number"
        },
        {
          label: "课程简介",
          field: "intro",
          type: 1,
          rules: [
            { required: true, message: "课程简介不能为空", trigger: "blur" }
          ]
        },
        {
          label: "课程详细介绍",
          field: "body",
          type: 12,
          rules: [
            { required: true, message: "课程详细介绍不能为空", trigger: "blur" }
          ]
        },
        {
          label: "排序",
          field: "sort",
          type: 1,
          subtype: "number"
          // value: 0
          // rules: []
        }
      ],
      formData: {}
    };
  },
  mounted() {
    this.loadData();
    this.loadOptions();
  },
  methods: {
    viewBody(course) {
      this.currCourse = course;
      this.courseDialogShow = true;
    },
    viewUnits(course) {
      this.currCourse = course;
      this.courseUnitsShow = true;
    },
    bindUnits() {},
    loadData(conds = []) {
      this.conds = conds || [];
      this.loading = true;
      let params = {};
      params.page = this.pager.page;
      params.size = this.pager.pageSize;

      if (conds.length > 0) {
        params.conds = JSON.stringify(conds);
      }

      this.$get("admin/common/course/list", params, res => {
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
      // this.formData = { category_ids: [], sort: 0 };
      // this.isAdd = true;
      // this.isShow = true;
      sessionStorage.setItem(
        "item",
        JSON.stringify({ category_ids: [], sort: 0 })
      );
      this.$router.push({ path: "/courses/new" });
    },
    openModel() {
      // this.$refs.commForm.clearValidates();
      this.$refs.commForm && this.$refs.commForm.clearValidates();
    },
    editItem(item) {
      this.formData = Object.assign({}, item);
      let ids = [];
      (item.categories || []).forEach(c => {
        ids.push(c.id);
      });
      this.formData.category_ids = ids;
      this.formData.units = this.formData.units || [];
      // this.isAdd = false;
      // this.isShow = true;

      sessionStorage.setItem("item", JSON.stringify(this.formData));
      this.$router.push({ path: "/courses/edit" });
    },
    loadOptions() {
      this.$get("admin/common/category/list", null, res => {
        if (res.code == 0) {
          let arr = res.data;
          let temp = [];
          arr.forEach(s => {
            temp.push({ label: s.name, value: s.id });
          });
          this.controls[2].options = temp;
          // this.$set(this.formData, "category_ids", []);
          this.searchControls[2].options = temp;
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
          this.$post("admin/common/course/delete", { ids: item.id }, res => {
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
        "admin/common/course/open_or_close",
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
        "admin/common/course/save",
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
<style lang="scss">
.el-dialog__body {
  .body {
    img {
      width: 100%;
    }
  }
}
</style>

<style lang="scss" scoped>
.base-info {
  text-align: center;
  img {
    max-width: 100%;
  }
  .name {
    font-size: 14px;
    color: #333;
  }
}
</style>

