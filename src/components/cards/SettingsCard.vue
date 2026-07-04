<template>
  <article class="instrument-panel settings-card">
    <header class="panel-header">
      <div class="title-wrap">
        <span class="led config-led"></span>
        <div>
          <h2>CONFIG</h2>
          <p>STATION SETUP</p>
        </div>
      </div>
    </header>

    <section class="config-section">
      <h3>UNITS</h3>
      <div class="toggle-row">
        <span>DISTANCE</span>
        <div class="segmented">
          <button type="button" :class="{ selected: stg.units.distance === 'mi' }" @click="stg.units.distance = 'mi'">MI</button>
          <button type="button" :class="{ selected: stg.units.distance === 'km' }" @click="stg.units.distance = 'km'">KM</button>
        </div>
      </div>
      <div class="toggle-row">
        <span>TEMP</span>
        <div class="segmented">
          <button type="button" :class="{ selected: stg.units.temperature === 'f' }" @click="stg.units.temperature = 'f'">°F</button>
          <button type="button" :class="{ selected: stg.units.temperature === 'c' }" @click="stg.units.temperature = 'c'">°C</button>
        </div>
      </div>
      <div class="toggle-row">
        <span>PRESSURE</span>
        <div class="segmented">
          <button type="button" :class="{ selected: stg.units.pressure === 'inch' }" @click="stg.units.pressure = 'inch'">IN</button>
          <button type="button" :class="{ selected: stg.units.pressure === 'mb' }" @click="stg.units.pressure = 'mb'">MB</button>
        </div>
      </div>
      <div class="toggle-row">
        <span>TIME</span>
        <div class="segmented">
          <button type="button" :class="{ selected: stg.units.timeFormat === '12' }" @click="stg.units.timeFormat = '12'">12H</button>
          <button type="button" :class="{ selected: stg.units.timeFormat === '24' }" @click="stg.units.timeFormat = '24'">24H</button>
        </div>
      </div>
    </section>

    <section class="config-section">
      <h3>STATION LOCATION</h3>
      <div class="field-grid">
        <label>
          <span>CALLSIGN</span>
          <input v-model.trim="stg.ui.callsign" type="text">
        </label>
        <label>
          <span>GRID</span>
          <input v-model.trim="stg.ui.grid" type="text">
        </label>
        <label>
          <span>LATITUDE</span>
          <input v-model.number="stg.lightning.homeLocation.lat" type="number" step="0.0001" @change="normalizeLocation">
        </label>
        <label>
          <span>LONGITUDE</span>
          <input v-model.number="stg.lightning.homeLocation.lon" type="number" step="0.0001" @change="normalizeLocation">
        </label>
      </div>
    </section>

    <section class="config-section">
      <h3>LIGHTNING</h3>
      <div class="field-grid lightning-grid">
        <label>
          <span>AREA</span>
          <input v-model.number="stg.lightning.searchRadius" type="number" min="1">
        </label>
        <label>
          <span>ALERT</span>
          <input v-model.number="stg.lightning.alertThreshold" type="number" min="1">
        </label>
        <label>
          <span>RESET</span>
          <input v-model.number="stg.lightning.resetTime" type="number" min="1">
        </label>
        <label>
          <span>SENSITIVITY</span>
          <input v-model.number="stg.lightning.sensitivity" type="number" min="0.5" step="0.5">
        </label>
      </div>
    </section>

    <footer class="backup-actions">
      <button type="button" @click="exportToDisk">BACKUP</button>
      <button type="button" @click="$refs.fileInput.click()">RESTORE</button>
      <input ref="fileInput" type="file" accept=".json" @change="importFromDisk">
    </footer>
  </article>
</template>

