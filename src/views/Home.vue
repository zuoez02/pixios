<template>
  <div class="home">
    <el-container>
      <el-aside class="aside" :width="sidebarWidth">
        <div>
          <h2 style="float: left" v-show="!collapsed">
            Pixios
          </h2>
          <span class="collapse-button" @click="collapsed = !collapsed">
            <i class="el-icon-d-arrow-left" v-if="!collapsed"></i>
            <i class="el-icon-d-arrow-right" v-else></i>
          </span>
        </div>
        <div class="side-bar-content" v-show="!collapsed" style="clear: both;">
          <side-bar-form v-model="form" @search="search"></side-bar-form>
          <div class="label" v-show="form.mode !== 'single'">
            <span>目录</span>
            <span v-if="loadingAllFiles"><i class="el-icon-loading"></i></span>
            <span v-else>(共{{ total }}张)</span>
          </div>
          <div
            class="folder"
            v-show="form.mode !== 'single'"
            v-for="(folder, $index) in folders"
            :key="$index"
          >
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
        </div>
      </el-aside>
      <el-container id="container" class="container">
        <grid-viewer
          :images="sortedFolders"
          :size="form.size"
          :mode="form.picMode"
          @drop-path="onDropPath"
        ></grid-viewer>
      </el-container>
    </el-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { Watch } from "vue-property-decorator";
import GridViewer from "@/components/grid-viewer.vue";
import SideBarForm from "@/components/side-bar-form.vue";
import { AsideForm, ImageItem } from "@/type";
import { FsService } from "@/services/fs-service";
import store from "@/store";

@Component({
  components: {
    GridViewer,
    SideBarForm
  }
})
export default class Home extends Vue {
  public form: AsideForm = {
    mode: "folders",
    picMode: "picture",
    size: "300",
    sort: "nameDesc",
    folder: "",
    days: 0
  };

  public folders: string[] = [];

  public filesMap: { [key: string]: ImageItem[] } = {};

  public fsService = new FsService();

  public selectedFolder = "";

  public collapsed = false;

  get sidebarWidth() {
    return this.collapsed ? "40px" : "400px";
  }

  get selectedImages() {
    return this.filesMap[this.selectedFolder] || [];
  }

  get sortedFolders() {
    return this.selectedImages.sort((a, b) => {
      switch (this.form.sort) {
        case "timeAsc":
          return a.cTime - b.cTime;
        case "timeDesc":
          return b.cTime - a.cTime;
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
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

  @Watch("form", { deep: true })
  public onFormChange(val: AsideForm) {
    const { mode, picMode, size, sort, days, folder } = val;
    store.set("mode", mode);
    store.set("picMode", picMode);
    store.set("size", size);
    store.set("sort", sort);
    store.set("days", days);
    store.set("folder", folder);
  }

  public created() {
    const mode = store.get("mode");
    const picMode = store.get("picMode");
    const size = store.get("size");
    const sort = store.get("sort");
    const days = store.get("days");
    const folder = store.get("folder");
    this.form = {
      mode,
      picMode,
      folder,
      size,
      sort,
      days
    } as AsideForm;
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
    if (this.form.days >= 0 && this.form.mode === "recent") {
      this.search();
    }
  }

  @Watch("mode")
  public async search() {
    this.clear();
    if (this.form.mode === "folders" || this.form.mode === "recent") {
      this.getProjects();
    } else if (this.form.mode === "single") {
      this.selectedFolder = "_";
      this.filesMap = {};
      await this.getFileList(this.selectedFolder);
    }
  }

  public mounted() {
    console.log(this.form.folder);
    if (!this.form.folder) {
      return;
    }
    this.search();
  }

  public async getProjects() {
    if (!this.form.folder) {
      return;
    }
    this.clear();
    const target = this.fsService.normalize(this.form.folder) as string;
    this.folders = await this.fsService.getProjects(target);
    if (this.form.mode === "folders" && !this.selectedFolder) {
      this.selectedFolder = this.folders[0] || "";
    }
    this.folders.forEach(f => this.getFileList(f));
  }

  public async getFileList(f = "") {
    let file: string;
    if (!f || f === "_") {
      file = this.form.folder;
    } else {
      file = this.fsService.resolve(this.form.folder, f);
    }
    const days = this.form.mode === "recent" ? this.form.days : 0;
    const recentFiles = await this.fsService.getFileList(file, days);
    if (this.form.mode === "recent") {
      if (!this.selectedFolder && recentFiles.length > 0) {
        this.selectedFolder = f;
      }
    }
    this.$set(this.filesMap, f, recentFiles);
    return recentFiles;
  }

  public async onChooseFolder(event: Event) {
    const files = (event.target as any).files as FileList;
    if (files.length > 0) {
      const first = files.item(0);
      const p = first?.path;
      if (p) {
        const stat = await this.fsService.getStat(p);
        if (stat.isDirectory()) {
          this.form.folder = this.fsService.resolve(p, "..");
        } else {
          this.form.folder = this.fsService.dirname(p);
        }
        this.getProjects();
        return;
      }
    }
    this.form.folder = "";
  }

  public onDropPath(path: string) {
    this.form.folder = path;
    this.search();
  }

  public clear() {
    this.filesMap = {};
    this.selectedFolder = "";
    this.folders = [];
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
  width: 400px;
  // z-index: 2;
  border-color: transparent;
  box-shadow: 1px 0px 12px 5px #191919;
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

.collapse-button {
  float: right;
  font-size: 24px;
  left: 12px;
  position: relative;
  cursor: pointer;
}
</style>
