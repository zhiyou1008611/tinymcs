<template>
  <div id="publish" v-loading="loading" element-loading-text="加载中...">
    <!-- 写作 -->
    <div class="write">
      <!-- title -->
      <div class="title">
        <input type="text" placeholder="标题 (0-300个字符)" v-model.trim="title" />
        <div
          class="title_count"
          :class="{'error': (title.length > 300) && title.length > 0}"
        >{{title.length}} / 300</div>
      </div>
      <div class="tinymce-editor">
        <editor
          v-model="myValue"
          :init="init"
          :disabled="disabled"
          ref="myQuillEditor"
          @onClick="onClick"
          id="editor"
        ></editor>

        <el-dialog title="上传图片" :visible.sync="dialogVisible" width="50%">
          <div style="position: relative;">
            <el-upload
              action="https://jsonplaceholder.typicode.com/posts/"
              list-type="picture-card"
              :on-preview="handlePictureCardPreview"
              :on-remove="handleRemove"
              multiple
              ref="imageUpload"
              :on-success="insertImage"
            >
              <i class="el-icon-plus"></i>
            </el-upload>
            <el-dialog
              :visible.sync="dialogVisibleImg"
              v-for="(imgUrl, index) in dialogImageUrl"
              :key="index"
            >
              <img width="100%" :src="imgUrl" alt />
            </el-dialog>
          </div>
          <span slot="footer" class="dialog-footer">
            <el-button @click="dialogVisible = false">取 消</el-button>
            <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
          </span>
        </el-dialog>
      </div>
    </div>

    <!-- 编辑 -->
    <div class="edit">
      <div class="cover edit-cell">
        <div class="edit-label">封面</div>
        <div class="edit-input">
          <div class="select_radio">
            <el-radio-group v-model="cover_mode">
              <el-radio :label="1">单图</el-radio>
              <el-radio :label="3">三图</el-radio>
            </el-radio-group>
          </div>
          <!-- 单图 -->
          <div class="cover_images">
            <template>
              <div v-for="(item,index) in cover_mode" :key="index">
                <div class="cover_img" v-if="coverImages[index]" @click="selectPictureOpen(index)">
                  <img :src="coverImages[index]" />
                </div>
                <div class="cover_add" v-else @click="selectPictureOpen(index)">
                  <i class="el-icon-plus"></i>
                </div>
              </div>
            </template>
          </div>
          <!-- 提示 -->
          <div class="cover_tip">优质的封面有利于推荐，请使用清晰度较高的图片，避免使用GIF、带大量文字的图片。</div>
        </div>
      </div>
      <div class="label edit-cell">
        <div class="edit-label">类型</div>
        <div class="edit-input">
          <el-radio-group v-model="classid">
            <el-radio-button
              :label="item.id"
              v-for="item of classify_list"
              :key="item.id"
            >{{item.category_name}}</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </div>

    <!-- 按钮 -->
    <div class="control">
      <!-- 新建 -->
      <template>
        <el-button
          class="publish_btn"
          type="primary"
          size="large"
          @click.stop="verify('article')"
        >发表</el-button>
        <el-button
          class="cancle_btn gray"
          type="primary"
          size="large"
          @click.stop.native="$router.go(-1)"
        >取消</el-button>
      </template>
    </div>
    <!-- 自定义上传图片 -->
    <upload-picture
      v-if="uploadPictureVisible"
      @complete="inserPicture"
      @close="uploadPictureVisible = false"
    ></upload-picture>
    <!-- 自定义上传封面 -->
    <upload-picture
      v-if="uploadcoverVisible"
      @complete="uploadcover"
      @close="uploadcoverVisible = false"
    ></upload-picture>
    <!-- 选择封面图 -->
    <select-picture
      v-if="selectPictureVisible"
      :json="contentImages"
      @complete="inserCover"
      @close="selectPictureVisible = false"
    ></select-picture>
  </div>
</template>

<script>
import tinymce from "tinymce/tinymce";
import Editor from "@tinymce/tinymce-vue";
import "tinymce/themes/silver/theme";
import "tinymce/plugins/image";
import "tinymce/plugins/media";
import "tinymce/plugins/table";
import "tinymce/plugins/lists";
import "tinymce/plugins/contextmenu";
import "tinymce/plugins/wordcount";
import "tinymce/plugins/colorpicker";
import "tinymce/plugins/textcolor";
import "tinymce/plugins/imagetools";

import "tinymce/plugins/advlist";
import "tinymce/plugins/paste";
import "tinymce/plugins/preview";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/code";

