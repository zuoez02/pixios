<template>
  <div class="home">
    <el-container>
      <el-aside class="aside" width="400px">
        <h2>LSP</h2>
        <div class="label">模式</div>
        <el-radio-group v-model="mode">
          <el-radio label="single">单独目录</el-radio>
          <el-radio label="recent">最近天数</el-radio>
        </el-radio-group>
        <div class="label">展示方式</div>
        <el-radio-group v-model="picMode">
          <el-radio label="picture">普通</el-radio>
          <el-radio label="manga">漫画</el-radio>
        </el-radio-group>
        <div class="label">大小</div>
        <el-select v-model="size" size="mini">
          <el-option label="小" value="100"></el-option>
          <el-option label="中" value="300"></el-option>
          <el-option label="大" value="500"></el-option>
          <el-option label="巨大" value="700"></el-option>
        </el-select>
        <div class="label">排序</div>
         <el-select v-model="sort" size="mini">
          <el-option label="时间升序" value="timeAsc"></el-option>
          <el-option label="时间降序" value="timeDesc"></el-option>
          <el-option label="文件名升序" value="nameAsc"></el-option>
          <el-option label="文件名降序" value="nameDesc"></el-option>
        </el-select>
        <div class="label">
          根目录
          <el-button @click="visibleStore = true" type="text" size="mini">选择</el-button>
          </div>
        <el-input
          size="small"
          type="text"
          v-model="folder"
          @keyup.enter="getProjects"
        >
          <el-button @click="getProjects" slot="append">
            <i class="el-icon-search"></i>
          </el-button>
        </el-input>
        <div v-if="mode === 'recent'">
          <div class="label">最近天数</div>
          <el-input
            size="small"
            type="number"
            v-model.number="days"
            @keyup.enter.native="changeDays"
          >
            <el-button
              slot="append"
              icon="el-icon-search"
              @click="changeDays"
            ></el-button>
          </el-input>
        </div>

        <div class="label">
          <span>目录</span>
          <span v-if="loadingAllFiles"><i class="el-icon-loading"></i></span>
          <span v-else>(共{{ total }}张)</span>
        </div>
        <div class="folder" v-for="(folder, $index) in folders" :key="$index">
          <div
            class="folder-name"
            :class="{ 'selected-folder-name': selectedFolder === folder }"
            @click="selectedFolder = folder"
            v-show="filesMap[folder] && filesMap[folder].length > 0"
          >
            <span>{{ folder }}</span>
            <span v-if="filesMap[folder] && filesMap[folder].length"
              >({{ filesMap[folder].length }})</span
            >
          </div>
        </div>
      </el-aside>
      <el-container id="container" class="container">
        <grid-viewer :images="selectedImages" :size="size" :mode="picMode"></grid-viewer>
      </el-container>
    </el-container>
    
    <store
      :visible="visibleStore"
      @apply="applyFolder"
      @close="visibleStore = false"
    ></store>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src
import { Stats } from "fs";
import { Watch } from "vue-property-decorator";
import { ElImage } from "element-ui/types/image";
import Store from "./store.vue";
import GridViewer from '@/components/grid-viewer.vue';

const electron = window.require("electron");
const { remote } = electron;
const fs = remote.require("fs");
const path = remote.require("path");

interface ImageItem {
  path: string;
  cTime: number;
  name: string;
  src: string | null;
  loading: boolean;
}

@Component({
  components: {
    Store,
    GridViewer,
  }
})
export default class Home extends Vue {
  public $refs!: {
    image: any;
  };

  public visibleStore = false;

  public inputFiles = "";

  public mode: "single" | "recent" = "single";

  public picMode: 'picture' | 'manga' = 'picture';

  public folder = "";

  public folders: string[] = [];

  public filesMap: { [key: string]: ImageItem[] } = {};

  public selectedFolder = "";

  public days = 7;

  public size = "300";

  public sort = 'nameDesc';

  get selectedImages() {
    return this.filesMap[this.selectedFolder] || [];
  }

  get sortedFolders() {
    return this.selectedImages.sort((a, b) => {
      switch (this.sort) {
        case 'timeAsc': return a.cTime - b.cTime;
        case 'timeDesc': return b.cTime - a.cTime;
        case 'nameAsc': return a.name.localeCompare(b.name);
        case 'nameDesc': return b.name.localeCompare(a.name);
        default: return 0;
      }
    })
  }

