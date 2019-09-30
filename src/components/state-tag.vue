<template>
  <div
    class="state-tag"
    :class="{success: type=='success', primary: type == 'primary', warning: type == 'warning', danger: type == 'danger'}"
  >
    <span class="dot"></span>
    <span class="state">{{label}}</span>
  </div>
</template>
<script>
import { type } from "os";
export default {
  name: "state-tag",
  props: {
    type: {
      type: String,
      default: ""
    },
    label: {
      type: String,
      required: true
    }
  }
};
</script>
<style lang="scss" scoped>
.state-tag {
  display: inline-block;
  font-size: 0;
  .dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 6px;
    vertical-align: middle;
    background: #666;
  }
  &.warning {
    .dot {
      background: #e6a23c !important;
    }
  }
  &.success {
    .dot {
      background: #67c23a !important;
    }
  }
  &.danger {
    .dot {
      background: #f56c6c !important;
    }
  }
  &.primary {
    .dot {
      background: #409eff !important;
    }
  }

  .state {
    display: inline-block;
    padding: 5px;
    font-size: 14px;
    line-height: 14px;
    vertical-align: middle;
    color: #666;
  }
}
</style>


