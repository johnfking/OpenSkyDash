<template>
  <article class="instrument-panel weather-card">
    <header class="panel-header">
      <div class="title-wrap">
        <span class="led weather-led"></span>
        <div>
          <h2>WEATHER</h2>
          <p>OPEN-METEO · {{ stg.weather.current.lastUpdate || 'STANDBY' }}</p>
        </div>
      </div>
    </header>

    <div v-if="stg.weather.current" class="panel-body">
      <section class="weather-hero">
        <div>
          <strong>{{ conditionText }}</strong>
          <span>{{ stg.ui.callsign || 'STATION' }} · {{ displayGrid }}</span>
        </div>
        <div class="temp-readout">{{ Math.round(stg.weather.current.temp || 0) }}°{{ tempUnit }}</div>
      </section>

      <div class="summary-strip">
        <span>FEELS {{ Math.round(stg.weather.current.feelsLike || 0) }}°{{ tempUnit }}</span>
        <span class="high">▲ {{ Math.round(stg.weather.current.high || 0) }}°{{ tempUnit }}</span>
        <span class="low">▼ {{ Math.round(stg.weather.current.low || 0) }}°{{ tempUnit }}</span>
      </div>

      <section class="metrics-grid">
        <div v-for="metric in metrics" :key="metric.label" class="metric-cell">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
        </div>
      </section>

      <section v-if="stg.weather.forecast && stg.weather.forecast.length" class="forecast-grid">
        <div v-for="day in stg.weather.forecast.slice(0, 3)" :key="day.name" class="forecast-tile">
          <span>{{ shortDay(day.name) }}</span>
          <strong>{{ Math.round(day.high) }}°/{{ Math.round(day.low) }}°</strong>
          <em>{{ day.precip ?? 0 }}%</em>
        </div>
      </section>
    </div>
  </article>
</template>

