<!--
    Create by Luto Yvan at 01:00:17 November 06, 2020
-->
<template>
  <div
    class="grid-viewer"
    @dragenter="onDragEnter"
    @dragover="onDragOver"
    @drop="onDrop"
    @dragleave="onDragLeave"
  >
    <div
      class="content pointer-events-none"
      :class="{
        'content-picture': mode === 'picture',
        'content-manga': mode === 'manga'
      }"
    >
      <el-image
        class="pic"
        :class="imgClasses"
        lazy
        fit="cover"
        :src="getPreviewSrc(item.path)"
        v-for="(item, $in) in images"
        :key="item.name"
        @click="showDetail($in)"
      >
      </el-image>
    </div>
    <image-viewer
      :z-index="99999"
      :initial-index="selectedItemIndex"
      v-if="showViewer && mode !== 'manga'"
      :on-close="closeViewer"
      :url-list="previewSrcList"
    />
    <div class="drop-hover" v-show="showDropHover">
      <h1 class="drop-hover-title">拖放文件夹设置根目录</h1>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import ImageViewer from "element-ui/packages/image/src/image-viewer.vue";

const delay = 200;
let timer: NodeJS.Timer | null = null;

interface ImageItem {
  path: string;
  cTime: number;
  name: string;
  src: string | null;
  loading: boolean;
}

@Component({
  components: {
    ImageViewer
  }
})
export default class GridViewer extends Vue {
  @Prop()
  public images!: ImageItem[];

  @Prop()
  public size!: string;

  @Prop({ required: false, default: "picture" })
  public mode!: "manga" | "picture";

  public selectedItemIndex = -1;

  public showViewer = false;

  public showDropHover = false;

  get imgClasses() {
    const result = ["size-" + this.size];
    if (this.showDropHover) {
      result.push("pointer-events-none");
    }
    return result;
  }

  get previewSrcList() {
    if (!this.images) {
      return [];
    }
    return this.getImgSrcs(this.images.map(v => v.path));
  }

  public showDetail(index: number) {
    this.selectedItemIndex = index;
    this.showViewer = true;
  }

  public closeViewer() {
    this.selectedItemIndex = -1;
    this.showViewer = false;
  }

  public getImgSrcs(fps: string[]) {
    return fps.map(v => this.getImgSrc(v, "file"));
  }

  public getImgSrc(fp: string, protocol = "file") {
    if (!fp) {
      return "";
    }
    if (fp.startsWith("/") || fp.startsWith("\\")) {
      return `${protocol}:///${fp.slice(2)}`;
    }
    return `${protocol}://${fp}`;
  }

  public getPreviewSrc(p: string) {
    if (this.mode === "picture") {
      return this.getImgSrc(p, "preview") + "_preview";
    } else {
      return this.getImgSrc(p, "file");
    }
  }

  public onDragEnter() {
    this.openHover();
  }

  public onDragOver(e: Event) {
    this.openHover();
    e.preventDefault();
  }

  public onDragLeave(e: DragEvent) {
    this.close(e);
  }

  public onDrop(e: DragEvent) {
    e.preventDefault();
    const d = e.dataTransfer?.files;
    if (d && d.length > 0) {
      this.$emit("drop-path", d[0].path);
    }
    this.close(e);
  }

  public openHover() {
    this.showDropHover = true;
    timer = setTimeout(() => {
      if (timer) {
        clearTimeout(timer);
      }
    }, delay);
  }

  public close(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    console.log(e.target);
    const from = e.target as HTMLElement | null;
    console.log(from, from?.tagName);
    if (from && from.tagName.toLowerCase() === "img") {
      return;
    }
    this.showDropHover = false;
  }
}
</script>
<style lang="less" scoped>
.grid-viewer {
  width: 100%;
  position: relative;
  height: fit-content;
  min-height: 100vh;
}

.pic {
  display: inline-block;
  cursor: pointer;
  object-fit: cover;
  margin-right: 8px;
  margin-bottom: 8px;
  border: 1px solid black;
  pointer-events: auto;
}

.pointer-events-none {
  pointer-events: none;
}

.content-picture {
  .size-100 {
    height: 100px;
    width: 100px;
  }

  .size-300 {
    height: 300px;
    width: 300px;
  }

  .size-500 {
    height: 500px;
    width: 500px;
  }

  .size-700 {
    height: 700px;
    width: 700px;
  }
}

.content.content-manga {
  text-align: center;
  .pic {
    margin: 20px auto;
    min-height: 200px;
    display: block;
  }

  .size-100 {
    width: 30%;
  }

  .size-300 {
    width: 50%;
  }

  .size-500 {
    width: 60%;
  }

  .size-700 {
    width: 80%;
  }
}

.drop-hover {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.drop-hover-title {
  width: 100%;
  text-align: center;
  color: white;
  font-size: 32px;
  margin: 40vh auto;
  pointer-events: none;
  position: sticky;
  top: 45vh;
}
</style>
