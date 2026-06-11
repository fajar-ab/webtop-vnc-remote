<script setup>
import { ref } from 'vue';

const props = defineProps(['modelValue', 'isLocked']);
const emit = defineEmits(['update:modelValue', 'add', 'update', 'remove', 'reorder', 'setPin', 'unlock']);

const isOpen = ref(false);
const newUrl = ref('');
const newLabel = ref('');
const editingIndex = ref(null);
const dragIndex = ref(null);
const dropTargetIndex = ref(null);
const pinInput = ref('');

function toggleSidebar() {
    isOpen.value = !isOpen.value;
}

function handleAdd() {
    if (newUrl.value.trim()) {
        if (editingIndex.value !== null) {
            emit('update', {
                index: editingIndex.value,
                vncLink: newUrl.value.trim(),
                label: newLabel.value.trim()
            });
            editingIndex.value = null;
        } else {
            emit('add', {
                vncLink: newUrl.value.trim(),
                label: newLabel.value.trim() || `Session #${props.modelValue.length + 1}`
            });
        }
        newUrl.value = '';
        newLabel.value = '';
    }
}

function startEdit(index) {
    const item = props.modelValue[index];
    newUrl.value = item.vncLink;
    newLabel.value = item.label;
    editingIndex.value = index;
}

function cancelEdit() {
    editingIndex.value = null;
    newUrl.value = '';
    newLabel.value = '';
}

function handleSetPin() {
    emit('setPin', pinInput.value.trim());
    pinInput.value = '';
}

// Improved Drag and Drop
function onDragStart(e, index) {
    dragIndex.value = index;
    e.dataTransfer.effectAllowed = 'move';
    // Create a ghost image if needed, but default is fine
}

function onDragOver(e, index) {
    e.preventDefault();
    if (dragIndex.value === index) return;
    dropTargetIndex.value = index;
}

function onDrop(toIndex) {
    if (dragIndex.value !== null && dragIndex.value !== toIndex) {
        emit('reorder', { from: dragIndex.value, to: toIndex });
    }
    dragIndex.value = null;
    dropTargetIndex.value = null;
}

function onDragLeave() {
    // We only want to clear if we are not over any item
}

function onDragEnd() {
    dragIndex.value = null;
    dropTargetIndex.value = null;
}
</script>

<template>
    <div class="sidebar-container" :class="{ open: isOpen }">
        <button class="toggle-btn" @click="toggleSidebar">
            {{ isOpen ? '✕' : '⚙' }}
        </button>

        <aside class="sidebar">
            <div class="sidebar-section">
                <h2>VNC Settings</h2>
                <div class="add-form">
                    <input v-model="newLabel" type="text" placeholder="Session Name (optional)">
                    <input v-model="newUrl" type="url" placeholder="VNC URL..." @keyup.enter="handleAdd">
                    <div class="btn-group">
                        <button @click="handleAdd" class="add-btn">
                            {{ editingIndex !== null ? 'Update Session' : 'Add New Session' }}
                        </button>
                        <button v-if="editingIndex !== null" @click="cancelEdit" class="cancel-btn">Cancel</button>
                    </div>
                </div>
            </div>

            <div class="sidebar-section pin-section">
                <h3>Security PIN</h3>
                <div class="pin-form">
                    <input v-model="pinInput" type="password" placeholder="New PIN (empty to disable)">
                    <button @click="handleSetPin" class="pin-btn">Set PIN</button>
                </div>
                <p class="pin-status" v-if="isLocked">Dashboard is currently LOCKED</p>
            </div>

            <div class="vnc-items">
                <div
                    v-for="(item, index) in modelValue"
                    :key="item.id"
                    class="vnc-item"
                    :draggable="editingIndex === null"
                    @dragstart="onDragStart($event, index)"
                    @dragover="onDragOver($event, index)"
                    @drop="onDrop(index)"
                    @dragend="onDragEnd"
                    :class="{
                        dragging: dragIndex === index,
                        'drop-target': dropTargetIndex === index,
                        'is-editing': editingIndex === index
                    }"
                >
                    <span class="drag-handle">☰</span>
                    <div class="info" @click="startEdit(index)">
                        <span class="label">{{ item.label || `#${index + 1}` }}</span>
                        <span class="url">{{ item.vncLink }}</span>
                    </div>
                    <div class="actions">
                        <button @click="startEdit(index)" class="edit-btn" title="Edit">✏️</button>
                        <button @click="emit('remove', index)" class="remove-btn" title="Delete">🗑️</button>
                    </div>
                </div>
                <p v-if="modelValue.length === 0" class="empty">No sessions yet.</p>
            </div>
        </aside>
    </div>
    <div v-if="isOpen" class="overlay" @click="toggleSidebar"></div>
