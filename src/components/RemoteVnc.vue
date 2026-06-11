<script setup>
import { ref, defineProps } from "vue";

const props = defineProps({
    vncLink: String,
    indexLink: Number,
    activeLink: Number,
    label: String
});

const isUp = ref(false);
const isRotate = ref(false);
const isPowered = ref(true); // Default ON
const vncIframe = ref(null);

function reloadIframe() {
    if (!isPowered.value) return;
    isRotate.value = true;
    setTimeout(() => { isRotate.value = false; }, 1000);
    if (vncIframe.value) {
        const currentSrc = vncIframe.value.src;
        vncIframe.value.src = '';
        vncIframe.value.src = currentSrc;
    }
}

function togglePower() {
    isPowered.value = !isPowered.value;
}

// Keyboard shortcut handler exposed via ref
defineExpose({ reloadIframe, togglePower, toggleUp: () => isUp.value = !isUp.value });

</script>

<template>
    <section class="container-vnc" :id="`iframe${indexLink}`" :class="{ active: indexLink === activeLink, up: isUp, off: !isPowered }">
        <div class="vnc-header">
            <span class="vnc-label">{{ label || `#${indexLink + 1}` }}</span>
            <span class="vnc-status" :class="{ online: isPowered }">
                {{ isPowered ? '● LIVE' : '○ ASLEEP' }}
            </span>
        </div>

        <iframe v-if="isPowered" class="vnc-remote" :src="vncLink" ref="vncIframe" :title="label"
            allow="fullscreen"></iframe>

        <div v-else class="vnc-placeholder">
            <div class="power-hint">
                <span class="power-icon">⏻</span>
                <p>System Asleep</p>
                <button @click="togglePower" class="resume-btn">Wake Up</button>
            </div>
        </div>

        <div class="vnc-barrier" :class="{ 'up': !isUp }"></div>

        <div class="menu">
            <div class="tab" @click="togglePower" :title="isPowered ? 'Pause Session' : 'Start Session'">
                <span class="icon power" :class="{ on: isPowered }">⏻</span>
            </div>
            <div class="tab" @click="reloadIframe" title="Reload Session">
                <span class="icon reload" :class="{ rotate: isRotate, play: isRotate, disabled: !isPowered }">⬚</span>
            </div>
            <div class="tab" @click="isUp = !isUp" title="Toggle View">
                <span class="icon toggle" :class="{ 'up': isUp }">⬚</span>
            </div>
        </div>
    </section>
</template>


<style scoped>
.container-vnc {
    width: 900px; aspect-ratio: 16 / 9; max-height: 550px;
    border: 1px solid #333; position: relative; overflow: hidden;
    transition: all 0.5s ease; background-color: #050505;
}
.container-vnc.active { border-color: #00f2ff; border-width: 2px; box-shadow: 0 0 15px rgba(0, 242, 255, 0.3); }
.container-vnc.up { aspect-ratio: 16 / 4.5; }
.container-vnc.off { border-style: dashed; border-color: #555; }

.vnc-header {
    position: absolute; top: 0; left: 0; right: 0; padding: 5px 10px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.9), transparent);
    display: flex; justify-content: space-between; align-items: center; z-index: 5;
    pointer-events: none;
}
.vnc-label { color: #ccc; font-size: 0.75rem; font-weight: bold; text-shadow: 0 0 5px black; }
.vnc-status { font-size: 0.65rem; font-weight: bold; color: #444; }
.vnc-status.online { color: #00f2ff; text-shadow: 0 0 8px #00f2ff; animation: blink 2s infinite; }

@keyframes blink { 50% { opacity: 0.5; } }

.vnc-remote { width: 100%; aspect-ratio: 16 / 9; border: none; background-color: #000; position: absolute; bottom: 0; left: 0; }

.vnc-placeholder {
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    background: radial-gradient(circle, #151515 0%, #000 100%);
}
.power-hint { text-align: center; color: #555; }
.power-icon { font-size: 3rem; display: block; margin-bottom: 10px; color: #333; }
.resume-btn {
    margin-top: 15px; padding: 6px 20px; background: #111; color: #888; border: 1px solid #333;
    border-radius: 4px; cursor: pointer; font-size: 0.8rem; transition: all 0.3s;
    text-transform: uppercase; letter-spacing: 1px;
}
.resume-btn:hover { background: #ff0055; color: white; border-color: #ff0055; box-shadow: 0 0 10px #ff0055; }

.vnc-barrier {
    width: 100%; height: 185px; background: black; position: absolute; top: -23px;
    transform-origin: bottom; transition: transform 0.5s ease; pointer-events: none;
}

.vnc-barrier::after,
.vnc-barrier::before {display: block; content: ""; height: 90px; background: black;}

.vnc-barrier::after {width: 190px; position: absolute; bottom: -90px;}

.vnc-barrier::before {width: 198px; right: 0; position: absolute; bottom: -90px;}

.vnc-barrier.up { transform: translateY(-260px); }

.menu {
    width: 32px; height: 96px; position: absolute; bottom: 8px; left: 8px;
    opacity: 0; transition: opacity 0.3s ease; background: rgba(0, 0, 0, 0.85);
    border-radius: 4px; backdrop-filter: blur(10px); display: flex; flex-direction: column;
    z-index: 10; border: 1px solid rgba(255, 255, 255, 0.1);
}
.container-vnc:hover .menu { opacity: 1; }
.menu .tab { width: 100%; height: 33.33%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.menu .tab:hover { background: rgba(255,255,255,0.05); }

.icon {
    transition: all 0.3s ease;
    width: 20px; height: 20px;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: bold; user-select: none;
}
.icon.power { color: #555; }
.icon.power.on { color: #ff0055; text-shadow: 0 0 8px #ff0055; }
.icon.reload { color: #00f2ff; }
.icon.toggle { color: #ffff00; }
.icon.disabled { opacity: 0.2; pointer-events: none; }
.icon.up { transform: rotate(180deg); }

@keyframes rotateAnimation { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.icon.rotate.play { animation: rotateAnimation 1s linear forwards; }
</style>
