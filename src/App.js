import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

// Daftar kota
const cityList = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Yogyakarta', 'Bali', 'Semarang', 'Makassar', 'Palembang', 'Batam'];

// Component definitions
const WeatherCard = ({ weather, currentTime, unit }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="weather-card">
      <div className="weather-main">
        <h2 className="location">{weather.location.name}</h2>
        <div className="temperature">
          {Math.round(weather.current.temp_c)}°
        </div>
        <p className="condition">{weather.current.condition.text}</p>
        <div className="high-low">
          <span>H: {Math.round(weather.forecast.forecastday[0].day.maxtemp_c)}°</span>
          <span>L: {Math.round(weather.forecast.forecastday[0].day.mintemp_c)}°</span>
        </div>
      </div>
    </div>
  );
};

const HourlyForecast = ({ weather, unit }) => {
  const currentHour = new Date().getHours();
  
  // Get today's and tomorrow's hours
  const todayHours = weather.forecast.forecastday[0].hour
    .filter(hour => {
      const hourTime = new Date(hour.time).getHours();
      return hourTime >= currentHour;
    });

  // Add tomorrow's early hours if needed
  const tomorrowHours = weather.forecast.forecastday[1].hour
    .filter(hour => {
      const hourTime = new Date(hour.time).getHours();
      return hourTime < currentHour;
    });

  // Combine today's remaining hours with tomorrow's early hours
  const displayHours = [...todayHours, ...tomorrowHours].slice(0, 24);

  return (
    <div className="hourly-forecast">
      <h3>Hourly Forecast</h3>
      <div className="hours-grid">
        {displayHours.map((hour, index) => (
          <div key={index} className="hour-item">
            <span className="hour-time">
              {new Date(hour.time).getHours()}:00
            </span>
            <img 
              src={hour.condition.icon} 
              alt={hour.condition.text}
              className="hour-icon"
            />
            <span className="hour-temp">
              {Math.round(hour.temp_c)}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DailyForecast = ({ weather, onDayClick }) => {
  return (
    <div className="ten-day-forecast">
      <h3>3-Day Forecast</h3>
      {weather.forecast.forecastday.map((day, index) => (
        <div key={index} className="day-forecast" onClick={() => onDayClick(day)}>
          <div className="day-date">
            <span className="weekday">
              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
            </span>
            <span className="date">
              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <img src={day.day.condition.icon} alt={day.day.condition.text} />
          <span className="max-temp">{Math.round(day.day.maxtemp_c)}°</span>
          <span className="min-temp">{Math.round(day.day.mintemp_c)}°</span>
        </div>
      ))}
    </div>
  );
};

const About = () => {
  return (
    <div className="about-section">
      <div className="about-content">
        <div className="feature-grid">
          <div className="feature-card">
            <i className="fas fa-cloud-sun-rain"></i>
            <h4>Real-Time Forecast</h4>
            <p>Get up-to-the-minute weather information with high accuracy and automatic updates</p>
          </div>
          
          <div className="feature-card">
            <i className="fas fa-calendar-week"></i>
            <h4>3-Day Forecast</h4>
            <p>Plan your activities with detailed weather forecasts for the next 3 days</p>
          </div>

          <div className="feature-card">
            <i className="fas fa-map-marked-alt"></i>
            <h4>Automatic Location</h4>
            <p>Automatic location detection to get weather information wherever you are</p>
          </div>
          
          <div className="feature-card">
            <i className="fas fa-chart-bar"></i>
            <h4>Complete Data</h4>
            <p>Detailed information including temperature, humidity, wind speed, and rain probability</p>
          </div>
        </div>

        <div className="about-description">
          <p>
            Weathery is a modern weather forecast application that combines cutting-edge technology with 
            an intuitive interface. Designed to provide accurate and easy-to-understand weather information, 
            helping you better plan your activities.
          </p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  // Add this at the beginning of your App component
  useEffect(() => {
    const createRain = () => {
      const rainContainer = document.body;
      const raindrop = document.createElement('div');
      raindrop.classList.add('rain');
      
      // Random positioning and timing
      raindrop.style.left = Math.random() * window.innerWidth + 'px';
      raindrop.style.animationDuration = Math.random() * 1 + 0.5 + 's';
      raindrop.style.opacity = Math.random() * 0.3 + 0.2;
      
      rainContainer.appendChild(raindrop);
      
      // Remove raindrop after animation
      setTimeout(() => {
        raindrop.remove();
      }, 2000);
    };

    // Create rain drops
    const rainInterval = setInterval(createRain, 20);

    return () => clearInterval(rainInterval);
  }, []);

  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAbout, setShowAbout] = useState(false);
  const [theme, setTheme] = useState('light');
  const [unit, setUnit] = useState('C');
  const [error, setError] = useState(null);
  const [allCities, setAllCities] = useState([]);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
  
    if ("geolocation" in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
        
        const lat = position.coords.latitude.toFixed(4);
        const lon = position.coords.longitude.toFixed(4);
        
        const response = await axios.get(
          `https://api.weatherapi.com/v1/forecast.json?key=519bcb1997d24256906120719242212&q=${lat},${lon}&days=3&aqi=yes&alerts=yes`
        );
        setWeather(response.data);
        setCity(response.data.location.name);
      } catch (error) {
        console.error('Error getting location:', error);
        // Jika gagal mendapatkan lokasi, gunakan Jakarta sebagai default
        fetchDefaultWeather();
      } finally {
        setLocationLoading(false);
      }
    } else {
      console.log('Geolocation tidak didukung');
      fetchDefaultWeather();
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    // Coba dapatkan lokasi pengguna saat pertama kali membuka web
    getCurrentLocation();
    
    // Update waktu setiap detik
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      const cities = await fetchCities();
      console.log(cities); // Tambahkan log untuk memeriksa hasil
      setAllCities(cities);
    };
    loadCities();
  }, []);

  const fetchDefaultWeather = async () => {
    try {
      const response = await axios.get(
        `https://api.weatherapi.com/v1/forecast.json?key=519bcb1997d24256906120719242212&q=Jakarta&days=3&aqi=yes&alerts=yes`
      );
      setWeather(response.data);
    } catch (error) {
      console.error('Error fetching default weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async () => {
    if (!city.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.weatherapi.com/v1/forecast.json?key=519bcb1997d24256906120719242212&q=${city.trim()}&days=3&aqi=yes&alerts=yes`
      );
      setWeather(response.data);
    } catch (error) {
      alert('Error fetching weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCity('');
    setWeather(null);
    setLoading(false);
  };

  // Add handleLogoClick function
  const handleLogoClick = () => {
    setCity('');
    setWeather(null);
    setLoading(false);
    fetchDefaultWeather(); // Fetch Jakarta weather again
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  const fetchCities = async () => {
    try {
      const response = await axios.get('http://api.geonames.org/citiesJSON?username=fishevo&maxRows=10000');
      return response.data.geonames.map(city => city.name);
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  };

  return (
    <Router>
      <div className="weather-app">
        <nav className="nav-bar">
          <Link to="/" className="logo" onClick={handleLogoClick}>
            <i className="fas fa-cloud-sun"></i>
            Weathery
          </Link>
          <div className="search-container">
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search City..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchWeather()}
              />
            </div>
          </div>
          <nav className="nav-menu">
            <Link to="/about" className="menu-item">
              <i className="fas fa-info-circle"></i>
              About
            </Link>
          </nav>
        </nav>
        
        <Routes>
          <Route path="/" element={
            <div className="weather-container">
              {loading || locationLoading ? (
                <div className="loader">
                  <div className="loading-spinner"></div>
                  <p>Loading weather information...</p>
                </div>
              ) : error ? (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  <p>{error}</p>
                </div>
              ) : weather ? (
                <>
                  <WeatherCard weather={weather} currentTime={currentTime} unit={unit} />
                  <HourlyForecast weather={weather} unit={unit} />
                  <DailyForecast weather={weather} onDayClick={handleDayClick} />
                </>
              ) : null}
            </div>
          } />
          <Route path="/about" element={<About />} />
        </Routes>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-left">
              <div className="footer-logo">
                <i className="fas fa-cloud-sun"></i>
                <span>Weathery</span>
              </div>
              <p className="footer-copyright">&copy; 2024 All rights reserved</p>
            </div>
            
            <div className="footer-center">
              <p className="footer-attribution">Powered by WeatherAPI.com</p>
            </div>
            
            <div className="footer-right">
              <div className="social-links">
                <a href="https://github.com/dutaalamin/weathery/" className="social-link" aria-label="GitHub">
                  <i className="fab fa-github"></i>
                </a>
                <a href="https://www.linkedin.com/in/duta-alamin/" className="social-link" aria-label="LinkedIn">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="https://www.instagram.com/dutalmn/" className="social-link" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* Day Detail Modal */}
        {selectedDay && (
          <>
            <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
              <div className="day-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{new Date(selectedDay.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</h3>
                  <button onClick={() => setSelectedDay(null)}>×</button>
                </div>
                <div className="modal-content">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <h4>Temperature</h4>
                      <p>Max: {Math.round(selectedDay.day.maxtemp_c)}°</p>
                      <p>Min: {Math.round(selectedDay.day.mintemp_c)}°</p>
                      <p>Avg: {Math.round(selectedDay.day.avgtemp_c)}°</p>
                    </div>
                    <div className="detail-item">
                      <h4>Conditions</h4>
                      <img src={selectedDay.day.condition.icon} alt={selectedDay.day.condition.text} />
                      <p>{selectedDay.day.condition.text}</p>
                    </div>
                    <div className="detail-item">
                      <h4>Details</h4>
                      <p>Humidity: {selectedDay.day.avghumidity}%</p>
                      <p>Rain Chance: {selectedDay.day.daily_chance_of_rain}%</p>
                      <p>Wind: {selectedDay.day.maxwind_kph} km/h</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Router>
  );
};

export default App;
