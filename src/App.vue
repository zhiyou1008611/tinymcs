<template>
  <div id="app">
    {{ msg }}
    <tinymce-editor v-model="msg" :disabled="disabled" @onClick="onClick" ref="editor"></tinymce-editor>

    <el-button type="primary" plain @click="clear">清空内容</el-button>
    <el-button type="primary" plain @click="disabled = !disabled">禁用</el-button>
    <!-- <router-view /> -->
  </div>
</template>


<script>
import TinymceEditor from "./pages/tinymcs-editor";

export default {
  name: "App",
  components: {
    TinymceEditor
  },
  data() {
    return {
      msg: "",
      disabled: false
    };
  },
  methods: {
    //鼠标单击的事件
    onClick(e, editor) {
      console.log("Element clicked");
      console.log(e);
      console.log(editor);
    },
    //清空内容
    clear() {
      this.$refs.editor.clear();
    }
  }
};
</script>


<style scoped>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
