<script setup>
import { ref } from "vue";
import RemoteVnc from "./components/RemoteVnc.vue";
import RemoteVncLink from "./components/RemoteVncLink.vue";
import { vncList } from "./VncLists";

const activeIndex = ref(0);

function handleClick(n) {
  activeIndex.value = n;
}
</script>

<template>
  <div class="container">
    <RemoteVnc
      v-for="(item, index) in vncList"
      :key="index"
      :vncLink="item.vncLink"
      :index-link="index"
      :active-link="activeIndex"
    />
  </div>

  <div class="fixed-links">
    <RemoteVncLink
      v-for="(item, index) in vncList"
      :key="index"
      :index-link="index"
      :active-link="activeIndex"
      @click="handleClick(index)"
    />
  </div>
</template>

<style>
body {
  background-color: black;
  margin: 0;
}

.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  margin-bottom: 1000px;
}

.fixed-links {
  position: fixed;
  top: 55%;
  left: 800px;
  transform: translate(-50%, -50%);
  margin: 10px;

  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}
</style>
