import axios from "axios";
const isLocal = window.location.hostname === "localhost";


const axiosClient =  axios.create({
    baseURL: isLocal
    ? "http://localhost:3000" :'https://codingplatform4.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});


export default axiosClient;