// import logo from './logo.svg';
import './App.css';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom' 
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeetComponent from './pages/videoMeet';
import HomeComponent from './pages/home';
import History from './pages/history';

function App() {
  return (
    <>
    <Router>
      <AuthProvider>
      <Routes>
        <Route path='/' element={<LandingPage/>}/>
        <Route path='/home' element={<HomeComponent/>}/>
        <Route path='/auth' element={<Authentication/>}/>
        <Route path="/:url" element={<VideoMeetComponent/>}/>
        <Route path='/history' element= {<History/>} />
      </Routes>
      </AuthProvider>
    </Router>
    </>
  );
}

export default App;
