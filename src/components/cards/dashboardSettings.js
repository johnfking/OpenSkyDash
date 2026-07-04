import { reactive } from 'vue'

const defaultSettings = reactive({
  
  
  units: {
    distance: 'mi', 
    temperature: 'f', 
    pressure: 'inch', 
    wind: 'mph', 
    time: 'locale', 
    timeFormat: '12', 
  },

  
  lightning: {
    shouldConnect: true,
    searchRadius: 50,
    alertThreshold: 25,
    homeLocation: { lat: 34.05, lon: -118.24 }, 

    
    
    isMuted: false,
    showModal: false,
    ui: {
      activeTab: 'general',
      expandedPanel: null,
    },

    
    sampleSize: 20, 
    resetTime: 5,

    currentStorm: { distance: 0, bearing: 0, trend: 'Stationary', frequency: 0 },
    history: [],
    lastStrikeTimestamp: 0,

    authKey: null,
    wssServers: [8, 7, 2, 1],
    currentServerIndex: 0,
    calculationMethods: ['Closest Strike (Fastest)', 'Average (Smoother)', 'Percentile (Balanced)'],
    selectedMethod: 'Closest Strike (Fastest)',
    sensitivity: 5,
  },

  
  weather: {
    updateInterval: 300, 
    current: {
      temp: 0,
      feelsLike: 0,
      humidity: 0,
      windSpeed: 0,
      windDir: '',
      gusts: 0,
      pressure: 0,
      clouds: 0,
      visibility: 0,
      uv: 0,
      high: 0,
      low: 0,
      conditionText: '',
      dewPoint: 0,
      lastUpdate: 0,
    },
    alert: null,
    forecast: [],
  },

  solar: {
    shouldConnect: true,
    current: {
      geoMagnetic: { aIndex: 0, kIndex: 0, flux: 0 },
      ionosphere: {
        fof2: 8.01,
        hmf2: 262,
        mufd: 24.7,
        ts: 1777562100,
      },
      scales: {
        current: { r: 0, s: 0, g: 0 },
        probabilities: { rMinor: 65, rMajor: 10, sStorm: 10 },
      },
    },
  },

  ui: {
    showAttribution: true,
    activeTab: 'settings',
    
    appName: 'SkyDash',
    callsign: 'W8BE',
    grid: 'DM04TE',
  },
})


const saved = localStorage.getItem('station_config_v1')
let initialState = defaultSettings

if (saved) {
  try {
    const parsed = JSON.parse(saved)
    
    initialState.units = { ...defaultSettings.units, ...parsed.units }
    initialState.lightning = { ...defaultSettings.lightning, ...parsed.lightning }
    initialState.weather = { ...defaultSettings.weather, ...parsed.weather }
    initialState.ui = { ...defaultSettings.ui, ...parsed.ui }
  } catch (e) {
    console.error('Hydration failed', e)
  }
}

export const settings = reactive(initialState)
