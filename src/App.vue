<template>
  <v-app class="sky-app">
    <v-app-bar class="top-bar" density="compact" flat>
      <v-app-bar-title class="app-title"><v-icon icon="mdi-monitor-dashboard" color="cyan-lighten-2"
          size="small"></v-icon> {{ stg?.ui?.appName || 'SkyDash' }}</v-app-bar-title>
      <v-spacer></v-spacer>
      <div class="clock-chip">{{ currentTime }}</div>
    </v-app-bar>

    <v-main class="dashboard-main">
      <v-card class="dashboard-shell mx-auto" elevation="0">

        <v-tabs v-model="stg.ui.activeTab" class="dashboard-tabs" selected-class="active-tab" grow density="compact">
          <v-tab value="weather" class="tab-button">
            <template v-slot:prepend>
              <v-icon :icon="shared.weather.icon" color="cyan-lighten-2" size="small" class="mr-1"></v-icon>
            </template>
          </v-tab>
          <v-tab value="lightning" class="tab-button"><v-icon icon="mdi-flash" color="amber-lighten-2" size="small" class="mr-1"
              :class="{ 'pulsing-icon': (stg?.lightning?.currentStorm?.frequency > 0) }">
            </v-icon></v-tab>
          <v-tab value="solar" class="tab-button"><v-icon icon="mdi-sun-wireless" color="orange-lighten-2" size="small" class="mr-1"
              :class="{ 'pulsing-icon-solar': (stg?.solar?.current?.scales?.current.g > 0 || stg?.solar?.current?.scales?.current?.r > 0 || stg?.solar?.current?.scales?.current?.s > 0) }">
            </v-icon></v-tab>
          <v-tab value="settings" class="tab-button"><v-icon icon="mdi-cog" color="grey-lighten-2" size="small">
            </v-icon></v-tab>
        </v-tabs>
        <v-window v-model="stg.ui.activeTab" :touch="false" :transition="false">
          <v-window-item value="weather" eager>
            <WeatherCard v-show="stg.ui.activeTab === 'weather'" :stg="stg" />
          </v-window-item>
          <v-window-item v-show="stg.ui.activeTab === 'lightning'" value="lightning" eager>
            <LightningCard :stg="stg" />
          </v-window-item>
          <v-window-item value="solar" eager>
            <SolarCard v-show="stg.ui.activeTab === 'solar'" :stg="stg" />
          </v-window-item>
          <v-window-item value="settings" eager>
            <SettingsCard v-if="stg.ui.activeTab === 'settings'" :stg="stg"
              @update-distance="(val) => stg.units.distance = val" />
          </v-window-item>
        </v-window>
      </v-card>
    </v-main>
  </v-app>
</template>

<script>
import { reactive } from 'vue';
import { settings } from './components/cards/dashboardSettings.js';
import '@mdi/font/css/materialdesignicons.css';

import LightningCard from './components/cards/LightningCard.vue';
import SolarCard from './components/cards/SolarCard.vue';
import WeatherCard from './components/cards/WeatherCard.vue';
import SettingsCard from './components/cards/SettingsCard.vue';


