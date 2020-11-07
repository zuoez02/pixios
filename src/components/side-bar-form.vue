<!--
    Create by Luto Yvan at 13:44:56 November 07, 2020
-->
<template>
  <div class="side-bar-form">
    <div class="label">模式</div>
    <el-radio-group v-model="form.mode">
      <el-radio label="single">单独目录</el-radio>
      <el-radio label="recent">最近天数</el-radio>
    </el-radio-group>
    <div class="label">展示方式</div>
    <el-radio-group v-model="form.picMode">
      <el-radio label="picture">普通</el-radio>
      <el-radio label="manga">漫画</el-radio>
    </el-radio-group>
    <div class="label">大小</div>
    <el-select v-model="form.size" size="mini">
      <el-option label="小" value="100"></el-option>
      <el-option label="中" value="300"></el-option>
      <el-option label="大" value="500"></el-option>
      <el-option label="巨大" value="700"></el-option>
    </el-select>
    <div class="label">排序</div>
    <el-select v-model="form.sort" size="mini">
      <el-option label="时间升序" value="timeAsc"></el-option>
      <el-option label="时间降序" value="timeDesc"></el-option>
      <el-option label="文件名升序" value="nameAsc"></el-option>
      <el-option label="文件名降序" value="nameDesc"></el-option>
    </el-select>
    <div class="label">
      根目录
      <el-button @click="visibleStore = true" type="text" size="mini"
        >选择</el-button
      >
    </div>
    <el-input
      size="small"
      type="text"
      v-model="form.folder"
      @keyup.enter="getProjects"
    >
      <el-button @click="getProjects" slot="append">
        <i class="el-icon-search"></i>
      </el-button>
    </el-input>
    <div v-if="form.mode === 'recent'">
      <div class="label">最近天数</div>
      <el-input
        size="small"
        type="number"
        v-model.number="days"
        @keyup.enter.native="search"
      >
        <el-button
          slot="append"
          icon="el-icon-search"
          @click="search"
        ></el-button>
      </el-input>
    </div>
    <store
      :visible="visibleStore"
      @apply="applyFolder"
      @close="visibleStore = false"
    ></store>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Model } from "vue-property-decorator";
import { AsideForm } from "@/type";
import Store from "@/components/store.vue";

@Component({
  components: {
    Store
  }
})
export default class SideBarForm extends Vue {
  @Model("change")
  public form!: AsideForm;

  public visibleStore = false;

  public getProjects() {
    this.$emit("search");
  }

  public applyFolder(folder: string) {
    this.form.folder = folder;
    this.getProjects();
  }
}
</script>