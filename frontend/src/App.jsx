import {Routes,Route, Navigate} from 'react-router';
import Homepage from  "./pages/home";
 

function App(){
  return (
    <Routes>
      <Route path="/" element={<Homepage/>}/>
    </Routes>
  )
}

export default App;