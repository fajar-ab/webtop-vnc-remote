<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import RemoteVnc from './components/RemoteVnc.vue';
import VncSidebar from './components/VncSidebar.vue';
import { defaultVncList } from './VncLists';

const STORAGE_KEY = 'vnc_remote_list';
const PIN_KEY = 'vnc_dashboard_pin';
const activeIndex = ref(0)
const vncList = ref([]);
const vncRefs = ref([]);
const isLocked = ref(!!localStorage.getItem(PIN_KEY));
const unlockPin = ref('');
const unlockError = ref(false);

// Search State
const isSearching = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const searchIndex = ref(0);

// Load data with labeling and ID support
const savedList = localStorage.getItem(STORAGE_KEY);
const initialData = savedList ? JSON.parse(savedList) : defaultVncList;
vncList.value = initialData.map((item, i) => ({
  id: item.id || Date.now() + i,
  vncLink: item.vncLink,
  label: item.label || `Session #${i + 1}`
}));

function setPin(pin) {
  if (pin) {
    localStorage.setItem(PIN_KEY, pin);
    isLocked.value = true;
  } else {
    localStorage.removeItem(PIN_KEY);
    isLocked.value = false;
  }
}

function unlock(pin) {
  const savedPin = localStorage.getItem(PIN_KEY);
  if (pin === savedPin) {
    isLocked.value = false;
    return true;
  }
  return false;
}

function handleUnlock() {
  if (unlock(unlockPin.value)) {
    unlockPin.value = '';
    unlockError.value = false;
  } else {
    unlockError.value = true;
  }
}

// Search Logic
watch(searchQuery, (newVal) => {
  if (!newVal) {
    searchResults.value = [];
    searchIndex.value = 0;
    return;
  }
  const query = newVal.toLowerCase();
  searchResults.value = vncList.value
    .map((item, index) => ({ ...item, originalIndex: index }))
    .filter(item => item.label.toLowerCase().includes(query))
    .slice(0, 10);
  searchIndex.value = 0;
});

function toggleSearch() {
  isSearching.value = !isSearching.value;
  if (isSearching.value) {
    searchQuery.value = '';
    nextTick(() => {
      document.getElementById('global-search-input')?.focus();
    });
  }
}

function selectSearchResult(index) {
  const item = searchResults.value[index];
  if (item) {
    handleClick(item.originalIndex);
    isSearching.value = false;
  }
}

function addVnc({ vncLink, label }) {
  vncList.value.push({
    id: Date.now(),
    vncLink,
    label
  });
  saveToStorage();
}

function updateVnc({ index, vncLink, label }) {
  vncList.value[index] = {
    ...vncList.value[index],
    vncLink,
    label
  };
  saveToStorage();
}

function handleReorder({ from, to }) {
  const item = vncList.value.splice(from, 1)[0];
  vncList.value.splice(to, 0, item);
  saveToStorage();
}

function removeVnc(index) {
  if (confirm('Are you sure you want to delete this session?')) {
    vncList.value.splice(index, 1);
    saveToStorage();
  }
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vncList.value));
}

function handleClick(index) {
    const el = document.getElementById(`iframe${index}`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        activeIndex.value = index;
    }
}

// Keyboard Shortcuts
function handleGlobalKeys(e) {
  const key = e.key.toLowerCase();

  // Prevent shortcuts when typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    if (isSearching.value) {
      if (e.key === 'Escape') isSearching.value = false;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        searchIndex.value = (searchIndex.value + 1) % searchResults.value.length;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        searchIndex.value = (searchIndex.value - 1 + searchResults.value.length) % searchResults.value.length;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectSearchResult(searchIndex.value);
      }
    }
    return;
  }

  if (key === '/') {
    e.preventDefault();
    toggleSearch();
    return;
  }

  const num = parseInt(key);
  // Focus with 1-9
  if (num >= 1 && num <= 9 && num <= vncList.value.length) {
    handleClick(num - 1);
  }

  // Active session controls
  const activeComp = vncRefs.value[activeIndex.value];
  if (!activeComp) return;

  if (key === 'r') activeComp.reloadIframe();
  if (key === 'p') activeComp.togglePower();
  if (key === 't') activeComp.toggleUp();
}

let observer = null;
function setupObserver() {
  if (observer) observer.disconnect();
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeIndex.value = parseInt(entry.target.id.replace('iframe', ''));
      }
    });
  }, { threshold: 0.5 });
  vncList.value.forEach((_, i) => {
    const el = document.getElementById(`iframe${i}`);
    if (el) observer.observe(el);
  });
}

