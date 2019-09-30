<template>
  <div class="dashboard"></div>
</template>
<script>
import clip from "@/utils/clipboard";
import { dateFormat } from "@/utils/tools";

// 引入基本模板
// let echarts = require("echarts/lib/echarts");
// // 引入柱状图组件
// require("echarts/lib/chart/bar");
// require("echarts/lib/chart/line");
// // 引入提示框和title组件
// require("echarts/lib/component/tooltip");
// require("echarts/lib/component/title");
// require("echarts/lib/component/legend");

export default {
  name: "dashboard",
  data() {
    return {};
  },
  watch: {
    // salaryDateType() {
    //   this.loadSalaries();
    // },
    // salaryJobType() {
    //   this.loadSalaries();
    // },
    // salaryOwnerType() {
    //   this.loadSalaries();
    // },
    // applyJobType() {
    //   this.loadOtherApplies();
    // }
  },
  mounted() {
    // this.loadStats();
    // this.loadTodayApplies();
    // this.loadOtherApplies();
    // this.loadSalaries();
    // this.loadJobs();
    // this.drawSalaryBar();
  },
  methods: {
    drawJobBar() {
      let temp = [];
      // console.log(this.jobData);
      this.jobData.jobs.forEach(job => {
        // temp.push(`「${job.proj_name}」${job.job_name}`);
        temp.push(job.job_name);
      });

      // console.log(temp);

      if (temp.length === 0) return;

      let myChart = echarts.init(document.getElementById("today-apply-graph"));
      // console.log(myChart);

      myChart.setOption({
        color: ["rgb(98, 168, 58)", "#E6A23C", "#F56C6C"],
        title: { text: "报名及签到情况" },
        tooltip: {},
        xAxis: {
          type: "category",
          data: temp,
          axisLabel: {
            rotate: 20,
            interval: 0
          }
        },
        grid: {
          //直角坐标系内绘图网格
          // show: true, //是否显示直角坐标系网格。[ default: false ]
          // left: "20%", //grid 组件离容器左侧的距离。
          // right: "30px",
          // borderColor: "#c45455", //网格的边框颜色
          bottom: "30%" //
        },
        yAxis: {
          type: "value"
        },
        legend: {
          data: ["报名人数", "签到人数", "签退人数"]
        },
        calculable: true,
        series: [
          {
            name: "报名人数",
            type: "bar",
            data: this.jobData.total_bm,
            barWidth: 18
          },
          {
            name: "签到人数",
            type: "bar",
            data: this.jobData.total_qd,
            barWidth: 18
          },
          {
            name: "签退人数",
            type: "bar",
            data: this.jobData.total_qt,
            barWidth: 18
          }
        ]
      });
    },
    drawApplyBar() {
      let myChart = echarts.init(document.getElementById("apply-graph"));
      // console.log(myChart);

      myChart.setOption({
        color: ["rgb(98, 168, 58)", "#E6A23C", "#F56C6C"],
        title: { text: "报名及签到情况" },
        tooltip: {},
        xAxis: {
          type: "category",
          data: this.applyData.dates
        },
        yAxis: {
          type: "value"
        },
        legend: {
          data: ["报名人数", "签到人数", "签退人数"]
        },
        series: [
          {
            name: "报名人数",
            type: "bar",
            data: this.applyData.total_bm,
            barWidth: 18
          },
          {
            name: "签到人数",
            type: "bar",
            data: this.applyData.total_qd,
            barWidth: 18
          },
          {
            name: "签退人数",
            type: "bar",
            data: this.applyData.total_qt,
            barWidth: 18
          }
        ]
      });
    },
    drawSalaryBar() {
      let myChart = echarts.init(document.getElementById("salary-graph"));
      // console.log(myChart);

      myChart.setOption({
        color: "rgb(98, 168, 58)",
        title: { text: "工资汇总" },
        tooltip: {},
        xAxis: {
          type: "category",
          data: this.salaryData.dates
        },
        yAxis: {
          type: "value"
        },
        series: [
          {
            name: "工资总额(元)",
            type: "line",
            data: this.salaryData.total_money
          }
        ]
      });
    },
    loadJobs() {
      this.$get("manager/jobs", null, resp => {
        // console.log(resp);
        if (resp.code === 0) {
          let temp = [{ label: "全部兼职", value: "" }];
          // this.jobs = [{ name: '全部兼职',id: '' }].concat(resp.data);
          resp.data.forEach(ele => {
            temp.push({
              label: `「${ele.project.name}」${ele.name}`,
              value: ele.id
            });
          });
          this.jobs = temp;
          // this.sourceData = this.list;
        }
      });
    },
    loadTodayApplies() {
      this.todayLoading = true;
      let now = new Date();
      let begin_date = dateFormat(now);
      // now.setDate(now.getDate() + 7);
      // let end_date = dateFormat(now);
      this.$get(
        "manager/graph/today_jobs",
        { begin_date: begin_date, end_date: begin_date },
        res => {
          this.todayLoading = false;
          // console.log(res);
          if (res.code === 0) {
            this.jobData = res.data;
            // console.log(this.jobData);
            this.drawJobBar();
          }
        }
      );
    },
    loadOtherApplies() {
      this.otherAppliesLoading = true;
      let now = new Date();
      now.setDate(now.getDate() - 3);
      let begin_date = dateFormat(now);

      now = new Date();
      now.setDate(now.getDate() + 3);
      let end_date = dateFormat(now);

      this.$get(
        "manager/graph/applies",
        {
          begin_date: begin_date,
          end_date: end_date,
          job_id: this.applyJobType
        },
        res => {
          this.otherAppliesLoading = false;
          // console.log(res);
          if (res.code === 0) {
            this.applyData = res.data;
            this.drawApplyBar();
          }
        }
      );
    },
    loadSalaries() {
      this.salariesLoading = true;
      let now = new Date();
      let end_date = dateFormat(now);

      let days = 6;
      if (this.salaryDateType == "2") {
        days = 30;
      } else if (this.salaryDateType == "3") {
        days = 90;
      }

      now.setDate(now.getDate() - days);
      let begin_date = dateFormat(now);

      this.$get(
        "manager/graph/salaries",
        {
          begin_date: begin_date,
          end_date: end_date,
          job_id: this.salaryJobType,
          owner_type: this.salaryOwnerType
        },
        res => {
          this.salariesLoading = false;
          // console.log(res);
          if (res.code === 0) {
            this.salaryData = res.data;
          } else {
            this.salaryData = {};
          }

          this.drawSalaryBar();
        }
      );
    },
    loadStats() {
      this.statsLoading = true;
      this.$get("manager/stats", null, res => {
        // console.log(res);
        this.statsLoading = false;
        if (res.code === 0) {
          this.stats = res.data;
        }
      });
    },
    handleCopy(text, event) {
      clip(text, event);
    }
  }
};
</script>
<style lang="scss" scoped>
.dashboard {
  background: rgb(245, 247, 250);
  width: 100%;
  min-height: 640px;

  .company-panel {
    margin-bottom: 15px;

    .base-info {
      // line-height: 50px;
      .logo {
        max-width: 48px;
        border-radius: 50%;
      }
      .names {
        display: inline-block;
        margin-left: 10px;
        .title {
          margin: 0;
          padding: 0;
          font-size: 16px;
          height: 30px;
          line-height: 30px;
          // margin-bottom: 10px;
          color: #333;
        }
        .name,
        .address {
          font-size: 14px;
          line-height: 14px;
          color: #888;
          margin: 0;
        }
      }
    }
  }

  .stat-box {
    display: inline-block;
    width: 20%;
    // border-right: 1px solid #f2f2f2;
    // padding: 0 20px;
    &:last-child {
      border-right: 0;
    }

    &.users {
      i {
        color: #333;
        font-size: 52px !important;
      }
    }
    &.approved {
      i {
        color: #409eff;
        font-size: 52px !important;
      }
    }

    &.checkined {
      i {
        color: rgb(98, 168, 58) !important;
        font-size: 52px !important;
      }
    }

    &.total-salary {
      i {
        color: #f56c6c;
      }
    }

    &.unpayed-salary {
      i {
        color: #e6a23c;
      }
    }

    .icon,
    .stat {
      display: inline-block;
    }

    .icon {
      // width: 60px;
      margin-right: 10px;
      i {
        font-size: 44px;
      }
    }
    .stat {
      text-align: left;
      // width: 68%;
      .value {
        font-size: 20px;
        font-weight: 600;
        color: #333;
        .unit {
          font-size: 14px;
          padding-right: 5px;
        }
      }
      .label {
        font-size: 12px;
        color: #888;
      }
    }
  }

  .salary-stats {
    margin-top: 15px;
    .salary-box {
      display: inline-block;
      width: 33.333333%;
      padding-right: 15px;
      .label {
        font-size: 12px;
        color: #888;
        margin-bottom: 5px;
      }
      .value {
        font-size: 18px;
        color: #333;
        font-weight: 600;
        .unit {
          font-size: 12px;
          padding-right: 5px;
          // font-weight: normal;
        }
      }
    }
  }

  .other-panel {
    margin-top: 15px;
  }

  .salaries-panel {
    margin-top: 20px;
  }

  .company-wrapper {
    .company {
      text-align: center;
      .logo {
        width: 58px;
        height: 58px;
        border-radius: 50%;
      }
      .name {
        font-size: 16px;
        color: #333;
        margin: 0;
        margin: 10px 0;
      }
      .comp-name {
        font-size: 12px;
        color: #888;
        margin: 0;
      }
    }

    .account-info {
      p {
        margin: 0;
        font-size: 14px;
        padding-bottom: 10px;
      }
    }

    .homepage {
      text-align: center;
      img {
        max-width: 100%;
      }
      .scan-text {
        margin: 0;
        padding: 10px;
        font-size: 14px;
        color: #888;
        margin-bottom: 10px;
      }
    }
  }

  .graph-box {
    width: 100%;
    height: 300px;
  }

  .box-card {
    .title {
      display: inline-block;
      height: 40px;
      line-height: 40px;
    }
    .filter-section {
      float: right;
    }
  }

  #today-apply-graph {
    height: 400px;
  }
}
</style>


