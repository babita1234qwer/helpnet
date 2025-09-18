import axiosClient from "../utils/axiosclient";

function EmergencyCard({ emergency }) {
  const handleRespond = async () => {
    try {
      await axiosClient.post(`/emergency/${emergency._id}/respond`);
      alert("✅ You have responded to this emergency!");
    } catch (err) {
      alert(err.response?.data?.message || "❌ Failed to respond");
    }
  };

  return (
    <div className="bg-neutral-800 p-4 rounded-lg text-white shadow-md">
      <h3 className="text-xl font-bold capitalize">{emergency.emergencyType}</h3>
      <p className="text-gray-300">{emergency.description}</p>
      <p className="text-sm text-gray-500 mt-1">
        📍 {emergency?.location?.address || "Unknown location"}
      </p>

      <button
        onClick={handleRespond}
        className="mt-3 bg-green-500 hover:bg-green-400 px-4 py-2 rounded-lg font-semibold"
      >
        🚑 Respond
      </button>
    </div>
  );
}

export default EmergencyCard;