import Vue from "vue";
import VueQuillEditor from "vue-quill-editor";
import Quill from "quill";
Vue.use(VueQuillEditor);

import uploadPicture from "@/components/uploadPicture";
import selectPicture from "@/components/selectPicture";

export default {
  name: "TinymceEditor",
  components: {
    uploadPicture,
    selectPicture,
    Editor
  },
  props: {
    //传入一个value，使组件支持v-model绑定
    value: {
      type: String,
      default: ""
    },
    disabled: {
      type: Boolean,
      default: false
    },
    plugins: {
      type: [String, Array],
      default:
        "lists image media table textcolor wordcount contextmenu code preview fullscreen"
    },
    toolbar: {
      type: [String, Array],
      default:
        "code undo redo | formatselect |fontsizeselect| bold italic forecolor backcolor underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | lists image media table | imageUpload editimage imageoptions removeformat quicklink blockquote preview fullscreen"
    }
  },
  data() {
    return {
      conUrl: false, //是否引用文章链接
      json: null, // 修改的文章数据
      title: "", // 标题
      contentUrl: "", //文章链接
      // content: "", // 正文
      cover_mode: 1, // 封面模式：单图 / 三图
      contentImages: [], // 封面选择的正文图片
      clickIndex: "",
      selectImages: [], // 选择图片
      coverImages: [], // 封面图片
      classid: "", // 标签
      uploadPictureVisible: false, // 自定义图片上传dialog的toggle
      selectPictureVisible: false, // 选择封面图dialog的toggle
      uploadcoverVisible: false, //上传封面图片
      loading: false,
      classify_list: [], //分类列表

      dialogVisibleImg: false,
      dialogVisible: false, //弹框隐藏
      dialogImageUrl: [],

      myValue: this.value, // 正文
      //初始化配置
      init: {
        language_url: "/static/tinymce/langs/zh_CN.js",
        language: "zh_CN",
        skin_url: "/static/tinymce/skins/ui/oxide",
        content_css: "/static/tinymce/skins/content/default/content.css",
        height: 300,
        plugins: this.plugins,
        toolbar: this.toolbar,
        branding: false,
        menubar: false,

        /**
         * 下面方法是为tinymce添加自定义插入图片按钮
         * 借助iview的Upload组件,将图片先上传到存储云上，再将图片的存储地址放入编辑器内容
         */
        setup: editor => {
          const that = this;
          editor.ui.registry.addButton("imageUpload", {
            tooltip: "上传本地图片",
            icon: "image",
            onAction: () => {
              const upload = that.$refs.imageUpload;
              this.dialogVisible = true;
              // upload.handleClick();
            }
          });
        },
        //此处为图片上传处理函数，这个直接用了base64的图片形式上传图片，
        //如需ajax上传可参考https://www.tiny.cloud/docs/configure/file-image-upload/#images_upload_handler
        images_upload_handler: (blobInfo, success, failure) => {
          const img = "data:image/jpeg;base64," + blobInfo.base64();
          success(img);
        }
      }
    };
  },
  mounted() {
    tinymce.init({});
    this.editor;
  },
  computed: {
    editor() {
      const editor = new Quill("#editor");
      console.log(editor);
      return editor;
    }
  },
  methods: {
    handleRemove(file, fileList) {
      console.log(file, fileList);
    },
    handlePictureCardPreview(file) {
      this.dialogImageUrl.push(file.url);
      console.log(this.dialogImageUrl);
      this.dialogVisibleImg = true;
    },
    // 插入图片至编辑器
    insertImage(res, file) {
      console.log(res, file);
      const src = file.url; // 图片存储地址
      tinymce.execCommand("mceInsertContent", false, `<img src=${src}>`);
    },
    //添加相关的事件，可用的事件参照文档=> https://github.com/tinymce/tinymce-vue => All available events
    //需要什么事件可以自己增加
    onClick(e) {
      this.$emit("onClick", e, tinymce);
    },
    //可以添加一些自己的自定义事件，如清空内容
    clear() {
      this.myValue = "";
    },
    //类别列表
    getCategoryList() {
      axios.get("").then(res => {
        console.log(res.data.data);
        this.classify_list = res.data.data;
        this.classid = res.data.data[0].id;
      });
    },
    // 打开图片选择框
    selectPictureOpen(index) {
      console.log("this.editor", this.editor);
      console.log(this.conUrl);
      this.clickIndex = index;
      if (this.conUrl) {
        this.uploadcoverVisible = true;
      } else {
        let allImg = [];
        this.editor.container.querySelectorAll("img").forEach(item => {
          allImg.push(item.src);
        });
        this.contentImages = allImg;
        this.selectPictureVisible = true;
      }
    },
    // 添加封面图
    uploadcover(files) {
      files.map((item, index) => {
        this.coverImages[this.clickIndex] = item;
      });
    },
    // 插入封面图
    inserCover(val) {
      if (val) {
        console.log(val);
        this.coverImages[this.clickIndex] = val;
      }
    },
    // 所有规则
    allRule() {
      if (!this.title) {
        this.$message.error("标题不能为空");
      } else if (this.title.length > 300) {
        this.$message.error("标题长度不能超过300个字");
      } else {
        if (!this.conUrl) {
          if (!this.myValue) {
            this.$message.error("正文不能为空");
          } else if (
            this.cover_mode === 3 &&
            this.coverImages.length < 3 &&
            this.coverImages.length > 0
          ) {
            this.$message.error("封面图片不能少于3张");
          } else if (!this.classid) {
            this.$message.error("标签不能为空");
          } else {
            return true;
          }
        } else {
          if (!this.contentUrl) {
            console.log(this.contentUrl);
            this.$message.error("请添加链接");
          } else {
            return true;
          }
        }
      }
    },
    verify(type) {
      let flag = false;
      if (type == "article") {
        flag = this.allRule();
      }
      if (!flag) return;
      let article_id = this.$route.query.article_id;
      let coverImages = "";
      for (let i = 0; i < this.$data.coverImages.length; i++) {
        if (i > 0) {
          coverImages += ";";
        }
        coverImages += this.$data.coverImages[i];
      }
      let params = {
        title: this.$data.title,
        categoryId: this.$data.classid,
        titleImage: coverImages
      };
      if (this.conUrl) {
        params.url = this.$data.contentUrl;
      } else {
        params.content = this.$data.myValue || "";
      }
      console.log(params);
      axios
        .post("", params)
        .then(res => {
          console.log(res);
          if (article_id) Message.success("修改文章成功");
          else Message.success("创建文章成功");
          // this.$router.push({ path: "article" });
        })
        .catch(data => {
          console.log(data.msg);
        });
    }
  },
  watch: {
    value(newValue) {
      this.myValue = newValue;
    },
    myValue(newValue) {
      this.$emit("input", newValue);
    }
  }
};
</script>
<style lang='less'>
.font-weight {
  font-size: 20px;
  font-weight: 800;
  vertical-align: middle;
  display: inline-block;
}
#publish {
  padding: 20px 24px;
  min-height: inherit;
  .recovery {
    background: rgba(254, 133, 0, 0.95);
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;
    animation: slideDown 5s ease;
    height: 0px;
    line-height: 40px;
    padding: 0 15px;
    overflow: hidden;
    .cancle {
      color: #4d7dd2;
      margin-left: 8px;
    }
  }
  .write {
    position: relative;
    border: 1px solid #e9e9e9;
    margin-bottom: 50px;
    .title {
      position: relative;
      width: 100%;
      height: 58px;
      line-height: 58px;
      input {
        width: 100%;
        height: 100%;
        border: none;
        outline: none;
        color: #595959;
        font-size: 20px;
        padding-left: 20px;
        padding-right: 80px;
        font-weight: 700;
        box-sizing: border-box;
      }
      .title_count {
        position: absolute;
        width: 80px;
        height: 100%;
        top: 0;
        right: 0;
        color: #999;
        font-size: 14px;
        padding: 0 10px;
        text-align: right;
        &.error {
          color: #ff4949;
        }
      }
    }
  }
  .edit {
    margin-bottom: 40px;
    .edit-cell {
      width: 100%;
      margin-bottom: 30px;
    }
    .edit-label {
      float: left;
      width: 122px;
      font-size: 16px;
    }
    .edit-input {
      margin-left: 122px;
      font-size: 14px;
      color: #999;
    }
    .el-radio {
      color: #999;
    }
    .el-radio__label {
      padding-left: 10px;
    }
    .cover {
      .select_radio {
        margin-bottom: 16px;
      }
      .cover_images {
        .cover_add,
        .cover_img {
          position: relative;
          width: 150px;
          height: 105px;
          margin-right: 20px;
          display: inline-block;
          cursor: pointer;
          border-radius: 4px;
          overflow: hidden;
          img {
            width: 100%;
            min-height: 105px;
          }
        }
        .cover_add {
          position: relative;
          width: 150px;
          height: 105px;
          margin-right: 20px;
          display: inline-block;
          cursor: pointer;
          border-radius: 4px;
          overflow: hidden;
          background-color: #f0f1f3;
          i {
            position: absolute;
            left: 50%;
            top: 50%;
            font-size: 20px;
            margin-left: -0.5em;
            margin-top: -0.5em;
          }
        }
      }
      .cover_tip {
        padding-top: 10px;
      }
    }
  }
  .control {
    padding-left: 122px;
    margin-bottom: 50px;
    button {
      font-size: 16px;
      width: 140px;
      line-height: 1;
    }
    .gray {
      background-color: #f1f1f1;
      color: #a4a4a4;
      border-color: #f1f1f1;
      &:hover {
        background-color: #e4e4e4;
        color: #989898;
        border-color: #e4e4e4;
      }
    }
  }
  .pictrue {
    .el-dialog.el-dialog--small {
      min-height: 580px;
      max-height: 580px;
      .el-dialog__header {
        padding: 0;
        .el-dialog__headerbtn {
          float: none;
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 1;
        }
      }
      /*.el-dialog__body{
          padding: 0;
          min-height: min_dialogBodyHeight;
          max-height: max_dialogBodyHeight
          margin-bottom: marginBottom;
          .el-tabs{
            min-height: min_dialogBodyHeight;
            max-height: max_dialogBodyHeight;
            .el-tabs__header{
              padding: 0 12px;
              .el-tabs__item{
                height: tabHeaderHeight;
                line-height: tabHeaderHeight;
                font-size: 16px;
              }
            }
            .el-tabs__content{
              min-height: min_dialogBodyHeight - tabHeaderHeight;
              max-height: max_dialogBodyHeight - tabHeaderHeight;
              overflow: auto;
            }
          }
        }*/
    }
    .upload {
      width: 100%;
      padding: 20px 15px 0;
      .el-upload-list__item-thumbnail {
        width: auto;
        height: auto;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        max-width: 100%;
        max-height: 100%;
        margin: auto;
        user-select: none;
      }
    }
    .select {
      min-height: inherit;
      max-height: inherit;
      .imgInput {
        padding: 20px;
      }
      .imgWrapper {
        width: 100%;
        /*height: imgWrapperHeight;*/
        padding: 0 15px;
        overflow: auto;
      }
    }
  }
  .picture_preview {
    .el-dialog__body {
      min-height: 0;
    }
  }
  .picture_select {
    .el-dialog__body {
      padding: 20px 10px;
    }
  }
  .img-list {
    .img-item {
      width: 150px;
      height: 120px;
      position: relative;
      display: inline-block;
      border: 1px solid #e8e8e8;
      margin: 10px;
      cursor: pointer;
      label {
        width: 100%;
        height: 100%;
        &.is-active:before,
        &.is-checked:before {
          content: "";
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          background-color: rgba(0, 0, 0, 0.5);
          background-position: 100% 0;
          background-repeat: no-repeat;
          text-align: center;
          color: #fffacd;
        }
        &.is-active:after,
        &.is-checked:after {
          content: "已选择";
          /*content: attr(data-sort);*/
          display: block;
          position: absolute;
          top: 50%;
          left: 50%;
          -moz-transform: translate(-50%, -50%);
          -ms-transform: translate(-50%, -50%);
          transform: translate(-50%, -50%);
          -webkit-transform: translate(-50%, -50%);
          z-index: 2;
          font-size: 16px;
          color: #fffacd;
        }
      }
      span {
        width: 100%;
        height: 100%;
        padding: 0;
        border: none;
        background-color: #fff;
      }
      img {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        max-width: 100%;
        max-height: 100%;
        margin: auto;
        user-select: none;
      }
    }
  }
}
#publish {
  .cancle_btn {
    background-color: #f1f1f1;
    color: #a4a4a4;
    border-color: #f1f1f1;
  }
  .cancle_btn:hover {
    background-color: #e4e4e4;
    color: #989898;
    border-color: #e4e4e4;
  }
  .el-dialog.el-dialog--small {
    min-height: 400px;
    margin: 0;
    .el-dialog__title {
      font-weight: 400;
    }
    .el-dialog__body {
      min-height: 320px;
      margin-bottom: 80px;
      overflow-y: auto;
    }
    .el-dialog__footer {
      position: absolute;
      width: 100%;
      bottom: 10px;
      text-align: center;
    }
  }
  .el-dialog.el-dialog--tiny {
    .el-dialog__body {
      max-height: 250px;
      margin-bottom: 0;
    }
  }
}
</style>

