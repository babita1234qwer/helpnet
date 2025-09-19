import {Routes,Route, Navigate} from 'react-router';
import Homepage from  "./pages/home";
import Login from './pages/login';
import { checkAuth } from './authslice.js';
import { useDispatch,useSelector } from 'react-redux';
import { useEffect } from 'react';
import Signup from "./pages/signup";
import EmergencyRequest from "./pages/EmergencyRequest.jsx";
import EmergencyForm from './pages/emergencyForm.jsx';
 import EmergenciesPage from "./pages/EmergenciesPage.jsx";
import EmergencyMapPage from './pages/EmergencyMapPage';
function App(){
  const {isAuthenticated,user,loading} = useSelector((state) => state.auth);
 const dispatch = useDispatch();
useEffect(() => {
  dispatch(checkAuth())},[dispatch]);
 
  return (
    <Routes>
      <Route path="/" element={<Homepage/>}/>
       <Route path="/user/login" element={ isAuthenticated?<Navigate to="/"/>:<Login></Login>} />
      <Route path="/user/register" element={ isAuthenticated?<Navigate to="/"/>:<Signup></Signup>} />
      <Route path="/emergency/create" element={<EmergencyRequest></EmergencyRequest>} />
              <Route path="/emergency/page" element={<EmergenciesPage />} />
                      <Route path="/emergency/create" element={<EmergencyForm />} />
<Route path="/emergency/map" element={<EmergencyMapPage />} />

    </Routes>
  )
}

export default App;