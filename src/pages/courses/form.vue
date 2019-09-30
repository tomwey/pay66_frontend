<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="tabs-bar">
      <div class="tabs">
        <span class="tab-item" :class="{active:currTabIndex === 0}" @click="selectTab(0)">课程信息</span>
        <span
          class="tab-item"
          :class="{active:currTabIndex === 1}"
          @click="selectTab(1)"
        >课程单元 ({{(formData.units || []).length}})</span>
      </div>
      <div class="buttons">
        <el-button size="mini" @click="back">返 回</el-button>
      </div>
    </div>

    <div class="base-form" v-show="currTabIndex === 0">
      <comm-form :controls="controls" ref="commForm" :form-data="formData"></comm-form>
    </div>
    <div class="course-units" v-show="currTabIndex === 1">
      <el-row>
        <el-col :span="16">
          <el-alert
            :closable="false"
            title="长按鼠标拖动，可以修改课程单元在课程中的顺序。"
            type="warning"
            style="margin-top: 15px;"
          ></el-alert>
        </el-col>
        <el-col :span="8">
          <div class="batch-buttons">
            <el-button
              type="danger"
              size="mini"
              :disabled="selectedUnits.length === 0"
              @click="removeUnits(selectedUnits);"
            >批量移除</el-button>
            <el-button type="primary" size="mini" @click="addUnits">批量添加</el-button>
          </div>
        </el-col>
      </el-row>
      <el-table
        :data="formData.units"
        @selection-change="handleSelectionChange"
        row-key="id"
        fit
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" align="center"></el-table-column>
        <el-table-column label="封面图" align="center" width="120">
          <template slot-scope="scope">
            <img :src="scope.row.cover_url" style="max-width: 100%;" />
          </template>
        </el-table-column>
        <el-table-column label="单元名称" prop="name" align="center" width="180"></el-table-column>
        <el-table-column label="单元简介" prop="intro" align="center"></el-table-column>
        <el-table-column label="上课时长(分钟)" prop="teach_length" align="center" width="120"></el-table-column>
        <el-table-column label="单元内容" width="100" align="center">
          <template slot-scope="scope">
            <span class="view-content" @click="viewBody(scope.row);">查看内容</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="memo" align="center" width="150"></el-table-column>
        <el-table-column label="状态" align="center" width="120">
          <template slot-scope="scope">
            <state-tag
              :type="scope.row.opened ? 'success' : 'danger'"
              :label="scope.row.opened ? '已上架' : '已下架'"
            ></state-tag>
          </template>
        </el-table-column>
        <!-- <el-table-column label="创建时间" prop="create_time" width="99"></el-table-column> -->
        <el-table-column label="操作" fixed="right" align="center" width="80">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="danger"
              style="margin-bottom: 10px;"
              @click="removeUnits([scope.row]);"
            >移 除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="commit-buttons">
      <el-button type="danger" size="mini" @click="reset">重 置</el-button>
      <el-button type="primary" size="mini" @click="save">保 存</el-button>
    </div>

    <!-- 课程单元选择框 -->
    <el-dialog
      :title="'选择课程单元'"
      :visible.sync="unitsShow"
      width="80%"
      :append-to-body="true"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      center
    >
      <course-units :from-parent="true" :ids="unitIDs" @selected="unitsSelected" :key="randomKey"></course-units>
      <div slot="footer" class="dialog-footer">
        <el-button @click="unitsShow = false" size="small">关 闭</el-button>
        <el-button
          type="primary"
          size="small"
          @click="doSelectUnits"
          :disabled="srcSelectedUnits.length === 0"
        >确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import Sortable from "sortablejs";

