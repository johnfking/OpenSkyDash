<template>
    <v-sheet value="weather" transition="fade-transition" flat class="weather-card mx-auto">
        <div v-if="stg.weather.current">

            <div v-if="stg.weather.current && stg.weather.current.temp !== undefined"
                class="weather-hero"
                style="position: relative; z-index: 10;">

                <div class="d-flex align-start ga-3">
                    <div class="weather-icon-wrap">
                        <v-icon :icon="stg.weather.current.icon || 'mdi-weather-cloudy'" color="cyan-lighten-2"
                            size="34"></v-icon>
                    </div>

                    <!-- Wrap both lines in a column div to stack them -->
                    <div class="d-flex flex-column">
                        <!-- Top Line: Condition -->
                        <span class="condition-text">
                            {{ stg.weather.current.conditionText }}
                        </span>

                        <span class="source-text">
                            Open-Meteo.com {{ stg.weather.current.lastUpdate }}
                        </span>
                    </div>
                </div>

                <div class="temp-readout">
                    {{ Math.round(stg.weather.current.temp) }}°{{ stg.units.temperature.toUpperCase() }}
                </div>

            </div>

            <div v-else class="text-center py-4">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>

            <div class="summary-strip">
                <span>Feels like {{ Math.round(stg.weather.current.feelsLike) }}°</span>
                <span class="text-orange-lighten-2">▲{{ Math.round(stg.weather.current.high) }}°</span>
                <span class="text-blue-lighten-2">▼{{ Math.round(stg.weather.current.low) }}°</span>
            </div>

            <div class="metrics-grid">
                <div class="metric-cell">
                    <span class="label"><v-icon icon="mdi-weather-windy-variant" v-tooltip:top="'Current Wind'"
                            color="cyan-lighten-2" size="large"></v-icon></span>
                    <span class="val mr-2">{{ stg.weather.current.windDir }} <strong>{{ stg.weather.current.windSpeed }}
                            {{ stg.units.distance === 'mi' ? 'mph' : 'km' }}</strong></span>
                </div>
                <div class="metric-cell">
                    <span class="label"><v-icon icon="mdi-water" v-tooltip:top="'Current Humidity'"
                            color="cyan-lighten-3" size="large"></v-icon></span>
                    <span class="val"><strong>{{ stg.weather.current.humidity }}%</strong></span>
                </div>

                <div class="metric-cell">
                    <span class="label"><v-icon icon="mdi-windsock" v-tooltip:top="'Current Gusts'"
                            color="teal-lighten-1" size="large"></v-icon></span>
                    <span class="val"><strong>{{ stg.weather.current.gusts }} {{
                        stg.units.distance === 'mi' ? 'mph' : 'km' }}</strong></span>
                </div>
                <div class="metric-cell">
                    <span class="label"><v-icon icon="mdi-water-thermometer" v-tooltip:top="'Current Dew Point'"
                            color="cyan-lighten-3" size="large"></v-icon></span>
                    <span class="val"><strong>{{ Math.round(stg.weather.current.dewPoint) }}°{{
                        stg.units.temperature.toUpperCase() }}</strong></span>
                </div>
                <div class="metric-cell">
                    <span class="label"><v-icon icon="mdi-gauge" v-tooltip:top="'Current Air Pressure'"
                            color="green-accent-4" size="large"></v-icon></span>
                    <span class="val"><strong>{{ stg.weather.current.pressure }}</strong> <small class="text-caption">{{
                        stg.units.pressure ===
                            'inch' ? 'in' : 'mb' }}</small></span>
                </div>
                <div class="metric-cell">
                    <span class="label"><v-icon icon="mdi-clouds" v-tooltip:top="'Current Cloud Cover'"
                            color="indigo-lighten-3" size="large"></v-icon></span>
                    <span class="val"><strong>{{ stg.weather.current.clouds }}%</strong></span>
                </div>

                <div class="metric-cell">
                    <span class="label"><v-icon icon="mdi-eye" v-tooltip:top="'Current Visibility'"
                            color="blue-grey-lighten-2" size="large"></v-icon></span>
                    <span class="val"><strong>{{ stg.weather.current.visibility }} {{ stg.units.distance
                            }}</strong></span>
                </div>
                <div class="metric-cell">
                    <span class="label"><v-icon icon="mdi-sun-wireless" v-tooltip:top="'Current UV Exposure'"
                            color="amber-lighten-3" size="large"></v-icon></span>
                    <span class="val"><strong>{{ stg.weather.current.uv }} UV</strong></span>
                </div>
            </div>

            <v-row v-if="stg.weather.forecast && stg.weather.forecast.length > 0"
                class="forecast-grid mx-0" no-gutters>
                <v-col v-for="day in stg.weather.forecast" :key="day.name" cols="4" class="text-center">
                    <div class="forecast-tile">
                        <span class="forecast-day">
                            {{ day.name }}
                        </span>

                        <v-icon
                            :icon="(day.icon === 'mdi-weather-snowy' && day.high > 40) ? 'mdi-weather-pour' : day.icon"
                            size="small" color="cyan-lighten-2" class="ma-0">
                        </v-icon>

                        <div class="forecast-temp">
                            {{ Math.round(day.high) }}°<span class="text-grey-darken-1 font-weight-regular">/{{
                                Math.round(day.low) }}°</span>
                        </div>

                        <div class="forecast-precip">
                            <v-icon size="10" color="cyan-lighten-2" class="mr-0.5">mdi-water</v-icon>
                            {{ day.precip }}%
                        </div>
                    </div>
                </v-col>
            </v-row>
        </div>

        <v-container v-else class="d-flex justify-center align-center" style="height: 400px;">
            <v-progress-circular indeterminate color="blue-lighten-3"></v-progress-circular>
        </v-container>
    </v-sheet>
