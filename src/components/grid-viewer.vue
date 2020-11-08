<!--
    Create by Luto Yvan at 01:00:17 November 06, 2020
-->
<template>
  <div class="grid-viewer">
    <div
      class="content"
      :class="{
        'content-picture': mode === 'picture',
        'content-manga': mode === 'manga'
      }"
    >
      <el-image
        class="pic"
        :class="'size-' + size"
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
      v-if="showViewer"
      :on-close="closeViewer"
      :url-list="previewSrcList"
    />
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import ImageViewer from "element-ui/packages/image/src/image-viewer.vue";

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

  get previewSrcList() {
    if (!this.images) {
      return [];
    }
    return this.getImgSrcs(this.images.map(v => v.path));
  }

  public showDetail(index: number) {
    this.selectedItemIndex = index;
    console.log(index);
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
}
</script>
<style lang="less" scoped>
.grid-viewer {
  width: 100%;
}
.pic {
  display: inline-block;
  cursor: pointer;
  object-fit: cover;
  margin-right: 8px;
  margin-bottom: 8px;
  border: 1px solid black;
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
</style>