export default {
  name: "unit-form",
  components: {
    commForm: resolve => require(["@/components/CommForm"], resolve),
    courseUnits: resolve => require(["./units/list"], resolve),
    stateTag: resolve => require(["@/components/state-tag"], resolve)
  },
  data() {
    return {
      loading: false,
      currTabIndex: 0,
      unitsShow: false,
      selectedUnits: [],
      srcSelectedUnits: [],
      unitIDs: [],
      randomKey: 123,
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
    this.reset();
    this.loadOptions();
    this.startDrag();
  },
  computed: {
    isEdit() {
      // console.log(this.$route.path);
      return this.$route.path.indexOf("/courses/edit") !== -1;
    }
  },
  methods: {
    startDrag() {
      const el = document.querySelectorAll(
        ".el-table__body-wrapper > table > tbody"
      )[0];
      Sortable.create(el, {
        disabled: false,
        ghostClass: "sortable-ghost",
        animation: 180,
        delay: 0,
        setData: function(dataTransfer) {
          dataTransfer.setData("Text", "");
        },
        onEnd: ({ newIndex, oldIndex }) => {
          const targetRow = this.formData.units.splice(oldIndex, 1)[0];
          this.formData.units.splice(newIndex, 0, targetRow);
        }
      });
    },
    doSelectUnits() {
      this.unitsShow = false;
      let units = this.formData.units || [];
      units = units.concat(this.srcSelectedUnits);
      this.formData.units = JSON.parse(JSON.stringify(units));
    },
    unitsSelected(units) {
      this.srcSelectedUnits = units;
    },
    addUnits() {
      let ids = [];
      (this.formData.units || []).forEach(unit => {
        ids.push(unit.id);
      });
      this.unitIDs = ids;

      this.randomKey++;

      this.srcSelectedUnits = [];

      this.unitsShow = true;
    },
    removeUnits(units) {
      units.forEach(u => {
        const index = (this.formData.units || []).indexOf(u);
        if (index !== -1) {
          this.formData.units.splice(index, 1);
        }
      });
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
        }
      });
    },
    selectTab(idx) {
      this.currTabIndex = idx;
    },
    handleSelectionChange(rows) {
      console.log(rows);
      this.selectedUnits = rows;
    },
    back() {
      this.$router.push({ path: "/courses" });
    },
    reset() {
      if (this.isEdit) {
        this.formData = JSON.parse(sessionStorage.getItem("item"));
      } else {
        this.formData = { category_ids: [], sort: 0, units: [] };
      }
      // console.log(this.formData);
    },
    doCommit() {
      this.loading = true;

      let params = Object.assign({}, this.formData);

      let temp = [];
      let index = 0;
      this.formData.units.forEach(ele => {
        temp.push({ id: ele.id, sort: index++ });
      });

      params["units"] = temp;

      this.$post(
        "admin/common/course/save",
        {
          id: this.formData.id,
          payload: JSON.stringify(params)
        },
        res => {
          this.loading = false;
          if (res.code == 0) {
            // this.isShow = false;
            this.$message({
              type: "success",
              message: "提交成功！"
            });
            // this.loadData();
            this.back();
          }
        }
      );
    },
    save() {
      // console.log(this.contentForms);
      // console.log(this.formData);
      if (!this.formData.units || this.formData.units.length == 0) {
        this.$message({
          type: "warning",
          message: "至少需要添加1个课程单元"
        });
        this.currTabIndex = 1;
        return;
      }

      this.$refs.commForm.validateFields(valid => {
        if (valid) {
          this.doCommit();
        } else {
          this.currTabIndex = 0;
        }
      });
    }
  }
};
</script>
<style lang="scss" scoped>
.tabs-bar {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding: 0 20px;
  .tabs {
    flex: 0 0 30%;
    .tab-item {
      display: inline-block;
      // width: 120px;
      padding: 15px 5px;
      margin-right: 20px;
      text-align: center;
      cursor: pointer;
      user-select: none;
      color: #333;
      font-size: 14px;

      &.active {
        border-bottom: 2px solid #409eff;
        color: #409eff;
        font-weight: 500;
      }
    }
  }
  .buttons {
    flex: 1;
    text-align: right;
  }
}

.base-form {
  padding: 60px 180px 0 120px;
}

.course-units {
  padding: 20px;
  .batch-buttons {
    text-align: right;
    padding: 20px 0;
  }
}

.commit-buttons {
  padding: 30px;
  text-align: center;
}
</style>