</template>

<script>

export default {
    name: 'WeatherCard',
    props: {
        stg: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            data: null,
            alert: null,
            forecast: [],
            previousApiTime: null,
            localPressure: 0,
            localVisability: 0,
            localToggle: null,
            shared: this.stg || window.G_STATE || { weather: { current: {} } }
        };
    },
    mounted() {

        window.dashboard = this.stg;

        if (this.stg.weather.updateInterval) { clearInterval(this.stg.weather.updateInterval); }

        const saved = localStorage.getItem('station_config_v1');
        if (saved && saved !== "undefined") {
            try {
                const config = JSON.parse(saved);

            } catch (e) {
                console.error("Weather Fetch failed:", error.message);
            }
        } else {

        }

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
        if (this.stg.weather.updateInterval) {
            clearInterval(this.stg.weather.updateInterval);
        }
    },

    watch: {
        'stg.units': {
            handler(newVal) {
                this.fetchWeather();
            },
            deep: true
        },
        'stg.lightning.homeLocation': {
            handler() {
                this.fetchWeather();
            },
            deep: true
        },

        'stg.units.temperature'() {
            this.fetchWeather();
        },


        'stg.units.pressure'() {
            this.fetchWeather();
        },


        'stg.units.distance'() {
            this.fetchWeather();
        }
    },

    methods: {

        debouncedRefresh() {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = setTimeout(() => {
                this.fetchWeather();
            }, 1000);
        },

        async fetchWeather() {
            const lat = this.stg.lightning.homeLocation.lat;
            const lon = this.stg.lightning.homeLocation.lon;
            const tUnit = this.stg.units.temperature.toLowerCase() === 'c' ? 'celsius' : 'fahrenheit';
            const pUnit = this.stg.units.pressure.toLowerCase() === 'in' ? 'inch' : 'hpa';
            const wUnit = this.stg.units.distance.toLowerCase() === 'mi' ? 'mph' : 'kmh';

            const params = [
                `latitude=${lat}`,
                `longitude=${lon}`,
                `cell_selection=nearest`,
                `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,visibility,dew_point_2m,uv_index`,
                `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max`,
                `temperature_unit=${tUnit}`,
                `wind_speed_unit=${wUnit}`,
                `precipitation_unit=inch`,
                `pressure_unit=${pUnit}`,
                `timezone=auto`
            ].join('&');

            const url = `https://api.open-meteo.com/v1/forecast?${params}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.error || !data.current) {
                    console.error("Open-Meteo Error:", data.reason || "Malformed response");
                    return;
                }

                const condition = this.interpretWMO(data.current.weather_code);

                const apiUnit = data.current_units.visibility;
                const rawVisibility = data.current.visibility;
                let calculatedValue = (this.stg.units.distance.toLowerCase() === 'mi')
                    ? (apiUnit === 'ft' ? (rawVisibility / 5280) : (rawVisibility / 1609.34))
                    : (apiUnit === 'ft' ? (rawVisibility / 3280.84) : (rawVisibility / 1000));

                this.stg.weather.current.visibility = calculatedValue.toFixed(1);

                const rawPressure = data.current.pressure_msl;
                const pressureApiUnit = data.current_units.pressure_msl.toLowerCase();
                const finalPressure = (this.stg.units.pressure.toLowerCase() === 'inch' && pressureApiUnit === 'hpa')
                    ? (rawPressure * 0.02953).toFixed(2)
                    : rawPressure.toFixed(1);

                this.stg.weather.current.pressure = finalPressure;

                const apiTime = data.current.time;
                let lastUpdateString = this.stg.weather.current.lastUpdate;

                if (apiTime !== this.previousApiTime) {
                    this.previousApiTime = apiTime;
                    lastUpdateString = new Date().toLocaleString('en-US', {
                        hour12: true, hour: 'numeric', minute: 'numeric'
                    });
                }
                this.stg.weather.current = {
                    ...this.stg.weather.current,
                    temp: Math.round(data.current.temperature_2m),
                    visibility: this.stg.weather.current.visibility,
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
                    lastUpdate: lastUpdateString
                };

                const forecastBuffer = data.daily.time.slice(0, 3).map((date, i) => {
                    const dayCond = this.interpretWMO(data.daily.weather_code[i]);
                    return {
                        name: i === 0 ? 'Today' : new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }),
                        high: Math.round(data.daily.temperature_2m_max[i]),
                        low: Math.round(data.daily.temperature_2m_min[i]),
                        precip: data.daily.precipitation_probability_max[i],
                        icon: dayCond.icon
                    };
                });

                requestAnimationFrame(() => {
                    this.stg.weather.forecast = forecastBuffer;
                    this.shared.weatherIcon = condition.icon;
                    this.stg.weather.icon = condition.icon;
                    this.loading = false;
                });

            } catch (error) {
                console.error("Network or Parsing failure:", error);
                this.loading = false;
            }
        },
        getWindDir(deg) {
            const sectors = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            return sectors[Math.round(deg / 45) % 8];
        },
        interpretWMO(code) {
            if (code >= 71 && code <= 77 && temp > 40) {
                return { text: 'Heavy Rainy', icon: 'mdi-weather-pour' };
            }

            if (code === 0) return { text: 'Clear', icon: 'mdi-weather-sunny' };
            if (code === 1) return { text: 'Mainly Clear', icon: 'mdi-weather-partly-cloudy' };
            if (code === 2) return { text: 'Partly Cloudy', icon: 'mdi-weather-partly-cloudy' };
            if (code === 3) return { text: 'Overcast', icon: 'mdi-weather-cloudy' };
            if (code >= 45 && code <= 48) return { text: 'Foggy', icon: 'mdi-weather-fog' };
            if (code >= 51 && code <= 67) return { text: 'Rainy', icon: 'mdi-weather-rainy' };
            if (code >= 71 && code <= 77) return { text: 'Snowy', icon: 'mdi-weather-snowy' };
            if (code >= 95) return { text: 'Stormy', icon: 'mdi-weather-lightning' };
            return { text: 'Overcast', icon: 'mdi-weather-cloudy' };
        }
    },
};
</script>

<style scoped>
.weather-card {
    width: 100%;
    padding: 0 14px 16px;
    background:
        linear-gradient(180deg, rgba(14, 165, 233, 0.12), transparent 34%),
        rgba(15, 23, 42, 0.78);
    color: #e5eefb;
}

.weather-hero {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin: 2px 0 12px;
    padding: 18px 4px 4px;
}

.weather-icon-wrap {
    display: grid;
    width: 48px;
    height: 48px;
    place-items: center;
    border: 1px solid rgba(125, 211, 252, 0.22);
    border-radius: 16px;
    background: rgba(8, 47, 73, 0.48);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.condition-text {
    color: #f8fafc;
    font-size: 1.08rem;
    font-weight: 800;
    line-height: 1.1;
}

.source-text {
    margin-top: 4px;
    color: #8fa3b8;
    font-size: 0.66rem;
    line-height: 1;
}

.temp-readout {
    color: #f8fafc;
    font-size: 2.32rem;
    font-weight: 900;
    letter-spacing: -0.06em;
    line-height: 1;
}

.summary-strip {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 14px;
    padding: 8px 10px;
    border: 1px solid rgba(148, 163, 184, 0.14);
    border-radius: 14px;
    background: rgba(2, 6, 23, 0.28);
    color: #cbd5e1;
    font-size: 0.74rem;
    font-weight: 800;
}

.high-temp {
    color: #fdba74;
}

.low-temp {
    color: #93c5fd;
}

.metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
}

.metric-cell {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    min-height: 52px;
    padding: 8px 10px;
    gap: 8px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    border-radius: 14px;
    background: rgba(15, 23, 42, 0.64);
}

.metric-cell .label {
    display: flex;
    min-width: 30px;
    justify-content: center;
}


.val {
    color: #e2e8f0;
    font-size: 0.76rem;
    font-weight: 700;
    font-family: 'Roboto Mono', monospace;
}

.forecast-grid {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.forecast-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 94px;
    margin: 0 4px;
    padding: 10px 4px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    border-radius: 14px;
    background: rgba(2, 6, 23, 0.24);
}

.forecast-day {
    max-width: 100%;
    margin-bottom: 5px;
    overflow: hidden;
    color: #cbd5e1;
    font-size: 0.68rem;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.forecast-temp {
    margin-top: 5px;
    color: #f8fafc;
    font-size: 0.75rem;
    font-weight: 900;
}

.forecast-temp span,
.forecast-precip {
    color: #94a3b8;
    font-weight: 700;
}

.forecast-precip {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 4px;
    font-size: 0.72rem;
    line-height: 1;
}
</style>
