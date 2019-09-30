<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">图文列表</h3>
      <div class="buttons" v-if="$hasPermission(118,1002)">
        <el-button type="primary" @click="openForm">添加图文</el-button>
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
        <el-table-column label="ID" prop="id" align="center" width="120"></el-table-column>
        <el-table-column label="标题" prop="title" align="center" width="120"></el-table-column>
        <el-table-column label="封面图" align="cover" width="120">
          <template slot-scope="scope">
            <img
              :src="scope.row.cover_url || require('@/assets/default_avatar.png')"
              style="width:100%;"
            />
          </template>
        </el-table-column>
        <el-table-column label="浏览/点赞/分享/评论" width="120" align="center">
          <template
            slot-scope="scope"
          >{{scope.row.view_count}} / {{scope.row.likes_count}} / {{scope.row.share_count}} / {{scope.row.comments_count}}</template>
        </el-table-column>
        <el-table-column label="图文详情" width="120" align="center">
          <template slot-scope="scope">
            <a href="javascript:;" class="name-link" @click="showDetail(scope.row);">查看图文详情</a>
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
        <el-table-column label="创建时间" prop="create_time" width="99"></el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="220">
          <template slot-scope="scope">
            <el-button
              size="mini"
              v-if="$hasPermission(118,1004)"
              style="margin-bottom: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>
            <el-button
              size="mini"
              type="danger"
              v-if="$hasPermission(118,1008)"
              style="margin-bottom: 10px;"
              @click="deleteItem(scope.row);"
            >删除</el-button>
            <el-button
              size="mini"
              type="warning"
              v-if="scope.row.opened && $hasPermission(118,1012)"
              @click="openItem(scope.row, false);"
            >下架</el-button>
            <el-button
              size="mini"
              type="success"
              v-if="!scope.row.opened && $hasPermission(118,1011)"
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
    <el-dialog
      :title="isAdd ? '添加图文' : '修改图文'"
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
    let that = this;
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
          label: "标题",
          field: "title",
          op: "lk"
        },
        {
          type: 2,
          label: "图文标签",
          field: "__assoc_tag_id",
          options: [],
          op: "="
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
          label: "标题",
          field: "title",
          type: 1,
          rules: [{ required: true, message: "标题不能为空", trigger: "blur" }]
        },
        {
          label: "封面图",
          field: "cover",
          type: 8,
          accept: ".jpg,.jpeg,.png,.gif",
          rules: [
            { required: true, message: "封面图不能为空", trigger: "blur" }
          ]
        },
        {
          label: "内容",
          field: "body",
          type: 12,
          rules: [{ required: true, message: "内容不能为空", trigger: "blur" }]
        },
        {
          label: "图文标签",
          field: "tag_ids",
          type: 4,
          options: []
        },
        {
          label: "显示顺序",
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
      formData: {}
    };
  },
  watch: {},
  mounted() {
    this.loadData();
    // this.loadSchools();
    this.loadTags();
  },
  methods: {
    loadTags() {
      this.$get("admin/common/tag/list", null, res => {
        if (res.code == 0) {
          let arr = res.data;
          let temp = [];
          arr.forEach(s => {
            temp.push({ label: s.name, value: s.id });
          });
          this.controls[3].options = temp;
          this.searchControls[1].options = temp;
        }
      });
    },
    showDetail(item) {},
    handleSelectionChange(rows) {},
    loadData(conds = []) {
      this.conds = conds || [];
      this.loading = true;
      let params = {};
      params.page = this.pager.page;
      params.size = this.pager.pageSize;

      if (this.conds.length > 0) {
        params.conds = JSON.stringify(this.conds);
      }

      this.$get("admin/common/article/list", params, res => {
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
      this.loadTags();
    },
    openModel() {
      // this.$refs.commForm.clearValidates();
      this.$refs.commForm && this.$refs.commForm.clearValidates();
    },
    editItem(item) {
      this.formData = Object.assign({}, item);

      // this.formData["show_cases"] = ids.join(",");

      this.isAdd = false;
      this.isShow = true;
      this.loadTags();
      // this.loadSchools();
      // this.loadStudents([item.school_id]);
      // this.loadAssignments();
    },
    deleteItem(item) {
      this.$confirm("删除后不能恢复，您确定吗？", "删除提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.loading = true;
          this.$post("admin/common/article/delete", { ids: item.id }, res => {
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
        "admin/common/article/open_or_close",
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
      let student_id = this.formData.student_id;
      let params = Object.assign({}, this.formData);

      this.$post(
        "admin/common/article/save",
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
.student-link {
  display: inline-block;
  font-size: 14px;
  color: #409eff;
  padding: 10px;
  cursor: pointer;
  user-select: none;
}
.name-link {
  display: inline-block;
  width: 100%;
  color: #409eff;
  padding: 15px 0;
}
</style>


