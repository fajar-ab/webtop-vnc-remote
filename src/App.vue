<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import RemoteVnc from './components/RemoteVnc.vue';
import VncSidebar from './components/VncSidebar.vue';
import { defaultVncList } from './VncLists';

const STORAGE_KEY = 'vnc_remote_list';
const PIN_KEY = 'vnc_dashboard_pin';
const vncList = ref([]);
const vncRefs = ref([]);
const isLocked = ref(!!localStorage.getItem(PIN_KEY));
const unlockPin = ref('');
const unlockError = ref(false);

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
    }
}

// Keyboard Shortcuts
function handleGlobalKeys(e) {
  const key = e.key.toLowerCase();

  // Prevent shortcuts when typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }

  const num = parseInt(key);
  // Focus with 1-9
  if (num >= 1 && num <= 9 && num <= vncList.value.length) {
    handleClick(num - 1);
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeys);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeys);
});

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
          />
        </template>
      </div>

      <div v-if="vncList.length === 0" class="no-data">
        <h1>Welcome to VNC Remote</h1>
        <p>Click the gear icon (⚙) on the left to add your first VNC session.</p>
      </div>
    </div>
  </main>

  <div v-if="isLocked" class="lock-overlay">
    <div class="lock-card">
      <h2>🔒 Dashboard Locked</h2>
      <input type="password" v-model="unlockPin" placeholder="Enter PIN" @keyup.enter="handleUnlock">
      <button @click="handleUnlock">Unlock</button>
      <p v-if="unlockError" class="error">Incorrect PIN</p>
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
