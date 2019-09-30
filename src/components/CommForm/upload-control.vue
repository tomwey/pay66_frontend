<template>
  <div class="upload-wrapper">
    <el-upload
      class="upload-demo"
      :action="uploadAction"
      :on-preview="handlePreview"
      :before-remove="beforeRemove"
      :on-remove="handleRemove"
      multiple
      :before-upload="beforeUpload"
      :limit="limit"
      :accept="accept"
      :on-success="handleSuccess"
      :on-exceed="handleExceed"
      :file-list="fileList"
      :ref="'upload' + control.id"
      :data="uploadData"
    >
      <el-button size="small">选择文件</el-button>
      <div slot="tip" class="el-upload__tip">
        <span class="upload-tips" v-html="control.upload_tips || calcUploadTips"></span>
        <div class="tpl-wrap" v-if="control.tpl_files && control.tpl_files.length > 0">
          <a
            :href="file.url"
            target="_blank"
            v-for="file in control.tpl_files"
            :key="file.url"
          >{{file.name}}</a>
        </div>
      </div>
    </el-upload>
    <el-dialog title="图片预览" :visible.sync="dialogPreviewVisible" append-to-body>
      <img :src="previewImage" style="max-width: 100%" />
    </el-dialog>
  </div>
</template>

<script>
// import BMF from "browser-md5-file";
import { getToken } from "@/utils/auth";
import { API_HOST, COMM_API_KEY } from "@/utils/api_configs";
import { generateUUID } from "@/utils/ajax";
import md5 from "js-md5";

export default {
  name: "upload-control",
  props: {
    control: {
      type: Object,
      required: true
    },
    value: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      previewImage: null,
      dialogPreviewVisible: false,
      fileList: [],
      limit: this.control.limit || 1,
      leftCount: 0,
      uploadData: {},
      uploadAction: API_HOST + "/assets",
      accept:
        this.control.accept ||
        ".jpg,.png,.gif,.jpeg,.pdf,.docx,.doc,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.mp4,.mov",
      fileSize: this.control.fileSize || 10
    };
  },
  mounted() {
    // console.log(this.value);
    this.leftCount = 0;

    if (this.value && this.value != "0") {
      this.loadAnnexes();
    }

    this.uploadData = {
      token: getToken()
    };
  },
  watch: {
    value(newVal) {
      // console.log(newVal);
      if (!newVal || newVal == "0") {
        this.fileList = [];
      } else {
        this.loadAnnexes();
      }
    }
  },
  computed: {
    calcUploadTips() {
      return `${
        this.limit > 1 ? "可上传最多" + this.limit + "个附件<br>" : ""
      }附件格式为：${this.accept}，${
        this.limit > 1 ? "每个附件" : ""
      }大小不超过${this.fileSize}MB`;
    }
  },
  methods: {
    // changeFiles(file, fileList) {
    //   console.log(fileList);
    // },
    changeValues(id, isAdd) {
      // console.log(this.fileList);
      if (isAdd) {
        var temp = [];
        // console.log(this.value);
        if (this.value) {
          if (this.value == 0) {
            temp = [];
          } else {
            temp = this.value.split(",");
          }
        }

        temp.push(id);
        // this.value = temp.join(",");
        this.$emit("input", temp.join(","));
      } else {
        // console.log(this.value);
        if (this.value) {
          var temp = this.value.split(",");
          const index = temp.indexOf(id.toString());
          if (index !== -1) {
            temp.splice(index, 1);
          }
          // this.value = temp.join(",");
          // console.log(temp);

          this.$emit("input", temp.join(","));
        }
      }
    },
    handleSuccess(res, file, fileList) {
      this.leftCount--;
      // console.log(res);
      if (res.code == 0) {
        this.changeValues(res.data.id, true);
      }
    },
    loadAnnexes() {
      if (this.leftCount > 0) {
        return;
      }

      this.$get("assets/" + this.value, null, res => {
        // console.log(res);
        if (res.code == 0) {
          let arr = res.data;
          let temp = [];
          arr.forEach(file => {
            // console.log(file);
            let fileName = file.filename || "";
            temp.push({
              name: file.filename,
              url: file.url,
              id: file.id,
              status: "success",
              isimage:
                fileName.indexOf(".png") !== -1 ||
                fileName.indexOf(".gif") !== -1 ||
                fileName.indexOf(".jpg") !== -1 ||
                fileName.indexOf(".jpeg") !== -1 ||
                fileName.indexOf(".webp") !== -1
            });
          });
          // console.log(this.fileList);
          this.fileList = temp;
        }
      });
    },
    beforeUpload(file) {
      var i = generateUUID();
      this.$set(this.uploadData, "i", i);
      this.$set(this.uploadData, "ak", md5(COMM_API_KEY + i));

      // const fileSize = this.control.fileSize || 2;
      const isLt2M = file.size / 1024 / 1024 < this.fileSize;

      var index = file.name.lastIndexOf(".");
      //获取后缀
      var ext = file.name.substr(index + 1);
      const isRightFile = this.accept.indexOf(ext) !== -1;

      if (!isRightFile) {
        this.$message.error(`${this.control.label}只能是 ${this.accept} 格式!`);
      }

      if (!isLt2M) {
        this.$message.error(
          `${this.control.label}大小不能超过 ${this.fileSize}MB!`
        );
      }

      let yesOrNo = isLt2M && isRightFile;

      this.calcFileMD5(file);

      if (yesOrNo) {
        if (this.leftCount < 0) {
          this.leftCount = 0;
        }

        this.leftCount++;
      }

      return yesOrNo;
    },
    calcFileMD5(file) {
      // let bmf = new BMF();
      // bmf.md5(
      //   file,
      //   (err, md5) => {
      //     this.$set(this.uploadData, "file_md5", md5);
      //     // console.log(this.control);
      //   },
      //   progress => {
      //     // console.log("progress number:", progress);
      //   }
      // );
    },
    handlePreview(file) {
      // console.log(file);
      if (file.isimage) {
        this.previewImage = file.url;
        this.dialogPreviewVisible = true;
      } else {
        if (file.response) {
          let data = file.response.data || {};
          if (data.content_type && data.content_type.indexOf("image/") !== -1) {
            this.previewImage = data.url;
            this.dialogPreviewVisible = true;
          } else {
            window.open(data.url);
          }
        } else {
          window.open(file.url);
        }
      }
    },
    beforeRemove(file, fileList) {
      return true;
    },
    handleRemove(file, fileList) {
      this.changeValues(file.id, false);
    },
    handleExceed(files, fileList) {
      const limit = this.control.limit || 1;
      this.$message.warning(`${this.control.label}最多只能上传${limit}个文件`);
      return false;
    }
  }
};
</script>
<style lang="scss" scoped>
.tpl-wrap {
  a {
    color: #e46623;
    font-size: 14px;
    text-decoration: underline;
    display: block;
    line-height: 14px;
    padding: 10px 0;
  }
}

.el-upload__tip {
  line-height: 14px;
  .upload-tips {
    display: inline-block;
    width: 100%;
    word-break: break-word;
  }
}
</style>


