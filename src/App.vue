<template>
  <v-app class="sky-app">
    <v-main class="dashboard-main">
      <section class="console-shell">
        <span class="screw screw-tl"></span>
        <span class="screw screw-tr"></span>
        <span class="screw screw-bl"></span>
        <span class="screw screw-br"></span>

        <header class="nameplate">
          <div class="logo-mark" aria-hidden="true">
            <span></span>
          </div>

          <div class="brand-block">
            <h1><span>SKY</span><strong>DASH</strong></h1>
            <p>SW-1 · STATION MONITOR</p>
            <p class="author-credit">BY MICK, W8BE</p>
          </div>

          <div class="station-badges">
            <div class="badge-cell">
              <span>CALLSIGN</span>
              <strong>{{ stg.ui.callsign || 'W8BE' }}</strong>
            </div>
            <div class="badge-cell">
              <span>GRID</span>
              <strong>{{ displayGrid }}</strong>
            </div>
          </div>

          <div class="header-spacer"></div>

          <div class="clock-stack">
            <div class="clock-readout">{{ currentTime }}</div>
            <div class="utc-line">
              <span>LOCAL</span>
              <strong>{{ utcTime }}</strong>
            </div>
          </div>

          <div class="power-indicator">
            <span></span>
            <strong>PWR</strong>
          </div>
        </header>

        <nav class="channel-nav" aria-label="Dashboard sections">
          <a href="#weather"><span class="dot weather-dot"></span>WEATHER</a>
          <a href="#lightning"><span class="dot lightning-dot"></span>LIGHTNING</a>
          <a href="#solar"><span class="dot solar-dot"></span>SOLAR</a>
          <a href="#settings"><span class="dot config-dot"></span>CONFIG</a>
        </nav>

        <div class="panel-grid">
          <section id="lightning" class="panel-slot panel-hero">
            <LightningCard :stg="stg" />
          </section>
          <section id="solar" class="panel-slot panel-hero">
            <SolarCard :stg="stg" />
          </section>
          <section id="weather" class="panel-slot panel-secondary">
            <WeatherCard :stg="stg" />
          </section>
          <section id="settings" class="panel-slot panel-secondary">
            <SettingsCard :stg="stg" />
          </section>
        </div>

        <footer class="console-footer">
          <p>DATA · OPEN-METEO · BLITZORTUNG · NOAA SWPC · KC2G</p>
          <p>SKYDASH · MIT LICENSE</p>
        </footer>
      </section>
    </v-main>
  </v-app>
</template>

