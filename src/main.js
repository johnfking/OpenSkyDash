import { createApp } from 'vue'
import App from './App.vue'
import { registerPlugins } from './plugins'
import './assets/main.css'

if (import.meta.env.PROD) {
  console.log = () => {}
  console.warn = () => {}
}

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
