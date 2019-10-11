<template>
  <div class="dashboard">
    <div class="left">
      <div class="total-stats">
        <div class="stat">
          <div class="stat-inner">
            <div class="icon merchant">
              <i class="iconfont icon-merchant"></i>
            </div>
            <div class="stat-item">
              <div class="name">商户数</div>
              <div class="value">0</div>
            </div>
          </div>
        </div>
        <div class="stat">
          <div class="stat-inner">
            <div class="icon shop">
              <i class="iconfont icon-shop"></i>
            </div>
            <div class="stat-item">
              <div class="name">门店数/设备数</div>
              <div class="value">0 / 0</div>
            </div>
          </div>
        </div>
        <div class="stat">
          <div class="stat-inner">
            <div class="icon order">
              <i class="iconfont icon-order"></i>
            </div>
            <div class="stat-item">
              <div class="name">总订单</div>
              <div class="value">0</div>
            </div>
          </div>
        </div>
        <div class="stat">
          <div class="stat-inner">
            <div class="icon money1">
              <i class="iconfont icon-money1"></i>
            </div>
            <div class="stat-item">
              <div class="name">总流水</div>
              <div class="value">
                <span class="unit">¥</span>0.00
              </div>
            </div>
          </div>
        </div>
        <div class="stat">
          <div class="stat-inner">
            <div class="icon money2">
              <i class="iconfont icon-money2"></i>
            </div>
            <div class="stat-item">
              <div class="name">总佣金</div>
              <div class="value">
                <span class="unit">¥</span>0.00
              </div>
            </div>
          </div>
        </div>
        <!-- </div>
        <div class="today-stats">-->
        <div class="stat">
          <div class="stat-inner">
            <div class="icon today-order">
              <i class="iconfont icon-order"></i>
            </div>
            <div class="stat-item">
              <div class="name">今日订单</div>
              <div class="value">0</div>
            </div>
          </div>
        </div>
        <div class="stat">
          <div class="stat-inner">
            <div class="icon today-money">
              <i class="iconfont icon-money1"></i>
            </div>
            <div class="stat-item">
              <div class="name">今日流水</div>
              <div class="value">
                <span class="unit">¥</span>0.00
              </div>
            </div>
          </div>
        </div>
        <div class="stat">
          <div class="stat-inner">
            <div class="icon today-earn">
              <i class="iconfont icon-money2"></i>
            </div>
            <div class="stat-item">
              <div class="name">今日佣金</div>
              <div class="value">
                <span class="unit">¥</span>0.00
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="right">
      <div class="company box">
        <img :src="$store.state.user.company.logo_url" />
        <h2 class="brand">{{$store.state.user.company.brand}}</h2>
        <div class="name">{{$store.state.user.company.name}}</div>
      </div>
      <div class="box">
        <h2>当前登录账号</h2>
        <div class="account">
          <p>账号名字: {{$store.state.user.name}}</p>
          <p>登录手机: {{$store.state.user.mobile}}</p>
          <p>账号角色: {{$store.state.user.is_admin ? '超级管理员' : $store.state.user.role_name}}</p>
        </div>
      </div>
    </div>
  </div>
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
    console.log(this.$store.state.user);
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

  display: flex;
  .left {
    flex: 1;
  }

  .right {
    flex: 0 0 210px;
    // padding-left: 15px;
    width: 210px;
    box-sizing: content-box;
    .box {
      background: #fff;
      h2 {
        font-size: 16px;
        color: #333;
        padding: 15px;
        border-bottom: 1px solid #f2f2f2;
      }
    }
    .account {
      padding: 0 15px 10px;
      p {
        margin: 10px 0;
        font-size: 14px;
        color: #333;
      }
    }
    .company {
      padding: 20px;
      text-align: center;
      h2 {
        border-bottom: 0;
        padding: 0;
        margin: 10px;
      }
      img {
        width: 70px;
        height: 70px;
        border-radius: 60px;
      }
      .name {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.total-stats,
.today-stats {
  display: flex;
  flex-wrap: wrap;
  .stat {
    flex: 0 0 25%;
    // width: 280px;

    .stat-inner {
      background: #fff;
      padding: 15px;
      margin-right: 15px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }

    // box-shadow: 0 0 3px ;
    .stat-item {
      flex: 1;
      text-align: right;
      .name {
        font-size: 14px;
        color: #999;
      }
      .value {
        font-size: 18px;
        color: #333;
        font-weight: 700;
        margin-top: 5px;
        padding-right: 2px;
        .unit {
          font-size: 12px;
          color: #333;
          font-weight: normal;
          padding-right: 3px;
        }
      }
    }
    .icon {
      flex: 0 0 40px;
      // padding: 20px;
      background: rgb(102, 157, 252);
      height: 40px;
      line-height: 40px;
      width: 40px;
      text-align: center;
      border-radius: 40px;
      color: #fff;
      i {
        font-size: 22px;
        // font-weight: 700;
      }
    }
  }
}
</style>


