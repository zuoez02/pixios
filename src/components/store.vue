<!--
    Create by Luto Yvan at 00:24:58 November 06, 2020
-->
<template>
  <el-dialog
    :visible="visible"
    title="Store"
    :before-close="beforeClose"
    show-close
  >
    <div class="rows">
      <div class="item-row" v-for="(item, $i) in items" :key="$i">
        <el-input
          v-model="items[$i]"
          style="width: calc(100% - 250px); margin-right: 12px"
        ></el-input>
        <el-button @click="apply(items[$i])" type="success">应用</el-button>
        <el-button @click="deleteItem($i)" type="danger">删除</el-button>
      </div>
    </div>
    <div slot="footer">
      <el-button @click="add">添加</el-button>
      <el-button @click="save" type="primary">保存</el-button>
    </div>
  </el-dialog>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import store from "@/store";

@Component
export default class Store extends Vue {
  @Prop()
  public visible!: boolean;

  public items: string[] = [];

  public created() {
    this.items = store.get("folders");
  }

  public apply(item: string) {
    this.$emit("apply", item);
  }

  public save() {
    store.set("folders", this.items);
    this.$emit("close");
    return;
  }

  public add() {
    this.items.push("");
  }

  public deleteItem(i: number) {
    this.items.splice(i, 1);
  }

  public beforeClose(done: any) {
    this.save();
    this.$emit("close");
    done();
  }
}
</script>
<style scoped>
.item-row {
  margin-bottom: 8px;
  text-align: center;
}
.rows {
  max-height: 400px;
  overflow-y: auto;
}
</style>
