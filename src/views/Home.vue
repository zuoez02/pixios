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
          <side-bar-form v-model="form" @search="getProjects"></side-bar-form>
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
        </div>
      </el-aside>
      <el-container id="container" class="container">
        <grid-viewer
          :images="sortedFolders"
          :size="form.size"
          :mode="form.picMode"
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

@Component({
  components: {
    GridViewer,
    SideBarForm
  }
})
export default class Home extends Vue {
  public form: AsideForm = {
    mode: "single",
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
      this.getProjects();
    }
  }

  @Watch("mode")
  public onModeChange() {
    if (this.form.mode === "single") {
      this.getProjects();
    }
  }

  public mounted() {
    if (this.form.folder) {
      this.getProjects();
    }
  }

  public async getProjects() {
    if (!this.form.folder) {
      return;
    }
    this.filesMap = {};
    this.selectedFolder = "";
    this.folders = [];
    const target = this.fsService.normalize(this.form.folder) as string;
    this.folders = await this.fsService.getProjects(target);
    if (this.form.mode === "single" && !this.selectedFolder) {
      this.selectedFolder = this.folders[0] || "";
    }
    this.folders.forEach(f => this.getFileList(f));
  }

  public async getFileList(f: string) {
    const file = this.fsService.resolve(this.form.folder, f);
    const days = this.form.mode === "recent" ? this.form.days : 0;
    const recentFiles = await this.fsService.getFileList(file, days);
    if (this.form.mode === "recent") {
      if (!this.selectedFolder && recentFiles.length > 0) {
        this.selectedFolder = f;
      }
    }
    this.$set(this.filesMap, f, recentFiles);
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
