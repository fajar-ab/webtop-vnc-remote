import { createApp } from 'vue'
import VueSmoothScroll from 'vue3-smooth-scroll'

import App from './App.vue'

const app = createApp(App)

app.use(VueSmoothScroll)
app.mount('#app')
