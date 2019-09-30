<template>
  <div class="list-wrapper" v-loading="loading">
    <div class="title-bar">
      <h3 class="title">{{isEdit ? '添加课程单元' : '修改课程单元'}}</h3>
      <div class="buttons">
        <el-button size="mini" @click="back">返 回</el-button>
      </div>
    </div>

    <div class="unit-form-wrap">
      <div class="base">
        <h3 class="title">基本信息</h3>
        <comm-form :controls="controls" ref="commForm" :form-data="formData"></comm-form>
      </div>
      <div class="unit-contents">
        <h3 class="title">单元内容</h3>
        <span class="add-content-btn" @click="addContentForm">
          <i class="el-icon-circle-plus-outline"></i>添加内容
        </span>
        <div class="content-form" v-for="(form,index) in contentForms" :key="index">
          <span class="delete-btn" @click="deleteContentForm(index)">
            <!-- <i class="el-icon-remove-outline"></i> -->
            删 除
          </span>
          <span class="order">{{index + 1}}</span>
          <comm-form :controls="form.controls" :ref="'form' + index" :form-data="form.formData"></comm-form>
        </div>
      </div>
    </div>
    <div class="commit-buttons">
      <el-button type="danger" size="mini" @click="reset">重 置</el-button>
      <el-button type="primary" size="mini" @click="save">保 存</el-button>
    </div>
  </div>
</template>
<script>
export default {
  name: "unit-form",
  components: {
    commForm: resolve => require(["@/components/CommForm"], resolve)
  },
  data() {
    return {
      loading: false,
      controls: [
        {
          label: "单元名称",
          field: "name",
          type: 1,
          rules: [
            { required: true, message: "单元名称不能为空", trigger: "blur" }
          ]
        },
        {
          label: "封面图",
          field: "cover",
          type: 8,
          accept: ".jpg,.jpeg,.gif,.png"
        },
        {
          label: "简介",
          field: "intro",
          type: 1,
          rules: [{ required: true, message: "简介不能为空", trigger: "blur" }]
        },
        {
          label: "上课时长(分钟)",
          field: "teach_length",
          type: 1,
          subtype: "number",
          unit: "分钟",
          rules: [
            { required: true, message: "上课时长不能为空", trigger: "blur" }
          ]
        },
        {
          label: "备注",
          field: "memo",
          type: 1,
          rules: []
        }
      ],
      formData: {},
      contentForms: [
        {
          formData: {},
          controls: [
            {
              label: "内容名称",
              field: "name",
              type: 1,
              rules: [
                { required: true, message: "内容名称不能为空", trigger: "blur" }
              ]
            },
            {
              label: "内容类型",
              field: "_type",
              type: 3,
              options: [
                {
                  label: "课件",
                  value: 1
                },
                {
                  label: "作业",
                  value: 2
                },
                {
                  label: "演示视频",
                  value: 3
                },
                {
                  label: "教学视频",
                  value: 4
                },
                {
                  label: "其他",
                  value: 5
                }
              ],
              rules: [
                {
                  required: true,
                  message: "内容类型不能为空",
                  trigger: "change"
                }
              ]
            },
            {
              label: "内容文件",
              field: "file",
              type: 8,
              rules: [
                { required: true, message: "内容文件不能为空", trigger: "blur" }
              ]
            },
            {
              label: "备注",
              field: "memo",
              type: 1,
              rules: []
            }
          ]
        }
      ]
    };
  },
  mounted() {
    this.reset();
  },
  computed: {
    isEdit() {
      return this.$route.path.indexOf("/units/edit") !== -1;
    },
    unit() {
      if (this.isEdit) {
        return JSON.parse(sessionStorage.getItem("item"));
      }
      return null;
    }
  },
  methods: {
    addContentForm() {
      this.contentForms.push({
        formData: {},
        controls: [
          {
            label: "内容名称",
            field: "name",
            type: 1,
            rules: [
              { required: true, message: "内容名称不能为空", trigger: "blur" }
            ]
          },
          {
            label: "内容类型",
            field: "_type",
            type: 3,
            options: [
              {
                label: "课件",
                value: 1
              },
              {
                label: "作业",
                value: 2
              },
              {
                label: "演示视频",
                value: 3
              },
              {
                label: "教学视频",
                value: 4
              },
              {
                label: "其他",
                value: 99
              }
            ],
            rules: [
              {
                required: true,
                message: "内容类型不能为空",
                trigger: "change"
              }
            ]
          },
          {
            label: "内容文件",
            field: "file",
            type: 8,
            rules: [
              { required: true, message: "内容文件不能为空", trigger: "blur" }
            ]
          },
          {
            label: "内容大小",
            field: "size",
            type: 1,
            subtype: "number",
            unit: "字节"
          },
          {
            label: "备注",
            field: "memo",
            type: 1,
            rules: []
          }
        ]
      });
    },
    deleteContentForm(index) {
      if (this.contentForms.length > 1) {
        this.contentForms.splice(index, 1);
      } else {
        this.$message({
          type: "warning",
          message: "至少需要1个单元内容"
        });
      }
    },
    checkFormFields(formRef) {
      return new Promise(resolve => {
        if (!formRef || !this.$refs[formRef]) {
          resolve(false);
        } else {
          let refObj = this.$refs[formRef];
          if (Array.isArray(refObj) && refObj.length > 0) {
            refObj = refObj[0];
          }

          refObj.validateFields(valid => {
            resolve(valid);
          });
        }
      });
    },
    back() {
      this.$router.push({ path: "/courses/units" });
    },
    reset() {
      if (this.unit && this.unit.contents) {
        let temp = [];
        // console.log(this.unit);
        this.formData = Object.assign({}, this.unit);
        delete this.formData["contents"];
        this.unit.contents.forEach(obj => {
          temp.push({
            formData: Object.assign({}, obj),
            controls: [
              {
                label: "内容名称",
                field: "name",
                type: 1,
                rules: [
                  {
                    required: true,
                    message: "内容名称不能为空",
                    trigger: "blur"
                  }
                ]
              },
              {
                label: "内容类型",
                field: "_type",
                type: 3,
                options: [
                  {
                    label: "课件",
                    value: 1
                  },
                  {
                    label: "作业",
                    value: 2
                  },
                  {
                    label: "演示视频",
                    value: 3
                  },
                  {
                    label: "教学视频",
                    value: 4
                  },
                  {
                    label: "其他",
                    value: 5
                  }
                ],
                rules: [
                  {
                    required: true,
                    message: "内容类型不能为空",
                    trigger: "change"
                  }
                ]
              },
              {
                label: "内容文件",
                field: "file",
                type: 8,
                rules: [
                  {
                    required: true,
                    message: "内容文件不能为空",
                    trigger: "blur"
                  }
                ]
              },
              {
                label: "备注",
                field: "memo",
                type: 1,
                rules: []
              }
            ]
          });
        });
        this.contentForms = temp;
      } else {
        this.formData = {};
        this.contentForms.forEach(form => {
          form.formData = {};
        });
      }
    },
    doCommit() {
      let params = Object.assign({}, this.formData);

      let contents = [];
      this.contentForms.forEach(form => {
        contents.push(Object.assign({}, form.formData));
      });

      if (contents.length == 0) {
        this.$message({
          type: "warning",
          message: "至少需要1个单元内容"
        });
        return;
      }

      params["contents"] = contents;

      this.loading = true;

      this.$post(
        "admin/common/course_unit/save",
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
            this.back();
          }
        }
      );
    },
    save() {
      // console.log(this.contentForms);
      // console.log(this.formData);

      let validCount = 0;
      let promises = [];
      promises.push(
        this.checkFormFields("commForm").then(valid => {
          if (valid) {
            validCount++;
          }
        })
      );

      for (let i = 0; i < this.contentForms.length; i++) {
        promises.push(
          this.checkFormFields(`form${i}`).then(valid => {
            if (valid) {
              validCount++;
            }
          })
        );
      }

      Promise.all(promises)
        .then(() => {
          if (validCount == promises.length) {
            this.doCommit();
          }
        })
        .catch(error => {
          // console.log(error);
        });
    }
  }
};
</script>
<style lang="scss" scoped>
.unit-form-wrap {
  //   display: flex;
  width: 100%;
  padding: 30px 120px;
  .base {
    .form-wrapper {
      padding: 0 120px 0 60px;
    }
  }

  .title {
    font-weight: normal;
    margin-bottom: 30px;
    border-bottom: 1px solid #eee;
    padding-bottom: 20px;
  }
}
.commit-buttons {
  padding: 30px 30px 60px;
  text-align: center;
}

