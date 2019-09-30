<template>
  <div class="form-wrapper">
    <el-form
      ref="dataForm"
      :rules="rules"
      :model="formData"
      label-position="right"
      :validate-on-rule-change="false"
      label-width="120px"
      style="width:100%;"
    >
      <el-form-item
        :label="control.label"
        size="small"
        :prop="control.field"
        v-for="(control, index) in controls"
        :key="index"
      >
        <!-- 文本输入控件 type = 1 -->
        <el-input
          v-model="formData[control.field]"
          v-if="control.type === 1 && control.subtype !== 'number'"
          :type="control.subtype || 'text'"
          :rows="6"
          size="small"
          :disabled="control.disabled"
          :placeholder="control.placeholder || '输入' + control.label"
        >
          <template slot="append" v-if="!!control.unit">{{control.unit}}</template>
        </el-input>

        <!-- 富文本输入收件 type = 12 -->
        <!-- <editor
          id="tinymce"
          :disabled="control.disabled"
          v-if="control.type === 12"
          v-model="formData[control.field]"
          :init="editorInit"
        ></editor>-->
        <quill-editor
          class="editor"
          v-if="control.type === 12"
          v-model="formData[control.field]"
          ref="myQuillEditor"
          :options="editorOption"
          @blur="onEditorBlur(control)"
        ></quill-editor>

        <!-- 文本输入数字控件 type = 1 && subtype = number -->
        <el-input
          v-model.number="formData[control.field]"
          v-if="control.type === 1 && control.subtype === 'number'"
          :type="control.subtype || 'text'"
          :disabled="control.disabled"
          :placeholder="control.placeholder || '输入' + control.label"
        >
          <template slot="append" v-if="!!control.unit">{{control.unit}}</template>
        </el-input>

        <!-- 验证码控件 type = 11 -->
        <el-row v-if="control.type === 11">
          <el-col :span="18">
            <el-input
              v-model="formData[control.field]"
              type="number"
              :disabled="control.disabled"
              :placeholder="control.placeholder || '输入' + control.label"
            ></el-input>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" :disabled="control.disabled" plain>获取验证码</el-button>
          </el-col>
        </el-row>

        <!-- 下拉选控件 type = 2 -->
        <el-select
          v-if="control.type === 2"
          :multiple="control.multiple"
          v-model="formData[control.field]"
          @change="onSelectControl(control)"
          clearable
          filterable
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
          v-model="formData[control.field]"
          :placeholder="control.placeholder || '选择' + control.label"
          :disabled="control.disabled"
          :options="control.options"
          :props="control.props"
          clearable
          filterable
          @change="onSelectControl(control)"
          @expand-change="control.changeFunc"
        ></el-cascader>

        <!-- 单选框控件 type = 3 -->
        <el-radio-group
          :disabled="control.disabled"
          v-if="control.type === 3"
          v-model="formData[control.field]"
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
          v-model="formData[control.field]"
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
          v-model="formData[control.field]"
          :active-text="control.yesText"
          :inactive-text="control.noText"
        ></el-switch>

        <!-- 时间选择器 type = 6 -->
        <el-time-select
          :disabled="control.disabled"
          v-if="control.type === 6"
          v-model="formData[control.field]"
          :picker-options="control.pickerOptions"
          :placeholder="control.placeholder || '选择' + control.label"
        ></el-time-select>

        <!-- 日期选择器 type = 7 -->
        <el-date-picker
          :disabled="control.disabled"
          v-if="control.type === 7"
          v-model="formData[control.field]"
          type="date"
          :placeholder="control.placeholder || '选择' + control.label"
          value-format="yyyy-MM-dd"
        ></el-date-picker>

        <!-- 时期选择器 按周 type = 77 -->
        <el-date-picker
          :disabled="control.disabled"
          v-if="control.type === 77"
          v-model="formData[control.field]"
          type="week"
          format="yyyy 第 WW 周"
          value-format="yyyy-MM-dd"
          :placeholder="control.placeholder || '选择' + control.label"
        ></el-date-picker>

        <!-- 日期选择器 选择多个日期 type = 78 -->
        <el-date-picker
          :disabled="control.disabled"
          v-if="control.type === 78"
          v-model="formData[control.field]"
          type="dates"
          :placeholder="control.placeholder || '选择' + control.label"
          value-format="yyyy-MM-dd"
        ></el-date-picker>

        <!-- 上传控件 -->
        <upload-control
          v-if="control.type === 8"
          :control="control"
          v-model="formData[control.field]"
        ></upload-control>
      </el-form-item>
    </el-form>
  </div>
</template>
<script>
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";

import { quillEditor, Quill } from "vue-quill-editor";
import { ImageExtend, QuillWatch } from "quill-image-extend-module";
import { API_HOST, COMM_API_KEY } from "@/utils/api_configs";
import { getToken } from "@/utils/auth";
import { generateUUID } from "@/utils/ajax";
import md5 from "js-md5";

// Quill.register("modules/ImageExtend", ImageExtend);
if (!Quill.imports["modules/ImageExtend"]) {
  // Register only if not exists - 仅在不存在时注册
  Quill.register("modules/ImageExtend", ImageExtend);
}

