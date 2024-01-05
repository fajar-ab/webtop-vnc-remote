<script setup>
import { ref, defineProps } from 'vue';

const props = defineProps(['indexLink', 'activeLink'])

</script>

<template>
    <a :href="`#iframe${indexLink}`" class="iframe-link" :class="{ active: indexLink === activeLink }" v-smooth-scroll>
        {{ indexLink + 1 }}
    </a>
</template>

<style scoped>
.iframe-link {
    background-color: #3498db;
    color: #fff;
    padding: 15px;
    text-decoration: none;
    text-align: center;
    border-radius: 5px;
    transition: background-color 0.3s ease;
}

.iframe-link:hover {
    background-color: #2980b9;
}

.iframe-link.active {
    background-color: #e74c3c;
}
</style>
