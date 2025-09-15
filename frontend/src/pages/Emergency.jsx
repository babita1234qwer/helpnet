import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api"; // Update with your backend URL
const MAPBOX_TOKEN = "YOUR_MAPBOX_ACCESS_TOKEN"; // Replace with your Mapbox token

export default function Emergency() {
  const [emergencies, setEmergencies] = useState([]);
  const [form, setForm] = useState({
    emergencyType: "",
    description: "",
    place: "",
  });
  const [loading, setLoading] = useState(false);

  // Fetch active emergencies
  useEffect(() => {
    axios
      .get(`${API_BASE}/emergencies/active`)
      .then((res) => setEmergencies(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  // Geocode place name to lat/long
  const geocodePlace = async (place) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json`;
    const res = await axios.get(url, {
      params: {
        access_token: MAPBOX_TOKEN,
        limit: 1,
      },
    });
    if (res.data.features && res.data.features.length > 0) {
      const coords = res.data.features[0].geometry.coordinates;
      return { longitude: coords[0], latitude: coords[1], address: res.data.features[0].place_name };
    }
    throw new Error("Location not found");
  };

  // Create emergency
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const geo = await geocodePlace(form.place);
      const payload = {
        emergencyType: form.emergencyType,
        description: form.description,
        longitude: geo.longitude,
        latitude: geo.latitude,
      };
      const res = await axios.post(`${API_BASE}/emergencies`, payload, {
        headers: { Authorization: "Bearer YOUR_TOKEN" }, // Add auth if needed
      });
      alert("Emergency created!");
      setEmergencies([res.data.data, ...emergencies]);
      setForm({ emergencyType: "", description: "", place: "" });
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  // Respond to emergency
  const respond = async (id) => {
    try {
      await axios.post(`${API_BASE}/emergencies/${id}/respond`, {}, {
        headers: { Authorization: "Bearer YOUR_TOKEN" },
      });
      alert("Responded!");
    } catch (err) {
      alert("Error responding");
    }
  };

  return (
    <div>
      <h2>Create Emergency</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Type"
          value={form.emergencyType}
          onChange={(e) => setForm({ ...form, emergencyType: e.target.value })}
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          placeholder="Place name (e.g. Delhi)"
          value={form.place}
          onChange={(e) => setForm({ ...form, place: e.target.value })}
        />
        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</button>
      </form>

      <h2>Active Emergencies</h2>
      <ul>
        {emergencies.map((em) => (
          <li key={em._id}>
            <b>{em.emergencyType}</b>: {em.description} at {em.location?.address}
            <button onClick={() => respond(em._id)}>Respond</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