export default {
  components: {
    LightningCard,
    SolarCard,
    WeatherCard,
    SettingsCard
  },
  data() {
    const masterState = reactive(settings);


    if (!masterState.weather) masterState.weather = {};
    if (!masterState.weather.current) masterState.weather.current = {};

    return {
      stg: masterState,


      shared: new Proxy(masterState, {
        get(target, prop) {

          if (prop === 'weatherIcon') return target.weather.current.weatherIcon;
          return target[prop];
        },
        set(target, prop, value) {

          if (prop === 'weatherIcon') {
            target.weather.current.weatherIcon = value;
            return true;
          }
          target[prop] = value;
          return true;
        }
      }),

      activeTab: 'weather',
      currentTime: '',
    };
  },
  created() {
    const savedSettings = localStorage.getItem('station_config_v1');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);


        if (parsed.lightning) {

          Object.assign(this.stg.lightning, parsed.lightning);


          if (parsed.lightning.ui) {
            Object.assign(this.stg.lightning.ui, parsed.lightning.ui);
          }


          if (parsed.lightning.homeLocation) {
            this.stg.lightning.homeLocation.lat = parseFloat(parsed.lightning.homeLocation.lat) || 34.05;
            this.stg.lightning.homeLocation.lon = parseFloat(parsed.lightning.homeLocation.lon) || -118.24;
          }
        }

        if (parsed.units) {
          Object.assign(this.stg.units, parsed.units);
        }

        if (parsed.ui) {
          Object.assign(this.stg.ui, parsed.ui);
        }

        if (parsed.solar) {
          Object.assign(this.stg.solar, parsed.solar);
        }

        if (parsed.weather) {
          Object.assign(this.stg.weather, parsed.weather);
        }

        // console.log("App.vue (created): All configurations successfully restored from storage.");
      } catch (e) {
        console.error("App.vue: Error pre-parsing saved settings", e);
      }
    }
  },
  mounted() {

    this.updateClock();
    setInterval(this.updateClock, 1000);


    window.G_STATE = this.stg;

    this.stg.ui.activeTab = 'weather';
  },

  methods: {
    updateClock() {

      const currentLocale = this.stg.units.time?.toLowerCase();
      const timeFormat = this.stg.units.timeFormat;



      const use12Hour = String(timeFormat) === '12';

      const now = new Date();

      if (currentLocale === 'locale') {


        this.currentTime = now.toLocaleTimeString(undefined, {
          hour12: use12Hour
        });

      } else if (currentLocale === 'utc') {

        this.currentTime = now.toLocaleString('en-US', {
          timeZone: 'UTC',
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: use12Hour,
          timeZoneName: 'short'
        });
      }
    }
  },
  watch: {
    stg: {
      handler(newSettings) {

        localStorage.setItem('station_config_v1', JSON.stringify(newSettings));
      },
      deep: true
    }
  },
};
</script>

<style scoped>
.sky-app {
  background:
    radial-gradient(circle at 20% 10%, rgba(56, 189, 248, 0.2), transparent 30%),
    radial-gradient(circle at 80% 0%, rgba(249, 115, 22, 0.16), transparent 28%),
    linear-gradient(180deg, #0f172a 0%, #111827 48%, #0b1120 100%);
  color: #e5eefb;
}

.top-bar {
  background: rgba(15, 23, 42, 0.76) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  backdrop-filter: blur(14px);
}

.app-title {
  color: #e2e8f0;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.clock-chip {
  margin-right: 14px;
  padding: 4px 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: #cbd5e1;
  font-size: 0.86rem;
  font-weight: 700;
}

.dashboard-main {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100dvh;
  padding: 66px 12px 28px;
}

.dashboard-shell {
  width: min(352px, calc(100vw - 24px));
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  background: rgba(15, 23, 42, 0.9);
  box-shadow: 0 24px 70px rgba(2, 6, 23, 0.38);
}

.dashboard-tabs {
  margin: 10px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px;
  background: rgba(2, 6, 23, 0.36);
  overflow: hidden;
}

.tab-button {
  min-width: 0;
  color: #94a3b8;
}

:deep(.active-tab) {
  background: rgba(56, 189, 248, 0.12);
  color: #e0f2fe !important;
}

.pulsing-icon {
  animation: pulse-lightning 1.5s infinite ease-in-out;
  display: inline-block;
}

.pulsing-icon-solar {
  animation: pulse-lightning 10s infinite ease-in-out;
  display: inline-block;
}

@keyframes pulse-lightning {
  0% {
    transform: scale(1);
    filter: brightness(1) drop-shadow(0 0 0px rgba(255, 193, 7, 0));
  }

  50% {
    transform: scale(1.2);
    filter: brightness(1.8) drop-shadow(0 0 5px rgba(255, 193, 7, 0.8));
  }

  100% {
    transform: scale(1);
    filter: brightness(1) drop-shadow(0 0 0px rgba(255, 193, 7, 0));
  }
}


html,
body,
#app,
.v-application {
  min-height: 100dvh !important;
  height: 100dvh !important;
  overflow-y: auto !important;
}
</style>
