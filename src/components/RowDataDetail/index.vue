<template>
  <div class="row-data-detail">
    <el-dialog :title="title" :visible.sync="opened" @close="close" append-to-body width="70%">
      <div class="item-detail">
        <table class="detail-table">
          <tr v-for="(item,index) in list" :key="index">
            <td class="label">{{item.label}}</td>
            <td class="value">{{item.value}}</td>
          </tr>
        </table>
      </div>
    </el-dialog>
  </div>
</template>
<script>
export default {
  name: "row-data-detail",
  props: {
    // dialog: {
    //   type: Object,
    //   required: true
    // }
    title: {
      type: String,
      required: true
    },
    opened: {
      type: Boolean
      //   required: true
    },
    list: {
      type: Array
    }
  },
  methods: {
    close() {
      this.$emit("closed");
    }
  }
};
</script>
<style lang="scss" scoped>
.row-data-detail {
  .item-detail {
    .detail-table {
      width: 100%;
      .label {
        width: 30% !important;
        font-size: 14px;
        color: #888;
      }
      .value {
        font-size: 14px;
        color: #333;
      }
    }
  }
}
</style>


