import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

window.storage = {
  get: async (key) => {
    const val = localStorage.getItem(key);
    return val !== null ? { value: val } : null;
  },
  set: async (key, value) => {
    localStorage.setItem(key, value);
  },
  delete: async (key) => {
    localStorage.removeItem(key);
  },
  list: async () => {
    return { keys: Object.keys(localStorage) };
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