export default {
  name: "comm-form",
  components: {
    // Editor
    quillEditor,
    uploadControl: resolve => {
      require(["@/components/CommForm/upload-control"], resolve);
    }
  },
  props: {
    controls: {
      type: Array,
      required: true
    },
    formData: {
      type: Object
    },
    hasRichEditor: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      editorOption: {
        placeholder: "请输入内容",

        // theme: "bubble",
        modules: {
          ImageExtend: {
            loading: true,
            name: "file",
            size: 2,
            action: API_HOST + "/assets",
            sizeError: () => {
              this.$message({
                type: "error",
                message: "图片太大，不能超过2MB"
              });
            },
            response: res => {
              // console.log(res);
              return res.data.url;
            },
            change: (xhr, formData) => {
              formData.append("token", getToken());
              var i = generateUUID();
              formData.append("i", i);
              formData.append("ak", md5(COMM_API_KEY + i));
            }
          },
          toolbar: {
            // container: container,
            container: [
              ["bold", "italic", "underline", "strike"], // toggled buttons
              ["blockquote", "code-block"],
              [{ header: 1 }, { header: 2 }], // custom button values
              [{ list: "ordered" }, { list: "bullet" }],
              // [{ script: "sub" }, { script: "super" }], // superscript/subscript
              [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
              [{ direction: "rtl" }], // text direction
              // [{ size: ["small", false, "large", "huge"] }], // custom dropdown
              // [{ header: [1, 2, 3, 4, 5, 6, false] }],

              [{ color: [] }, { background: [] }], // dropdown with defaults from theme
              // [{ font: [] }],
              [{ align: [] }],
              ["clean"],
              ["image"]
            ],
            handlers: {
              image: function() {
                QuillWatch.emit(this.quill.id);
              }
            }
          }
        }
      }
    };
  },
  // mounted() {
  //   console.log(this.formData);
  // },
  computed: {
    rules() {
      let temp = {};
      this.controls.forEach(control => {
        if (control.rules && control.rules.length > 0) {
          temp[control.field] = control.rules;
        }
      });
      return temp;
    }
    // formModel() {
    //   let obj = {};
    //   this.controls.forEach(control => {
    //     if (control.type === 4) {
    //       this.$set(obj, control.field, this.formData[control.field] || []);
    //     } else {
    //       this.$set(obj, control.field, this.formData[control.field]);
    //     }
    //   });
    //   return obj;
    // }
  },
  methods: {
    clearValidates() {
      // this.$refs.dataForm.clearValidates();
      this.$nextTick(() => {
        this.$refs.dataForm.clearValidate();
      });
    },
    validateFields(callback) {
      this.$refs.dataForm.validate(callback);
    },
    onSelectControl(control) {
      // console.log(123);
      this.$emit("onSelectControl", control);
      if (control.changeFunc) {
        control.changeFunc(control, this.formData[control.field]);
      }
    },
    onEditorBlur(control) {
      // console.log("blur");
      this.$refs["dataForm"].validateField(control.field, () => {
        // console.log(valid);
      });
    }
  }
};
</script>
<style lang="scss">
.ql-editor {
  height: 350px !important;
}
</style>
<style lang="scss" scoped>
.form-wrapper {
  // margin: 60px 0 30px;
  width: 100%;
  .el-select,
  .el-date-editor,
  .el-cascader {
    width: 100%;
  }
}

.ql-editor.ql-blank,
.ql-editor {
  height: 600px !important;
}

.ql-formats .ql-video {
  display: none !important;
}

.ql-snow .ql-tooltip[data-mode="link"]::before {
  content: "请输入链接地址:";
}
.ql-snow .ql-tooltip.ql-editing a.ql-action::after {
  border-right: 0px;
  content: "保存";
  padding-right: 0px;
}

.ql-snow .ql-tooltip[data-mode="video"]::before {
  content: "请输入视频地址:";
}

.ql-snow .ql-picker.ql-size .ql-picker-label::before,
.ql-snow .ql-picker.ql-size .ql-picker-item::before {
  content: "14px";
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value="small"]::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value="small"]::before {
  content: "10px";
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value="large"]::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value="large"]::before {
  content: "18px";
}
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value="huge"]::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value="huge"]::before {
  content: "32px";
}

.ql-snow .ql-picker.ql-header .ql-picker-label::before,
.ql-snow .ql-picker.ql-header .ql-picker-item::before {
  content: "文本";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="1"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="1"]::before {
  content: "标题1";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="2"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="2"]::before {
  content: "标题2";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="3"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="3"]::before {
  content: "标题3";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="4"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="4"]::before {
  content: "标题4";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="5"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="5"]::before {
  content: "标题5";
}
.ql-snow .ql-picker.ql-header .ql-picker-label[data-value="6"]::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value="6"]::before {
  content: "标题6";
}

.ql-snow .ql-picker.ql-font .ql-picker-label::before,
.ql-snow .ql-picker.ql-font .ql-picker-item::before {
  content: "标准字体";
}
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="serif"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="serif"]::before {
  content: "衬线字体";
}
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="monospace"]::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value="monospace"]::before {
  content: "等宽字体";
}
</style>


