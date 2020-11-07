<!--
    Create by Luto Yvan at 23:02:36 November 04, 2020
-->
<template>
<div class="lsp-image" v-loading="loading"></div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

@Component
export default class LspImage extends Vue {
    @Prop({ required: true, type: String })
    public path!: string;

    @Prop({ required: true, type: Array })
    public list!: string[];

    public loading = true;

    public mounted() {
        const img = new Image();
        img.src = this.path;
        img.decode().then(() => {
            this.$el.appendChild(img);
            this.loading = false;
        });
    }
}
</script>