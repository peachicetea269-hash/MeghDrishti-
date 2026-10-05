// Base API service
// Override by setting VITE_API_BASE_URL in a .env.local file
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const fetchPrediction = async ({ latitude, longitude, location_name }) => {
  const url = `${BASE_URL}/api/predictions?latitude=${latitude}&longitude=${longitude}&location_name=${encodeURIComponent(location_name)}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    let errorDetail = "Failed to fetch prediction";
    try {
      const errorData = await response.json();
      if (Array.isArray(errorData.detail)) {
        errorDetail = errorData.detail.map(e => e.msg).join(", ");
      } else if (errorData.detail) {
        errorDetail = errorData.detail;
      }
    } catch (e) {}
    throw new Error(errorDetail);
  }
  
  return response.json();
};

export const fetchGeocode = async (query) => {
  const url = `${BASE_URL}/api/geocode?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    let errorDetail = "Failed to fetch location";
    try {
      const errorData = await response.json();
      if (Array.isArray(errorData.detail)) {
        errorDetail = errorData.detail.map(e => e.msg).join(", ");
      } else if (errorData.detail) {
        errorDetail = errorData.detail;
      }
    } catch (e) {}
    throw new Error(errorDetail);
  }
  
  return response.json();
};

export const fetchReliability = async (location_name) => {
  const url = `${BASE_URL}/api/reliability?location_name=${encodeURIComponent(location_name)}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    let errorDetail = "Failed to fetch reliability";
    try {
      const errorData = await response.json();
      if (Array.isArray(errorData.detail)) {
        errorDetail = errorData.detail.map(e => e.msg).join(", ");
      } else if (errorData.detail) {
        errorDetail = errorData.detail;
      }
    } catch (e) {}
    throw new Error(errorDetail);
  }
  
  return response.json();
};

export const fetchRegionalConfidence = async (forecastDays = 10) => {
  const url = `${BASE_URL}/api/regional-confidence?forecast_days=${forecastDays}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    let errorDetail = "Failed to fetch regional forecast risk";
    try {
      const errorData = await response.json();
      if (Array.isArray(errorData.detail)) {
        errorDetail = errorData.detail.map(e => e.msg).join(", ");
      } else if (errorData.detail) {
        errorDetail = errorData.detail;
      }
    } catch (e) {}
    throw new Error(errorDetail);
  }
  
  return response.json();
};