.unit-contents {
  // border: 1px dashed #ccc;
  position: relative;
  margin-top: 60px;

  .add-content-btn {
    display: inline-block;
    position: absolute;
    right: -8px;
    top: -10px;
    font-size: 14px;
    line-height: 14px;
    padding: 10px;
    cursor: pointer;
    user-select: none;
    color: #409eff;
    i {
      vertical-align: -2px;
      margin-right: 5px;
      font-size: 18px;
    }
  }

  .content-form {
    // padding: 20px 60px 5px 0;
    padding: 30px 120px 12px 60px;
    border: 1px dashed #e6e6e6;
    margin-bottom: 30px;
    // background: rgb(247, 248, 249);
    position: relative;
    .order {
      display: inline-block;
      position: absolute;
      top: 30px;
      left: 20px;
      width: 40px;
      height: 40px;
      line-height: 40px;
      border-radius: 40px;
      border: 1px solid #999;
      color: #999;
      font-size: 22px;
      text-align: center;
      vertical-align: middle;
    }
    .delete-btn {
      display: inline-block;
      // font-size: 18px;
      padding: 0 10px;
      position: absolute;
      right: 20px;
      top: 30px;
      color: #fff;
      background: #f56c6c;
      font-size: 12px;
      height: 32px;
      line-height: 32px;
      border-radius: 3px;
      vertical-align: middle;
      font-family: "PingFang SC", Arial, Helvetica, sans-serif;
      cursor: pointer;
      user-select: none;
      i {
        font-size: 24px;
        color: #f56c6c;
      }
    }
  }
}
</style>