<script>
import { reactive } from 'vue';
import { settings } from './components/cards/dashboardSettings.js';

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
    if (!masterState.ui) masterState.ui = {};
    if (!masterState.ui.callsign) masterState.ui.callsign = 'W8BE';
    if (!masterState.ui.grid) masterState.ui.grid = 'DM04TE';

    return {
      stg: masterState,
      currentTime: '',
      utcTime: '',
      clockTimer: null,
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

        if (parsed.units) Object.assign(this.stg.units, parsed.units);
        if (parsed.ui) Object.assign(this.stg.ui, parsed.ui);
        if (parsed.solar) Object.assign(this.stg.solar, parsed.solar);
        if (parsed.weather) Object.assign(this.stg.weather, parsed.weather);
      } catch (e) {
        console.error('App.vue: Error pre-parsing saved settings', e);
      }
    }
  },
  mounted() {
    this.updateClock();
    this.clockTimer = setInterval(this.updateClock, 1000);
    window.G_STATE = this.stg;
  },
  beforeUnmount() {
    if (this.clockTimer) clearInterval(this.clockTimer);
  },
  methods: {
    updateClock() {
      const now = new Date();
      const use12Hour = String(this.stg.units.timeFormat) === '12';

      this.currentTime = now.toLocaleTimeString(undefined, {
        hour12: use12Hour,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      this.utcTime = now.toLocaleTimeString('en-US', {
        timeZone: 'UTC',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      });
    },
  },
  computed: {
    displayGrid() {
      return String(this.stg.ui.grid || 'DM04').slice(0, 4).toUpperCase();
    },
  },
  watch: {
    stg: {
      handler(newSettings) {
        localStorage.setItem('station_config_v1', JSON.stringify(newSettings));
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
.sky-app {
  min-height: 100dvh;
  background: radial-gradient(120% 90% at 50% -10%, #26221b 0%, #14110c 55%, #0c0a07 100%);
  color: #f1e7d3;
  font-family: 'Barlow', system-ui, sans-serif;
}

.dashboard-main {
  min-height: 100dvh;
  padding: clamp(14px, 3vw, 36px);
}

.console-shell {
  position: relative;
  width: min(1360px, 100%);
  margin: 0 auto;
  padding: clamp(14px, 3vw, 36px);
  overflow: hidden;
  border: 1px solid #4c4130;
  border-radius: 24px;
  background: linear-gradient(180deg, #2b261d 0%, #211c15 44%, #191510 100%);
  box-shadow:
    inset 0 2px 0 rgba(255, 228, 170, .10),
    inset 0 0 0 1px rgba(0, 0, 0, .4),
    0 34px 90px rgba(0, 0, 0, .62);
}

.screw {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #7a6c52, #2c2519 70%);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, .18), 0 1px 2px rgba(0, 0, 0, .7);
}

.screw-tl { top: 12px; left: 12px; }
.screw-tr { top: 12px; right: 12px; }
.screw-bl { bottom: 12px; left: 12px; }
.screw-br { bottom: 12px; right: 12px; }

.nameplate {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  padding: 0 0 18px;
  border-bottom: 1px solid #3a3122;
}

.logo-mark {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #58492f;
  border-radius: 10px;
  background: linear-gradient(180deg, #312a1f, #1c180f);
}

.logo-mark span {
  position: relative;
  width: 22px;
  height: 22px;
  border: 2px solid #ffb64d;
  box-shadow: 0 0 10px rgba(255, 182, 77, .4);
}

.logo-mark span::after {
  position: absolute;
  right: 3px;
  bottom: 4px;
  width: 10px;
  height: 3px;
  background: #ffb64d;
  content: '';
}

.brand-block h1 {
  margin: 0;
  color: #f1e7d3;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: .14em;
  line-height: .95;
}

.brand-block h1 strong {
  color: #ffb64d;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(255, 150, 40, .35);
}

.brand-block p,
.utc-line span,
.power-indicator strong {
  margin: 0;
  color: #7d7259;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .32em;
}

.brand-block .author-credit {
  margin-top: 2px;
  color: #9f8f70;
  font-size: 8px;
  letter-spacing: .18em;
}

.station-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge-cell {
  min-width: 78px;
  padding: 7px 10px;
  border: 1px solid #4a3f2c;
  border-radius: 9px;
  background: #14110b;
}

.badge-cell span {
  display: block;
  color: #6f654e;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: .24em;
}

.badge-cell strong {
  color: #ffb64d;
  font-family: 'Share Tech Mono', monospace;
  font-size: 17px;
  font-weight: 400;
  text-shadow: 0 0 8px rgba(255, 150, 40, .35);
}

.header-spacer {
  flex: 1 1 120px;
}

.clock-stack {
  text-align: right;
}

.clock-readout {
  color: #ffb64d;
  font-family: 'Share Tech Mono', monospace;
  font-size: 30px;
  line-height: 1;
  text-shadow: 0 0 8px rgba(255, 150, 40, .35);
  animation: flick 5s infinite;
}

.utc-line {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 5px;
}

.utc-line strong {
  color: #948a70;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  font-weight: 400;
}

.power-indicator {
  display: flex;
  align-items: center;
  gap: 7px;
}

.power-indicator span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #8fe06a;
  box-shadow: 0 0 10px rgba(143, 224, 106, .75);
}

.channel-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 16px 0;
}

.channel-nav a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 13px;
  border: 1px solid #4a3f2c;
  border-radius: 9px;
  background: linear-gradient(180deg, #2a2419, #181309);
  color: #c9b89a;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .16em;
  text-decoration: none;
  transition: .14s ease;
}

.channel-nav a:hover {
  border-color: #ffb64d;
  color: #ffce9a;
  box-shadow: 0 0 16px rgba(255, 150, 40, .18);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.weather-dot { background: #7ec8ff; }
.lightning-dot { background: #ff5a3c; }
.solar-dot { background: #ffb64d; }
.config-dot { background: #b8ab8d; }

.panel-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 16px;
}

.panel-slot {
  display: flex;
  min-width: 300px;
}

.panel-slot > * {
  width: 100%;
}

.panel-hero {
  flex: 2 1 460px;
}

.panel-secondary {
  flex: 1 1 340px;
}

.console-footer {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #3a3122;
  text-align: center;
}

.console-footer p {
  margin: 2px 0;
  color: #615843;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .2em;
}

@keyframes flick {
  0%, 100% { opacity: 1; }
  50% { opacity: .88; }
}

@media (max-width: 640px) {
  .nameplate {
    align-items: flex-start;
  }

  .header-spacer {
    display: none;
  }

  .clock-stack {
    width: 100%;
    text-align: left;
  }

  .utc-line {
    justify-content: flex-start;
  }
}
</style>
