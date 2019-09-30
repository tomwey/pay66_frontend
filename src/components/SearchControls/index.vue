<template>
  <div class="search-controls">
    <el-form :model="filterModel" :inline="true" label-width="80px">
      <el-form-item
        :label="control.label"
        size="small"
        :prop="control.field"
        v-for="(control, index) in formControls"
        :key="index"
      >
        <!-- 文本输入控件 type = 1 -->
        <el-input
          v-model="filterModel[control.field]"
          v-if="control.type === 1 && control.subtype !== 'number'"
          :type="control.subtype || 'text'"
          :rows="6"
          size="small"
          :disabled="control.disabled"
          :placeholder="control.placeholder || '输入' + control.label"
        >
          <template slot="append" v-if="!!control.unit">{{control.unit}}</template>
        </el-input>

        <!-- 文本输入数字控件 type = 1 && subtype = number -->
        <el-input
          v-model.number="filterModel[control.field]"
          v-if="control.type === 1 && control.subtype === 'number'"
          :type="control.subtype || 'text'"
          :disabled="control.disabled"
          :placeholder="control.placeholder || '输入' + control.label"
        >
          <template slot="append" v-if="!!control.unit">{{control.unit}}</template>
        </el-input>

        <!-- 下拉选控件 type = 2 -->
        <el-select
          v-if="control.type === 2"
          :multiple="control.multiple"
          clearable
          filterable
          @change="onSelectControl(control)"
          v-model="filterModel[control.field]"
          :disabled="control.disabled"
          :placeholder="control.placeholder || '选择' + control.label"
        >
          <el-option
            v-for="item in control.options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          ></el-option>
        </el-select>

        <!-- 级联下拉选 type = 21 -->
        <el-cascader
          v-if="control.type === 21"
          v-model="filterModel[control.field]"
          :placeholder="control.placeholder || '选择' + control.label"
          :disabled="control.disabled"
          :options="control.options"
          :props="control.props"
          clearable
          filterable
          @change="onSelectControl(control)"
          @active-item-change="control.changeFunc"
        ></el-cascader>

        <!-- 单选框控件 type = 3 -->
        <el-radio-group
          :disabled="control.disabled"
          v-if="control.type === 3"
          v-model="filterModel[control.field]"
        >
          <el-radio
            :label="item.value"
            v-for="item in control.options"
            :key="item.value"
          >{{item.label}}</el-radio>
        </el-radio-group>

        <!-- 复选框控件 type = 4 -->
        <el-checkbox-group
          v-if="control.type === 4"
          :disabled="control.disabled"
          v-model="filterModel[control.field]"
        >
          <el-checkbox
            v-for="item in control.options"
            :label="item.value"
            :key="item.value"
          >{{item.label}}</el-checkbox>
        </el-checkbox-group>

        <!-- 开关控件 type = 5 -->
        <el-switch
          :disabled="control.disabled"
          v-if="control.type === 5"
          v-model="filterModel[control.field]"
          :active-text="control.yesText"
          :inactive-text="control.noText"
        ></el-switch>

        <!-- 时间选择器 type = 6 -->
        <el-time-select
          :disabled="control.disabled"
          v-if="control.type === 6"
          v-model="filterModel[control.field]"
          :picker-options="control.pickerOptions"
          :placeholder="control.placeholder || '选择' + control.label"
        ></el-time-select>

        <!-- 日期选择器 type = 7 -->
        <el-date-picker
          :disabled="control.disabled"
          v-if="control.type === 7"
          v-model="filterModel[control.field]"
          type="date"
          :placeholder="control.placeholder || '选择' + control.label"
          value-format="yyyy-MM-dd"
        ></el-date-picker>

        <!-- 日期范围选择 -->
        <el-date-picker
          v-if="control.type === 72"
          v-model="filterModel[control.field]"
          type="daterange"
          align="right"
          value-format="yyyy-MM-dd"
          unlink-panels
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :picker-options="rangeOptions"
          @change="onSelectControl(control)"
        ></el-date-picker>
      </el-form-item>
      <el-form-item size="small">
        <div class="commit-buttons">
          <el-button type="primary" size="small" @click="search">筛选</el-button>
          <span class="reset-btn" @click="reset">清空筛选条件</span>
        </div>
        <!-- <el-button type="primary" size="small" @click="search">筛选</el-button>
        <span class="reset-btn" @click="reset">清空筛选条件</span>-->
      </el-form-item>
    </el-form>
    <!-- <div class="commit-buttons">
      <el-button type="primary" size="small" @click="search">筛选</el-button>
      <span class="reset-btn" @click="reset">清空筛选条件</span>
    </div>-->
  </div>
</template>
<script>
export default {
  name: "search-controls",
  props: {
    controls: {
      type: Array
    }
  },
  data() {
    return {
      filterModel: {},
      rangeOptions: {
        shortcuts: [
          {
            text: "最近一周",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit("pick", [start, end]);
            }
          },
          {
            text: "最近一个月",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
              picker.$emit("pick", [start, end]);
            }
          },
          {
            text: "最近三个月",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
              picker.$emit("pick", [start, end]);
            }
          }
        ]
      }
    };
  },
  computed: {
    formControls() {
      if (!this.controls || this.controls.length == 0) {
        return [
          {
            type: 1,
            label: "关键字",
            field: "kw",
            op: "kw",
            key: "kw"
          },
          {
            type: 72,
            label: "创建时间",
            field: "created_at",
            op: "rg"
          }
        ];
      }

      return this.controls;
    }
  },
  methods: {
    onSelectControl(control) {
      this.$emit("onSelectControl", control);
      if (control.changeFunc) {
        control.changeFunc(control, this.filterModel[control.field]);
      }
    },
    search() {
      let conds = [];
      this.formControls.forEach(control => {
        let value = `${this.filterModel[control.field]}`;
        if (control.type === 72 && this.filterModel[control.field]) {
          value = `${this.filterModel[control.field][0]},${
            this.filterModel[control.field][1]
          }`;
        }

        if (value && value !== "undefined" && value != "null") {
          if (control.key == "opened") {
            if (value != "-1") {
              conds.push({
                k: "opened",
                op: "=",
                v: value == "0" ? false : true
              });
            }
          } else {
            conds.push({
              k: control.key || control.field,
              op: control.type === 72 ? "rg" : control.op,
              v: value
            });
          }
        }
      });
      this.$emit("search", conds);
    },
    reset() {
      this.filterModel = {};

      this.$emit("search", []);
    }
  }
};
</script>
<style lang="scss" scoped>
.search-controls {
  padding: 20px 20px 2px;
  background: rgb(247, 248, 249);

  .el-form--inline .el-form-item {
    margin-right: 30px;
  }

  .commit-buttons {
    // text-align: center;
    // padding-left: 80px;
    font-size: 0;
    .reset-btn {
      display: inline-block;
      font-size: 14px;
      vertical-align: top;
      line-height: 14px;
      padding: 9px 10px;
      margin-left: 10px;
      cursor: pointer;
      user-select: none;
      color: #409eff;
    }
  }
}
</style>