onMounted(() => {
  setupObserver();
  window.addEventListener('keydown', handleGlobalKeys);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeys);
});

watch(vncList, () => {
  nextTick(setupObserver);
}, { deep: true });

</script>


<template>
  <VncSidebar
    :modelValue="vncList"
    :isLocked="isLocked"
    @add="addVnc"
    @update="updateVnc"
    @remove="removeVnc"
    @reorder="handleReorder"
    @setPin="setPin"
    @unlock="unlock"
  />

  <main class="main-content" :class="{ 'blur-content': isLocked }">
    <div class="container">
      <div class="column" v-for="col in [0, 1, 2]" :key="col">
        <template v-for="(item, index) in vncList" :key="index">
          <RemoteVnc
            v-if="index % 3 === col"
            :ref="el => vncRefs[index] = el"
            :vncLink="item.vncLink"
            :label="item.label"
            :index-link="index"
            :active-link="activeIndex"
          />
        </template>
      </div>

      <div v-if="vncList.length === 0" class="no-data">
        <h1>Welcome to VNC Remote</h1>
        <p>Click the gear icon (⚙) on the left to add your first VNC session.</p>
      </div>
    </div>

    <div v-if="isLocked" class="lock-overlay">
      <div class="lock-card">
        <h2>🔒 Dashboard Locked</h2>
        <input type="password" v-model="unlockPin" placeholder="Enter PIN" @keyup.enter="handleUnlock">
        <button @click="handleUnlock">Unlock</button>
        <p v-if="unlockError" class="error">Incorrect PIN</p>
      </div>
    </div>
  </main>

  <div v-if="isSearching" class="search-overlay" @click.self="isSearching = false">
    <div class="search-modal">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          id="global-search-input"
          v-model="searchQuery"
          type="text"
          placeholder="Search sessions (ESC to close)..."
          autocomplete="off"
        >
      </div>
      <div class="search-results" v-if="searchResults.length > 0">
        <div
          v-for="(result, index) in searchResults"
          :key="result.id"
          class="search-item"
          :class="{ active: index === searchIndex }"
          @click="selectSearchResult(index)"
          @mouseenter="searchIndex = index"
        >
          <span class="item-label">{{ result.label }}</span>
          <span class="item-index">#{{ result.originalIndex + 1 }}</span>
        </div>
      </div>
      <div class="search-empty" v-else-if="searchQuery">
        No sessions matching "{{ searchQuery }}"
      </div>
    </div>
  </div>
</template>

<style>
:root {
  color-scheme: dark;
}

body {
  background-color: #0f0f0f;
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  padding-top: 15vh;
  z-index: 5000;
  backdrop-filter: blur(4px);
}

.search-modal {
  width: 500px;
  background: #1a1a1a;
  border-radius: 12px;
  border: 1px solid #333;
  box-shadow: 0 20px 50px rgba(0,0,0,0.8);
  overflow: hidden;
  height: fit-content;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #333;
  background: #222;
}

.search-icon {
  font-size: 1.2rem;
  margin-right: 15px;
  opacity: 0.5;
}

.search-input-wrapper input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.1rem;
  outline: none;
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.search-item {
  padding: 12px 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.search-item.active {
  background: #ff0055;
  color: #fff;
}

.search-item.active .item-index {
  color: rgba(255,255,255,0.7);
}

.item-label {
  font-weight: 500;
}

.item-index {
  font-size: 0.8rem;
  color: #666;
}

.search-empty {
  padding: 30px;
  text-align: center;
  color: #666;
}

.no-data {
  grid-column: 1 / -1;
  text-align: center;
  margin-top: 100px;
  color: #666;
}

.main-content {
  padding: 5px;
}

.container {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  width: fit-content;
  margin: 0 auto;
  padding: 10px;
}

.column {
  width: 900px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-content.blur-content {
  filter: blur(10px);
  pointer-events: none;
}

.lock-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
  backdrop-filter: blur(5px);
}

.lock-card {
  background: #1a1a1a;
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #333;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.lock-card h2 {
  margin-top: 0;
  color: #fff;
}

.lock-card input {
  display: block;
  width: 200px;
  margin: 20px auto;
  padding: 10px;
  background: #000;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  text-align: center;
}

.lock-card button {
  padding: 10px 30px;
  background: #ff0055;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.lock-card .error {
  color: #ff0055;
  margin-top: 10px;
  font-size: 0.9rem;
}
</style>
