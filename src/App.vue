<template>
  <div id="app">
    <Home />
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Home from "@/views/Home.vue";

export default Vue.extend({
  components: {
    Home
  }
});
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

body {
  background-color: white;
  padding: 0;
  margin: 0;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