<script>
export default {
  name: 'WeatherCard',
  props: {
    stg: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      previousApiTime: null,
      refreshTimer: null,
      shared: this.stg || window.G_STATE || { weather: { current: {} } },
    };
  },
  mounted() {
    window.dashboard = this.stg;

    this.fetchWeather();

    if (this.stg.weather.updateInterval) clearInterval(this.stg.weather.updateInterval);

    const initialDelay = Math.random() * 15000;

    setTimeout(() => {
      this.fetchWeather();
      this.stg.weather.updateInterval = setInterval(() => {
        this.fetchWeather();
      }, 300000);
    }, initialDelay);
  },
  beforeUnmount() {
    if (this.stg.weather.updateInterval) clearInterval(this.stg.weather.updateInterval);
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
  },
  watch: {
    'stg.units': {
      handler() {
        this.debouncedRefresh();
      },
      deep: true,
    },
    'stg.lightning.homeLocation': {
      handler() {
        this.debouncedRefresh();
      },
      deep: true,
    },
  },
  computed: {
    tempUnit() {
      return String(this.stg.units.temperature || 'f').toUpperCase();
    },
    speedUnit() {
      return this.stg.units.distance === 'mi' ? 'MPH' : 'KMH';
    },
    distanceUnit() {
      return String(this.stg.units.distance || 'mi').toUpperCase();
    },
    pressureUnit() {
      return this.stg.units.pressure === 'inch' ? 'IN' : 'MB';
    },
    conditionText() {
      return String(this.stg.weather.current.conditionText || 'MONITORING').toUpperCase();
    },
    displayGrid() {
      return String(this.stg.ui.grid || 'DM04').slice(0, 4).toUpperCase();
    },
    metrics() {
      const current = this.stg.weather.current;
      return [
        { label: 'WIND', value: `${current.windDir || '--'} ${current.windSpeed ?? '--'} ${this.speedUnit}` },
        { label: 'HUMIDITY', value: `${current.humidity ?? '--'}%` },
        { label: 'GUSTS', value: `${current.gusts ?? '--'} ${this.speedUnit}` },
        { label: 'DEW PT', value: `${Math.round(current.dewPoint || 0)}°${this.tempUnit}` },
        { label: 'BAROMETER', value: `${current.pressure ?? '--'} ${this.pressureUnit}` },
        { label: 'CLOUD', value: `${current.clouds ?? '--'}%` },
        { label: 'VISIBILITY', value: `${current.visibility ?? '--'} ${this.distanceUnit}` },
        { label: 'UV INDEX', value: `${current.uv ?? '--'} · ${this.uvLabel(current.uv)}` },
      ];
    },
  },
  methods: {
    debouncedRefresh() {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = setTimeout(() => {
        this.fetchWeather();
      }, 1000);
    },
    shortDay(name) {
      const value = String(name || '').toUpperCase();
      return value === 'TODAY' ? value : value.slice(0, 3);
    },
    uvLabel(uv) {
      const value = Number(uv) || 0;
      if (value >= 8) return 'HIGH';
      if (value >= 6) return 'MOD';
      if (value >= 3) return 'LOW';
      return 'MIN';
    },
    async fetchWeather() {
      const lat = this.stg.lightning.homeLocation.lat;
      const lon = this.stg.lightning.homeLocation.lon;
      const tUnit = this.stg.units.temperature.toLowerCase() === 'c' ? 'celsius' : 'fahrenheit';
      const pUnit = this.stg.units.pressure.toLowerCase() === 'inch' ? 'inch' : 'hpa';
      const wUnit = this.stg.units.distance.toLowerCase() === 'mi' ? 'mph' : 'kmh';

      const params = [
        `latitude=${lat}`,
        `longitude=${lon}`,
        'cell_selection=nearest',
        'current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,visibility,dew_point_2m,uv_index',
        'daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max',
        `temperature_unit=${tUnit}`,
        `wind_speed_unit=${wUnit}`,
        'precipitation_unit=inch',
        `pressure_unit=${pUnit}`,
        'timezone=auto',
      ].join('&');

      const url = `https://api.open-meteo.com/v1/forecast?${params}`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error || !data.current) {
          console.error('Open-Meteo Error:', data.reason || 'Malformed response');
          return;
        }

        const condition = this.interpretWMO(data.current.weather_code, data.current.temperature_2m);
        const apiUnit = data.current_units.visibility;
        const rawVisibility = data.current.visibility;
        const calculatedValue = this.stg.units.distance.toLowerCase() === 'mi'
          ? (apiUnit === 'ft' ? rawVisibility / 5280 : rawVisibility / 1609.34)
          : (apiUnit === 'ft' ? rawVisibility / 3280.84 : rawVisibility / 1000);

        const rawPressure = data.current.pressure_msl;
        const pressureApiUnit = data.current_units.pressure_msl.toLowerCase();
        const finalPressure = this.stg.units.pressure.toLowerCase() === 'inch' && pressureApiUnit === 'hpa'
          ? (rawPressure * 0.02953).toFixed(2)
          : Number(rawPressure).toFixed(this.stg.units.pressure.toLowerCase() === 'inch' ? 2 : 1);

        const apiTime = data.current.time;
        let lastUpdateString = this.stg.weather.current.lastUpdate;

        if (apiTime !== this.previousApiTime) {
          this.previousApiTime = apiTime;
          lastUpdateString = new Date().toLocaleString('en-US', {
            hour12: String(this.stg.units.timeFormat) === '12',
            hour: 'numeric',
            minute: 'numeric',
          });
        }

        this.stg.weather.current = {
          ...this.stg.weather.current,
          temp: Math.round(data.current.temperature_2m),
          visibility: calculatedValue.toFixed(1),
          pressure: finalPressure,
          feelsLike: Math.round(data.current.apparent_temperature),
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          windDir: this.getWindDir(data.current.wind_direction_10m),
          gusts: Math.round(data.current.wind_gusts_10m),
          clouds: data.current.cloud_cover,
          uv: data.current.uv_index,
          high: Math.round(data.daily.temperature_2m_max[0]),
          low: Math.round(data.daily.temperature_2m_min[0]),
          dewPoint: Math.round(data.current.dew_point_2m),
          conditionText: condition.text,
          icon: condition.icon,
          lastUpdate: lastUpdateString,
        };

        this.stg.weather.forecast = data.daily.time.slice(0, 3).map((date, i) => {
          const dayCond = this.interpretWMO(data.daily.weather_code[i], data.daily.temperature_2m_max[i]);
          return {
            name: i === 0 ? 'Today' : new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }),
            high: Math.round(data.daily.temperature_2m_max[i]),
            low: Math.round(data.daily.temperature_2m_min[i]),
            precip: data.daily.precipitation_probability_max[i],
            icon: dayCond.icon,
          };
        });

        this.shared.weatherIcon = condition.icon;
        this.stg.weather.icon = condition.icon;
      } catch (error) {
        console.error('Network or Parsing failure:', error);
      }
    },
    getWindDir(deg) {
      const sectors = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      return sectors[Math.round((deg || 0) / 45) % 8];
    },
    interpretWMO(code, temp = 0) {
      if (code >= 71 && code <= 77 && temp > 40) return { text: 'Heavy Rain', icon: 'mdi-weather-pour' };
      if (code === 0) return { text: 'Clear', icon: 'mdi-weather-sunny' };
      if (code === 1) return { text: 'Mainly Clear', icon: 'mdi-weather-partly-cloudy' };
      if (code === 2) return { text: 'Partly Cloudy', icon: 'mdi-weather-partly-cloudy' };
      if (code === 3) return { text: 'Overcast', icon: 'mdi-weather-cloudy' };
      if (code >= 45 && code <= 48) return { text: 'Foggy', icon: 'mdi-weather-fog' };
      if (code >= 51 && code <= 67) return { text: 'Rainy', icon: 'mdi-weather-rainy' };
      if (code >= 71 && code <= 77) return { text: 'Snowy', icon: 'mdi-weather-snowy' };
      if (code >= 95) return { text: 'Stormy', icon: 'mdi-weather-lightning' };
      return { text: 'Overcast', icon: 'mdi-weather-cloudy' };
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

.weather-led {
  background: #7ec8ff;
  box-shadow: 0 0 10px rgba(126, 200, 255, .75);
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

.panel-body {
  padding: 16px;
}

.weather-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.weather-hero strong {
  display: block;
  color: #f1e7d3;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: .05em;
}

.weather-hero span {
  color: #8a7f66;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .18em;
}

.temp-readout,
.metric-cell strong,
.forecast-tile strong,
.forecast-tile em {
  color: #ffb64d;
  font-family: 'Share Tech Mono', monospace;
  font-weight: 400;
  text-shadow: 0 0 8px rgba(255, 150, 40, .35);
}

.temp-readout {
  flex: 0 0 auto;
  font-size: 44px;
  line-height: .9;
}

.summary-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
  padding: 9px 10px;
  border: 1px solid #352d20;
  border-radius: 9px;
  background: rgba(12, 9, 5, .5);
  color: #a99b7e;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .14em;
}

.summary-strip .high {
  color: #ff8a4d;
}

.summary-strip .low {
  color: #7ec8ff;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 8px;
}

.metric-cell {
  min-height: 58px;
  padding: 10px;
  border: 1px solid #352d20;
  border-radius: 9px;
  background: rgba(12, 9, 5, .5);
}

.metric-cell span {
  display: block;
  margin-bottom: 4px;
  color: #877c68;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .16em;
}

.metric-cell strong {
  font-size: 15px;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #33291a;
}

.forecast-tile {
  padding: 9px 5px;
  border: 1px solid #352d20;
  border-radius: 9px;
  background: rgba(12, 9, 5, .42);
  text-align: center;
}

.forecast-tile span {
  display: block;
  color: #cdbf9f;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .12em;
}

.forecast-tile strong {
  display: block;
  margin-top: 5px;
  font-size: 15px;
}

.forecast-tile em {
  display: block;
  margin-top: 4px;
  color: #7ec8ff;
  font-size: 11px;
  font-style: normal;
  text-shadow: none;
}
</style>