</template>

<style scoped>
.sidebar-container {
    position: fixed; top: 0; left: -350px; width: 350px; height: 100vh;
    background: rgba(10, 10, 10, 0.95); backdrop-filter: blur(20px); z-index: 3000; transition: left 0.3s ease;
    box-shadow: 5px 0 25px rgba(0,0,0,0.9); color: white; border-right: 1px solid #333;
}
.sidebar-container.open { left: 0; }
.toggle-btn {
    position: absolute; right: -36px; top: 15px; width: 30px; height: 30px;
    background: rgba(255, 0, 85, 0.8); border: none; border-radius: 0 4px 4px 0;
    cursor: pointer; font-size: 16px; color: white; display: flex; align-items: center; justify-content: center;
}
.sidebar { padding: 20px; height: 100%; display: flex; flex-direction: column; overflow-y: auto; }
.sidebar-section { margin-bottom: 25px; }
h2, h3 { margin-bottom: 15px; color: #fff; }
h3 { font-size: 1rem; border-bottom: 1px solid #333; padding-bottom: 8px; }

.add-form, .pin-form { display: flex; flex-direction: column; gap: 8px; }
.btn-group { display: flex; gap: 8px; }

input { padding: 10px; background: #000; border: 1px solid #333; border-radius: 4px; color: white; font-size: 0.9rem; transition: border-color 0.3s; }
input:focus { border-color: #00f2ff; outline: none; }

.add-btn { flex: 1; padding: 10px; background: #00f2ff; color: black; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
.cancel-btn { padding: 10px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer; }
.pin-btn { padding: 8px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer; }
.pin-status { font-size: 0.75rem; color: #ff0055; margin-top: 5px; font-weight: bold; }

.vnc-items { flex: 1; display: flex; flex-direction: column; gap: 10px; }

.vnc-item {
    background: #151515; padding: 12px; border-radius: 6px; display: flex; align-items: center; gap: 12px;
    cursor: grab; transition: all 0.2s ease; border: 1px solid #222;
    user-select: none; position: relative;
}
.vnc-item:active { cursor: grabbing; }
.vnc-item.dragging { opacity: 0.2; transform: scale(0.95); }
.vnc-item.drop-target { border-color: #00f2ff; transform: translateY(2px); background: #1a1a1a; box-shadow: 0 0 10px rgba(0, 242, 255, 0.2); }
.vnc-item.is-editing { border-color: #ff0055; background: #201015; }

.drag-handle { color: #444; font-size: 1.2rem; }
.info { flex: 1; display: flex; flex-direction: column; overflow: hidden; cursor: pointer; }
.label { font-weight: bold; font-size: 0.85rem; color: #ff0055; margin-bottom: 2px; }
.url { font-size: 0.7rem; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.actions { display: flex; gap: 8px; }
.edit-btn, .remove-btn { background: transparent; border: none; cursor: pointer; opacity: 0.5; font-size: 1rem; padding: 4px; transition: opacity 0.2s; }
.edit-btn:hover, .remove-btn:hover { opacity: 1; transform: scale(1.1); }

.empty { text-align: center; color: #444; margin-top: 30px; font-style: italic; }
.overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 2500; }
</style>
