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
    background-color: #333;
    color: #fff;
    padding: 10px;
    min-width: 40px;
    text-decoration: none;
    text-align: center;
    border-radius: 4px;
    transition: all 0.3s ease;
    font-weight: bold;
    font-size: 0.9rem;
    border: 1px solid transparent;
}

.iframe-link:hover {
    background-color: #444;
    border-color: #3498db;
}

.iframe-link.active {
    background-color: #e74c3c;
    color: white;
    transform: scale(1.1);
}
</style>