  get total() {
    if (this.loadingAllFiles) {
      return "...";
    }
    return Object.keys(this.filesMap).reduce((total, key) => {
      return total + this.filesMap[key].length;
    }, 0);
  }

  get loadingAllFiles() {
    return Object.keys(this.filesMap).length !== this.folders.length;
  }
 

  public scrollTop() {
    const c = document.querySelector("#container");
    if (c) {
      c.scrollTop = 0;
    }
  }

  @Watch("selectedFolder")
  public onSelectedChange() {
    this.scrollTop();
    if (this.selectedFolder) {
      this.getFileList(this.selectedFolder);
    }
  }

  public changeDays() {
    if (this.days >= 0 && this.mode === "recent") {
      this.getProjects();
    }
  }

  @Watch("mode")
  public onModeChange() {
    if (this.mode === "single") {
      this.getProjects();
    }
  }

  public mounted() {
    if (this.folder) {
      this.getProjects();
    }
  }

  public getProjects() {
    if (!this.folder) {
      return;
    }
    this.filesMap = {};
    this.selectedFolder = "";
    this.folders = [];
    const target = path.normalize(this.folder);
    fs.readdir(target, async (v: Error | null, list: string[]) => {
      const folders = list
        .filter(v => !v.startsWith("."))
        .sort((a, b) => a.localeCompare(b));
      for (const f of folders) {
        const stat = await this.getStat(path.resolve(this.folder, f));
        if (stat.isDirectory()) {
          this.folders.push(f);
        }
      }
      if (this.mode === "single" && !this.selectedFolder) {
        this.selectedFolder = folders[0] || "";
      }
      this.folders.forEach(f => this.getFileList(f));
    });
  }

  public getFileList(f: string) {
    fs.readdir(
      path.resolve(this.folder, f),
      async (err: Error | null, files: string[]) => {
        if (err) {
          console.error(err);
          return;
        }
        const recentFiles: Array<ImageItem> = [];
        const today = new Date().getTime();
        const minus = this.days * 24 * 60 * 60 * 1000;
        const types = ["png", "jpg"];
        for (const v of files) {
          if (types.every(t => !v.endsWith(t))) {
            continue;
          }
          const fp = path.resolve(this.folder, f, v);
          try {
            const stat = await this.getStat(fp);
            const time = stat.ctime;
            if (
              stat.isFile() &&
              (this.mode === "single" || stat.ctime.getTime() > today - minus)
            ) {
              recentFiles.push({
                path: fp,
                name: v,
                cTime: time.getTime(),
                loading: true,
                src: null
              });
            }
          } catch (e) {
            console.error(e);
          }
        }
        if (this.mode === "recent") {
          if (!this.selectedFolder && recentFiles.length > 0) {
            this.selectedFolder = f;
          }
        }
        this.$set(this.filesMap, f, recentFiles);
      }
    );
  }

  public async getStat(filePath: string): Promise<Stats> {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (err: Error | null, stat: Stats) => {
        if (err !== null) {
          reject(err);
          return;
        }
        resolve(stat);
      });
    });
  }

  

  public onChooseFolder(event: any) {
    const files = event.target.files as FileList;
    if (files.length > 0) {
      const first = files.item(0);
      const p = first?.path;
      if (p) {
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          this.folder = path.resolve(p, "..");
        } else {
          this.folder = path.dirname(p);
        }
        this.getProjects();
        return;
      }
    }
    this.folder = "";
  }

  public applyFolder(folder: string) {
    this.folder = folder;
    this.getProjects();
  }
}
</script>
<style lang="less">
// ::-webkit-scrollbar {
//   height: 12px;
//   width: 12px;
//   // background: rgb(121, 121, 121);
// }

.container {
  background-color: #202124;
  height: 100vh;
  overflow-y: auto;
}
.label {
  margin-top: 12px;
  margin-bottom: 8px;
  font-weight: bold;
}

.content {
  padding: 20px;
}

.aside {
  background-color: #3700b3;
  color: white;
  height: 100vh;
  overflow-y: scroll;
  padding: 8px 20px;
}

.aside::-webkit-scrollbar {
  width: 0 !important;
}

.folder-name {
  font-weight: bold;
  font-size: 14px;
  margin: 8px 0;
  padding: 4px;
  cursor: pointer;
  word-break: break-all;

  &:hover {
    text-decoration: underline;
  }
}

.selected-folder-name {
  background-color: #0088cc;
  border: 1px solid transparent;
  color: white;
  border-radius: 4px;
  font-size: 14px;
}
</style>