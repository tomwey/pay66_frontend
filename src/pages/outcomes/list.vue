<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">作品列表</h3>
      <div class="buttons" v-if="$hasPermission(117,1002)">
        <el-button type="primary" @click="openForm">添加作品</el-button>
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
        <el-table-column label="名字" prop="name" align="center" width="120"></el-table-column>
        <el-table-column label="简介" prop="intro" align="center" width="150"></el-table-column>
        <el-table-column label="封面图" align="cover" width="120">
          <template slot-scope="scope">
            <img
              :src="scope.row.cover_url || require('@/assets/default_avatar.png')"
              style="width:100%;"
            />
          </template>
        </el-table-column>
        <el-table-column label="校区/学生" align="center" width="150">
          <template slot-scope="scope">
            <span
              class="student-link"
              @click="viewStudent(scope.row);"
            >{{scope.row.school_name}} / {{scope.row.student_name}}</span>
          </template>
        </el-table-column>
        <el-table-column label="演示图片/视频">
          <!-- <template slot-scope="scope">
            <video :src="scope.row.video_url"></video>
          </template>-->
        </el-table-column>
        <el-table-column label="浏览/点赞/分享/评论" width="120" align="center">
          <template
            slot-scope="scope"
          >{{scope.row.view_count}} / {{scope.row.likes_count}} / {{scope.row.share_count}} / {{scope.row.comments_count}}</template>
        </el-table-column>
        <el-table-column label="作品打分" sortable prop="score" align="center" width="120"></el-table-column>
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
        <el-table-column label="操作" fixed="right" align="center" width="120">
          <template slot-scope="scope">
            <el-button
              size="mini"
              v-if="$hasPermission(117,1004)"
              style="margin-left: 10px; margin-bottom: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>
            <el-button
              size="mini"
              type="danger"
              v-if="$hasPermission(117,1008)"
              style="margin-bottom: 10px;"
              @click="deleteItem(scope.row);"
            >删除</el-button>
            <el-button
              size="mini"
              type="warning"
              v-if="scope.row.opened && $hasPermission(117,1012)"
              @click="openItem(scope.row, false);"
            >下架</el-button>
            <el-button
              size="mini"
              type="success"
              v-if="!scope.row.opened && $hasPermission(117,1011)"
              @click="openItem(scope.row, true);"
            >上架</el-button>
            <el-button
              size="mini"
              type="primary"
              v-if="$hasPermission(117,1015)"
              style="margin-top: 10px;"
              @click="suggestItem(scope.row);"
            >{{scope.row.is_recommend ? '取消推荐' : '推荐'}}</el-button>
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
      :title="isAdd ? '添加作品' : '修改作品'"
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
          label: "关键字",
          field: "kw",
          placeholder: "输入名字、简介",
          key: "name,intro",
          op: "kw"
        },
        {
          type: 2,
          label: "所属校区",
          field: "school_id",
          options: [],
          key: "school_id"
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
          label: "作品名字",
          field: "name",
          type: 1,
          rules: [
            { required: true, message: "作品名字不能为空", trigger: "blur" }
          ]
        },
        {
          label: "校区/学生",
          field: "student_id",
          type: 21,
          options: [],
          props: {},
          changeFunc: val => {
            // console.log(val);
            this.loadStudents(val);
          },
          rules: [
            { required: true, message: "所属学生不能为空", trigger: "change" }
          ]
        },
        {
          label: "作品简介",
          field: "intro",
          type: 1,
          rules: [
            { required: true, message: "作品简介不能为空", trigger: "blur" }
          ]
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
          label: "作品演示图片/视频（支持上传多个）",
          field: "show_cases",
          type: 8,
          accept: ".jpg,.jpeg,.png,.gif,.mp4,.3gp,.mov,.avi,.rmvb,.wmv",
          limit: 50,
          fileSize: 1000,
          rules: [
            {
              required: true,
              message: "作品演示图片/视频不能为空",
              trigger: "blur"
            }
          ]
        },
        {
          label: "详细介绍",
          field: "body",
          type: 12,
          rules: [
            { required: true, message: "详细介绍不能为空", trigger: "blur" }
          ]
        },
        {
          label: "作品打分",
          field: "score",
          type: 1,
          subtype: "number"
        },
        {
          label: "来源作业",
          field: "assignment_id",
          type: 2,
          options: []
        },
        // {
        //   label: "介绍视频",
        //   field: "video",
        //   type: 8,
        //   rules: []
        // },
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
    this.loadSchools();
  },
  methods: {
    viewStudent(item) {
      sessionStorage.setItem("item", JSON.stringify(item.student));
      this.$router.push({ path: `/students/${item.student_id}` });
    },
    loadStudents(val) {
      let value = val[0];
      this.$get(
        "admin/common/student/list",
        { conds: JSON.stringify([{ k: "school_id", op: "=", v: value }]) },
        res => {
          if (res.code == 0) {
            let arr = this.controls[1].options || [];
            for (let i = 0; i < arr.length; i++) {
              if (arr[i].value === value) {
                let temp = [];
                res.data.forEach(ele => {
                  temp.push({ label: ele.name, value: ele.id });
                });
                arr[i].children = temp;
                break;
              }
            }
          }
        }
      );
    },
    handleSelectionChange(rows) {},
    loadSchools() {
      this.$get("admin/common/school/list", null, res => {
        let temp = [];
        if (res.code == 0) {
          (res.data || []).forEach(ele => {
            temp.push({
              label: ele.name,
              value: ele.id,
              leaf: false,
              children: []
            });
          });
        }
        this.searchControls[1].options = temp;

        for (let i = 0; i < this.controls.length; i++) {
          if (this.controls[i].field === "student_id") {
            this.controls[i].options = temp;
            break;
          }
        }
        // resolve(temp);
      });
    },
    loadAssignments() {},
    loadData(conds = []) {
      this.conds = conds || [];
      this.loading = true;
      let params = {};
      params.page = this.pager.page;
      params.size = this.pager.pageSize;

      if (this.conds.length > 0) {
        params.conds = JSON.stringify(this.conds);
      }

      this.$get("admin/common/outcome/list", params, res => {
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

      this.loadSchools();
      this.loadAssignments();
    },
    openModel() {
      // this.$refs.commForm.clearValidates();
      this.$refs.commForm && this.$refs.commForm.clearValidates();
    },
    suggestItem(item) {
      const flag = item.is_recommend ? "0" : "1";
      this.loading = true;
      this.$post("admin/outcomes/suggest/" + flag, { ids: [item.id] }, res => {
        this.loading = false;
        if (res.code == 0) {
          this.$message({
            type: "success",
            message: flag === "0" ? "取消推荐成功" : "推荐成功"
          });
          this.loadData();
        }
      });
    },
    editItem(item) {
      this.formData = Object.assign({}, item);
      this.formData["student_id"] = [item.school_id, item.student_id];
      // this.formData["show_cases"] =
      let ids = [];
      (item.show_cases || []).forEach(c => {
        ids.push(c.id);
      });

      this.formData["show_cases"] = ids.join(",");

      this.isAdd = false;
      this.isShow = true;
      this.loadSchools();
      this.loadStudents([item.school_id]);
      this.loadAssignments();
    },
    deleteItem(item) {
      this.$confirm("删除后不能恢复，您确定吗？", "删除提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          this.loading = true;
          this.$post("admin/common/outcome/delete", { ids: item.id }, res => {
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
        "admin/common/outcome/open_or_close",
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

      if (Array.isArray(student_id) && student_id.length > 1) {
        // student_id = student_id[1];
        params["student_id"] = student_id[1];
        params["school_id"] = student_id[0];
      }

      this.$post(
        "admin/common/outcome/save",
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
</style>

