import axios from "axios";
const isLocal = window.location.hostname === "localhost";


const axiosClient =  axios.create({
    baseURL:  "http://localhost:3001",
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});


export default axiosClient;