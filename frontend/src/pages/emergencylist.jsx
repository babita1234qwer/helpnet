import { useEffect, useState } from "react";
import axiosClient from "../utils/axiosclient";
import EmergencyCard from "./emergencycard"

function EmergencyList() {
  const [emergencies, setEmergencies] = useState([]);

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const res = await axiosClient.get("/emergency/all"); // 👈 backend route
        setEmergencies(res.data.emergencies || []);
      } catch (err) {
        console.error("Error fetching emergencies", err);
      }
    };

    fetchEmergencies();
  }, []);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {emergencies.length > 0 ? (
        emergencies.map((em) => <EmergencyCard key={em._id} emergency={em} />)
      ) : (
        <p className="text-gray-400">🚨 No emergencies reported yet.</p>
      )}
    </div>
  );
}

export default EmergencyList;
