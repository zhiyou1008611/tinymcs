<template>
  <el-dialog class="selectPicture" title="正文图片" :visible.sync="visible">
    <div class="nothing" v-if="json && !(json.length > 0)">
      <img src />
      <p>还没有图片~</p>
    </div>
    <el-radio-group v-model="selected" class="img-list">
      <div class="img-item" v-for="(item,index) in json" :key="index" @click="checkitem(item)">
        <el-radio-button :label="item">
          <img :src="item" />
        </el-radio-button>
      </div>
    </el-radio-group>
    <div slot="footer">
      <el-button class="cancle_btn" @click.stop="cancle">取 消</el-button>
      <el-button type="primary" @click="complete">确 定</el-button>
    </div>
  </el-dialog>
</template>
<script>
export default {
  name: "selectPicture",
  props: {
    json: Array
  },
  data() {
    return {
      visible: true,
      selected: null
    };
  },
  watch: {
    visible(val) {
      if (!val) {
        this.$emit("close", false);
      }
    }
  },
  methods: {
    complete() {
      // debugger
      this.$emit("complete", this.selected);
      this.visible = false;
    },
    cancle() {
      this.visible = false;
    }
  }
};
</script>
<style lang='less' scoped>
.selectPicture {
  .el-dialog {
    min-height: 500px;
    max-height: 500px;
    .el-dialog__header {
      padding: 20px 20px 0;
      .el-dialog__title {
        font-size: 16px;
      }
    }
    .el-dialog__body {
      padding: 20px 10px;
      min-height: 376px;
      max-height: 376px;
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
  .nothing {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate3d(-50%, -50%, 0);
    z-index: 1;
    text-align: center;
    p {
      font-size: 14px;
      color: #999;
      margin-top: 5px;
    }
  }
}
</style>