<script>
export default {
  name: 'SettingsCard',
  props: {
    stg: {
      type: Object,
      required: true,
    },
  },
  methods: {
    normalizeLocation() {
      const lat = parseFloat(this.stg.lightning.homeLocation.lat);
      const lon = parseFloat(this.stg.lightning.homeLocation.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
      this.stg.lightning.homeLocation.lat = lat;
      this.stg.lightning.homeLocation.lon = lon;
    },
    exportToDisk() {
      try {
        const cleanData = JSON.parse(JSON.stringify(this.stg));

        if (cleanData.weather) {
          cleanData.weather.current = {};
          cleanData.weather.forecast = [];
        }
        if (cleanData.lightning) {
          cleanData.lightning.history = [];
          delete cleanData.lightning.currentStorm;
          delete cleanData.lightning.heartbeat;
        }
        if (cleanData.solar) {
          cleanData.solar.current = {};
        }

        const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(cleanData, null, 2))}`;
        const downloadAnchorNode = document.createElement('a');
        const safeAppName = (this.stg.ui.appName || 'SkyDash').replace(/[^a-zA-Z0-9-_]/g, '_');
        downloadAnchorNode.setAttribute('href', dataStr);
        downloadAnchorNode.setAttribute('download', `${safeAppName}_station_settings.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      } catch (e) {
        console.error('Export failed:', e);
      }
    },
    importFromDisk(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target.result);

          const deepMerge = (target, source) => {
            Object.keys(source).forEach((key) => {
              if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                deepMerge(target[key], source[key]);
              } else {
                target[key] = source[key];
              }
            });
          };

          deepMerge(this.stg, importedConfig);
          localStorage.setItem('station_config_v1', JSON.stringify(JSON.parse(JSON.stringify(this.stg))));
        } catch (err) {
          console.error('Import parsing error:', err);
          alert('Error parsing the settings file. Ensure it is a valid JSON profile.');
        } finally {
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    },
  },
};
</script>

<style scoped>
.instrument-panel {
  display: flex;
  width: 100%;
  min-height: 100%;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #4a3f2c;
  border-radius: 14px;
  background: linear-gradient(180deg, #231e15, #181309);
  box-shadow: inset 0 1px 0 rgba(255, 220, 160, .06), 0 18px 40px rgba(0, 0, 0, .5);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #33291a;
  background: linear-gradient(180deg, #2a2418, #1c1710);
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.led {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.config-led {
  background: #b8ab8d;
  box-shadow: 0 0 10px rgba(184, 171, 141, .6);
}

h2 {
  margin: 0;
  color: #f1e7d3;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: .22em;
}

.panel-header p {
  margin: 2px 0 0;
  color: #6f654e;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .16em;
}

.config-section {
  padding: 14px 16px 0;
}

.config-section h3 {
  margin: 0 0 10px;
  color: #877c68;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .24em;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 9px;
}

.toggle-row > span {
  width: 88px;
  flex: 0 0 88px;
  color: #a99b7e;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .1em;
}

.segmented {
  display: flex;
  flex: 1;
  gap: 6px;
}

.segmented button,
.backup-actions button {
  border: 1px solid #4a3f2c;
  border-radius: 7px;
  background: linear-gradient(180deg, #241f17, #17130d);
  color: #8a7f6a;
  cursor: pointer;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .1em;
  transition: .12s ease;
}

.segmented button {
  flex: 1 1 0;
  min-height: 34px;
}

.segmented button.selected {
  border-color: #ffce7a;
  background: linear-gradient(180deg, #ffb64d, #e8902f);
  color: #1a1206;
  box-shadow: 0 0 14px rgba(255, 150, 40, .5), inset 0 1px 0 rgba(255, 255, 255, .4);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.lightning-grid {
  grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
}

label {
  display: block;
  padding: 9px 10px;
  border: 1px solid #352d20;
  border-radius: 9px;
  background: rgba(12, 9, 5, .5);
}

label span {
  display: block;
  margin-bottom: 5px;
  color: #6f654e;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: .2em;
}

input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #ffb64d;
  font-family: 'Share Tech Mono', monospace;
  font-size: 15px;
  text-shadow: 0 0 8px rgba(255, 150, 40, .35);
}

input[type='number'] {
  appearance: textfield;
}

input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  margin: 0;
  appearance: none;
}

.backup-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  margin-top: auto;
  padding: 16px;
}

.backup-actions button {
  min-height: 38px;
  background: linear-gradient(180deg, #2a2418, #181309);
  color: #c9b89a;
  letter-spacing: .18em;
}

.backup-actions button:hover {
  border-color: #ffb64d;
  color: #ffce9a;
}

.backup-actions input {
  display: none;
}
</style>
