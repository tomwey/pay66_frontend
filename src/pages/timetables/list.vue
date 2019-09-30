<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">排课日历</h3>
      <div class="buttons" v-if="$hasPermission(114,1002)">
        <el-button type="primary" @click="openForm">添加课表</el-button>
      </div>
    </div>
    <search-controls :controls="searchControls" @search="loadData"></search-controls>
    <div class="tab-wrap">
      <div class="tab" @click="selectMode(0)" :class="mode === 0 ? 'active' : ''">日历模式</div>
      <div class="tab" @click="selectMode(1)" :class="mode === 1 ? 'active' : ''">列表模式</div>
    </div>
    <div class="list">
      <el-calendar v-show="mode === 0" v-model="currentDate" :range="dateRange">
        <template slot="dateCell" slot-scope="{date}">
          <p class="date">
            <span class="day">{{$moment(date).format("DD")}}</span>
            <span class="week">{{getWeedDay(date)}}</span>
          </p>
          <p class="no-data" v-if="coursesByDate(date).length === 0">暂无安排</p>
          <div
            class="course-box"
            :class="'bg-' + item.course_type"
            v-for="(item,index) in coursesByDate(date)"
            :key="index"
          >
            <div class="course">
              <span class="type">「{{courseTypename(item.course_type)}}」</span>
              {{item.course && item.course.name}}
            </div>
            <div class="owner">所属校区: {{item.school.name}}</div>
            <div class="owner">上课对象: {{item.owner && item.owner.name}}</div>
            <div class="time">上课时间: {{item.begin_time}}-{{item.end_time}}</div>
            <div class="teachers">
              <div
                class="teacher"
              >上课老师: {{item.main_teacher.name}}&nbsp;{{item.assist_teacher && item.assist_teacher.name}}</div>
              <div class="address">上课地点: {{item.classroom && item.classroom.name}}</div>
            </div>
          </div>
        </template>
      </el-calendar>
      <el-table
        v-show="mode === 1"
        :data="list"
        fit
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center"></el-table-column>
        <el-table-column label="ID" prop="id" align="center" width="120"></el-table-column>
        <el-table-column label="上课日期/时间" width="120">
          <template slot-scope="scope">
            <span>{{scope.row.plan_date}}</span>
            <br />
            <span>{{scope.row.begin_time}}-{{scope.row.end_time}}</span>
          </template>
        </el-table-column>
        <el-table-column label="课程信息">
          <template slot-scope="scope">
            {{scope.row.course.name}}
            <br />
            <el-tag>{{courseTypename(scope.row.course_type)}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上课对象" width="120">
          <template slot-scope="scope">{{scope.row.owner && scope.row.owner.name}}</template>
        </el-table-column>
        <el-table-column label="上课老师/助教" width="120">
          <template
            slot-scope="scope"
          >{{scope.row.main_teacher.name}} / {{scope.row.assist_teacher && scope.row.assist_teacher.name}}</template>
        </el-table-column>
        <el-table-column label="上课校区/地点" width="120">
          <template slot-scope="scope">
            {{scope.row.school.name}}
            <br />
            {{scope.row.classroom && scope.row.classroom.name}}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="create_time" width="99"></el-table-column>
        <el-table-column label="操作" fixed="right" align="center" width="120">
          <template slot-scope="scope">
            <el-button
              size="mini"
              v-if="$hasPermission(114,1004)"
              style="margin-left: 10px; margin-bottom: 10px;"
              @click="editItem(scope.row);"
            >编辑</el-button>
            <el-button
              size="mini"
              type="danger"
              v-if="$hasPermission(114,1008)"
              style="margin-bottom: 10px;"
              @click="deleteItem(scope.row);"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- 表单 -->
    <el-dialog
      :title="isAdd ? '添加课表' : '修改课表'"
      :visible.sync="isShow"
      width="680px"
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
const COURSE_TYPES = [
  {
    label: "正课",
    value: "1"
  },
  {
    label: "补课",
    value: "2"
  },
  {
    label: "试听课",
    value: "3"
  },
  {
    label: "公开课",
    value: "4"
  }
];
const WEEK_DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
export default {
  name: "list",
  components: {
    commForm: resolve => require(["@/components/CommForm"], resolve),
    stateTag: resolve => require(["@/components/state-tag"], resolve),
    searchControls: resolve => require(["@/components/SearchControls"], resolve)
  },
  data() {
    var MinTimeCheck = (rule, value, callback) => {
      if (this.formData.begin_time && value <= this.formData.begin_time) {
        callback(new Error("上课结束时间必须大于上课开始时间"));
      } else {
        callback();
      }
    };
    var MaxTimeCheck = (rule, value, callback) => {
      if (this.formData.end_time && value >= this.formData.end_time) {
        callback(new Error("上课开始时间必须小于上课结束时间"));
      } else {
        callback();
      }
    };

    return {
      loading: false,
      commiting: false,
      list: [],
      mode: 0,
      dateRange: null,
      listData: {},
      isAdd: false,
      isShow: false,
      conds: [],
      pager: {
        totalSize: 30,
        pageSize: 20,
        page: 1,
        changeFunc: val => {
          this.pager.page = val;
          this.loadData();
        }
      },
      searchControls: [
        // {
        //   type: 1,
        //   label: "关键字",
        //   field: "kw",
        //   key: "name,mobile,id",
        //   op: "kw"
        // },
        {
          type: 2,
          label: "上课类型",
          field: "course_type",
          options: COURSE_TYPES
        },
        {
          type: 2,
          label: "所属校区",
          field: "school_id",
          options: []
        },
        {
          type: 2,
          label: "所属课程",
          field: "course_id",
          options: []
        },
        {
          type: 2,
          label: "上课讲师",
          field: "main_teacher_id",
          options: []
        },
        {
          type: 2,
          label: "上课助教",
          field: "assist_teacher_id",
          options: []
        },

        {
          type: 72,
          label: "上课日期",
          field: "plan_date",
          changeFunc: (control, val) => {
            // console.log(val);
            this.dateRange = val;
          }
        },
        {
          type: 72,
          label: "创建时间",
          field: "created_at"
        }
      ],
      currentDate: new Date(),
      formData: {},
      controls: [
        {
          label: "上课日期(支持多选)",
          field: "dates",
          type: 78,
          rules: [
            {
              required: true,
              message: "上课日期不能为空",
              trigger: "change"
            }
          ]
        },
        {
          label: "上课开始时间",
          field: "begin_time",
          type: 6,
          pickerOptions: {
            start: "07:30",
            step: "00:15",
            end: "23:30"
          },
          rules: [
            {
              required: true,
              message: "上课开始时间不能为空",
              trigger: "change"
            },
            {
              validator: MaxTimeCheck,
              trigger: "change"
            }
          ]
        },
        {
          label: "上课结束时间",
          field: "end_time",
          type: 6,
          pickerOptions: {
            start: "07:30",
            step: "00:15",
            end: "23:30"
          },
          rules: [
            {
              required: true,
              message: "上课结束时间不能为空",
              trigger: "change"
            },
            {
              validator: MinTimeCheck,
              trigger: "change"
            }
          ]
        },
        {
          label: "所属校区",
          field: "school_id",
          type: 2,
          options: [],
          rules: [
            {
              required: true,
              message: "所属校区不能为空",
              trigger: "change"
            }
          ],
          changeFunc: (control, val) => {
            // console.log(val);
            this.formData["assoc_owner"] = [];
            this.formData["classroom_id"] = "";
            this.loadClassrooms(val);
            this.loadOwner(null);
          }
        },
        {
          label: "排课对象",
          field: "assoc_owner",
          type: 21,
          options: [
            {
              label: "按班级",
              value: "sys_class",
              children: []
            },
            {
              label: "按学生",
              value: "student",
              children: []
            }
          ],
          changeFunc: val => {
            // console.log(val);
            this.loadOwner(val);
          },
          rules: [
            {
              required: true,
              message: "排课对象不能为空",
              trigger: "change"
            }
          ]
        },
        {
          label: "所属课程",
          field: "course_id",
          type: 2,
          options: [],
          rules: [
            {
              required: true,
              message: "所属课程不能为空",
              trigger: "change"
            }
          ]
        },
        {
          label: "上课类型",
          field: "course_type",
          type: 3,
          options: COURSE_TYPES,
          rules: [
            {
              required: true,
              message: "上课类型不能为空",
              trigger: "change"
            }
          ]
        },
        {
          label: "授课老师",
          field: "main_teacher_id",
          type: 2,
          options: [],
          rules: [
            {
              required: true,
              message: "授课老师不能为空",
              trigger: "change"
            }
          ]
        },
        {
          label: "助教老师",
          field: "assist_teacher_id",
          type: 2,
          options: [],
          rules: []
        },
        {
          label: "上课地点",
          field: "classroom_id",
          type: 2,
          options: [],
          changeFunc: val => {
            // this.loadClassrooms(val);
          },
          rules: []
        },
        {
          label: "提醒老师上课",
          field: "need_notify_teacher",
          type: 5
        },
        {
          label: "提醒学生(家长)上课",
          field: "need_notify_student",
          type: 5
        },
        {
          label: "课表优先级",
          field: "sort",
          type: 1,
          subtype: "number",
          placeholder: "值越大，越优先；主要用于通用课表中出现的特殊排课需求"
        },
        {
          label: "备注",
          field: "memo",
          type: 1,
          rules: []
        }
      ]
    };
  },
  watch: {
    currentDate(val) {
      this.loadData(this.conds);
    }
  },
  mounted() {
    this.loadData();
    this.loadSchools();
    this.loadCourses();
    this.loadTeachers();
  },
  methods: {
    coursesByDate(date) {
      date = this.$moment(date).format("YYYY-MM-DD");
      return this.listData[date] || [];
    },
    getWeedDay(date) {
      const index = parseInt(this.$moment(date).format("E"));
      // console.log(index);
      return WEEK_DAYS[index - 1];
    },
    courseTypename(type) {
      for (let i = 0; i < COURSE_TYPES.length; i++) {
        if (COURSE_TYPES[i].value == type) {
          return COURSE_TYPES[i].label;
        }
      }
    },
    selectMode(mode) {
      this.mode = mode;
    },
    loadClassrooms(val) {
      this.$get(
        "admin/common/classroom/list",
        { conds: JSON.stringify([{ k: "school_id", op: "=", v: val }]) },
        res => {
          if (res.code === 0) {
            let temp = [];
            (res.data || []).forEach(ele => {
              temp.push({
                label: ele.name,
                value: ele.id
              });
            });

            for (let i = 0; i < this.controls.length; i++) {
              if (this.controls[i].field === "classroom_id") {
                this.controls[i].options = temp;
                break;
              }
            }
          }
        }
      );
    },
    loadCourses() {
      this.$get("admin/common/course/list", null, res => {
        if (res.code === 0) {
          let temp = [];
          (res.data || []).forEach(ele => {
            temp.push({
              label: ele.name,
              value: ele.id
            });

            for (let i = 0; i < this.controls.length; i++) {
              if (this.controls[i].field === "course_id") {
                this.controls[i].options = temp;
                this.searchControls[2].options = temp;
                break;
              }
            }
          });
        }
      });
    },
    loadTeachers() {
      this.$get("admin/common/teacher/list", null, res => {
        if (res.code === 0) {
          let temp = [];
          (res.data || []).forEach(ele => {
            temp.push({
              label: ele.name,
              value: ele.id
            });
            for (let i = 0; i < this.controls.length; i++) {
              if (
                this.controls[i].field == "main_teacher_id" ||
                this.controls[i].field == "assist_teacher_id"
              ) {
                this.controls[i].options = temp;
                this.searchControls[3].options = temp;
                this.searchControls[4].options = temp;
              }
            }
          });
        }
      });
    },
    loadSchools() {
      this.$get("admin/common/school/list", null, res => {
        if (res.code === 0) {
          let temp = [];
          (res.data || []).forEach(ele => {
            temp.push({
              label: ele.name,
              value: ele.id
            });
          });
          for (let i = 0; i < this.controls.length; i++) {
            if (this.controls[i].field === "school_id") {
              this.controls[i].options = temp;
              this.searchControls[1].options = temp;
              break;
            }
          }
        }
      });
    },
    loadOwner(val) {
      if (!val) {
        const arr = this.controls[4].options;
        console.log(arr);
        arr.forEach(op => {
          // if (op.value == type) {
          op.children = [];
          // }
        });
        return;
      }
      if (val.length === 1) {
        // const school_id = val[0];
        const type = val[0];
        this.$get(
          `admin/common/${type}/list`,
          {
            conds: JSON.stringify([
              { k: "school_id", op: "=", v: this.formData.school_id }
            ])
          },
          res => {
            // console.log(res);
            if (res.code === 0) {
              let temp = [];
              (res.data || []).forEach(ele => {
                temp.push({ label: ele.name, value: ele.id });
              });
              const arr = this.controls[4].options;
              arr.forEach(op => {
                if (op.value == type) {
                  op.children = temp;
                }
              });
            }
          }
        );
      }
      // this.$get("admin/common/student/list", null, res => {});
    },
    loadData(conds = []) {
      this.conds = conds || [];
      this.loading = true;
      let params = {};
      params.page = this.pager.page;
      params.size = this.pager.pageSize;

      let beginDateOfMonth = this.$moment(this.currentDate).startOf("month");
      let endDateOfMonth = this.$moment(this.currentDate).endOf("month");

      beginDateOfMonth = this.$moment(beginDateOfMonth).format("YYYY-MM-DD");
      endDateOfMonth = this.$moment(endDateOfMonth).format("YYYY-MM-DD");

      if (this.conds.length > 0) {
        params.conds = JSON.stringify(
          this.conds.concat([
            {
              k: "plan_date",
              op: "rg",
              v: `${beginDateOfMonth},${endDateOfMonth}`
            }
          ])
        );
      } else {
        params.conds = JSON.stringify([
          {
            k: "plan_date",
            op: "rg",
            v: `${beginDateOfMonth},${endDateOfMonth}`
          }
        ]);
      }

      this.$get("admin/common/class_schedule/list", params, res => {
        console.log(res);
        this.loading = false;
        if (res.code == 0) {
          this.list = res.data;
          let dict = {};
          res.data.forEach(obj => {
            let arr = dict[obj.plan_date] || [];
            arr.push(obj);
            dict[obj.plan_date] = arr;
          });

          this.listData = dict;
        }
      });
      // console.log(this.pager.page);
    },
    search() {
      this.loadData();
    },
    handleSelectionChange(rows) {},
    openForm(type) {
      this.formData = {
        course_type: "1",
        need_notify_teacher: true,
        need_notify_student: false
      };
      this.isAdd = true;
      this.isShow = true;
    },
    openModel() {
      // this.$refs.commForm.clearValidates();
      this.$refs.commForm && this.$refs.commForm.clearValidates();
    },
    editItem(item) {
      this.formData = Object.assign({}, item);
      this.formData.course_type = item.course_type.toString();
      this.formData.dates = [item.plan_date];
      // console.log(this.formData);
      this.loadOwner([item.assoc_owner[0]]);
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
            "admin/common/class_schedule/delete",
            { ids: item.id },
            res => {
              this.loading = false;
              if (res.code == 0) {
                this.$message({
                  type: "success",
                  message: "删除成功"
                });
                this.list.splice(this.list.indexOf(item), 1);
                this.pager.totalSize -= 1;
              }
            }
          );
        })
        .catch();
    },
    commit() {
      this.$refs.commForm.validateFields(valid => {
        if (valid) {
          if (this.isAdd) {
            this.doCommit();
          } else {
            this.commit2();
          }
        }
      });
    },
    commit2() {
      this.commiting = true;
      let params = Object.assign({}, this.formData);
      this.$post(
        "admin/common/class_schedule/save",
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
              message: "修改成功！"
            });
            this.loadData();
          }
        }
      );
    },
    doCommit() {
      // console.log(this.formData);
      // return;

      this.commiting = true;

      let params = Object.assign({}, this.formData);

      // params["dates"] = this.formData["dates"].join(",");

      this.$post(
        "admin/class_schedules",
        {
          dates: this.formData["dates"].join(","),
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
.no-data {
  font-size: 16px;
  color: #999;
  padding: 15px 0;
}
.date {
  margin: 0;
  margin-bottom: 10px;
  .day {
    font-size: 16px;
    color: #333;
  }
  .week {
    padding-left: 10px;
    font-size: 14px;
    color: #333;
  }
}
.course-box {
  // font-size: 14px;
  &.bg-1 {
    background: #409eff;
  }
  &.bg-2 {
    background: #f56c6c;
  }
  &.bg-3 {
    background: #e6a23c;
  }
  &.bg-4 {
    background: #67c23a;
  }
  margin-bottom: 5px;
  background: #999;
  padding: 10px;
  border-radius: 8px;
  .course {
    color: #fff;
    font-size: 14px;
    margin-bottom: 10px;
    .type {
      display: inline-block;
      // margin-right: 5px;
      color: #fff;
    }
  }
  .time,
  .owner,
  .teachers {
    font-size: 12px;
    color: #fff;
  }
}
</style>

<style lang="scss">
.el-calendar-table .el-calendar-day {
  height: auto !important;
}
.next,
.prev {
  .day,
  .week {
    color: #999 !important;
  }
}
.is-today {
  .day,
  .week {
    color: #409eff !important;
  }
}
.tab-wrap {
  border-bottom: 1px solid #eee;
  padding: 0 15px;
  .tab {
    display: inline-block;
    width: 80px;
    height: 50px;
    line-height: 50px;
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    color: #666;
    cursor: pointer;
    user-select: none;
    margin-right: 10px;

    &.active {
      color: #409eff !important;
      border-bottom: 2px solid #409eff;
    }
  }
}
</style>

