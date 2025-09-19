import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const EmergencyMap = ({ emergencies }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapInstanceRef.current) {
      // Initialize map
      mapInstanceRef.current = L.map(mapRef.current).setView([40.7128, -74.0060], 10);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add markers for each emergency
    if (emergencies && emergencies.length > 0) {
      // Fit map to show all emergencies
      const group = new L.featureGroup();
      
      emergencies.forEach(emergency => {
        if (emergency.location && emergency.location.coordinates) {
          const [lng, lat] = emergency.location.coordinates;
          
          // Create custom icon based on emergency type
          let iconColor = 'red';
          if (emergency.emergencyType === 'medical') iconColor = 'blue';
          else if (emergency.emergencyType === 'fire') iconColor = 'orange';
          else if (emergency.emergencyType === 'accident') iconColor = 'yellow';
          else if (emergency.emergencyType === 'crime') iconColor = 'purple';
          
          const marker = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: `<div style="background-color: ${iconColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          }).addTo(mapInstanceRef.current);
          
          // Add popup with emergency details
          marker.bindPopup(`
            <div>
              <h3>${emergency.emergencyType.toUpperCase()}</h3>
              <p>${emergency.description}</p>
              <p><strong>Status:</strong> ${emergency.status}</p>
              <a href="/emergency/${emergency._id}" style="color: #2563eb; text-decoration: none;">View Details</a>
            </div>
          `);
          
          markersRef.current.push(marker);
          group.addLayer(marker);
        }
      });
      
      if (emergencies.length > 0) {
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    }

    return () => {
      // Cleanup is handled when markers are cleared
    };
  }, [emergencies]);

  return <div ref={mapRef} style={{ height: '500px', width: '100%' }} />;
};

export default EmergencyMap; 