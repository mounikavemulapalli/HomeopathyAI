/** @format */

// /** @format */

// import React, { useState, useEffect } from "react"; // <-- Import useState and useEffect
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Hero from "./pages/Hero";
// import CaseSheetForm from "./Components/CaseSheetForm";
// import CasesList from "./Components/CasesList";
// import Navbar from "./pages/Navbar";
// import Footer from "./pages/Footer";
// import SkinAnalyzer from "./pages/SkinAnalyzer";
// import ContactUs from "./Components/contact";
// import AboutUs from "./Components/Aboutus";
// import Register from "./Components/Register";
// import Login from "./Components/Login";
// import TodayFollowUps from "./Components/TodayFollowUps";
// import FollowUps from "./Components/FollowUps";
// import FollowUpPage from "./Components/FollowUpPage";
// import FollowUpForm from "./Components/FollowUpForm";
// import Dashboard from "./Components/Dashboard";
// import SplashScreen from "./Components/SplashScreen";

// function App() {
//   const [loading, setLoading] = useState(true);
//   const [showSplash, setShowSplash] = useState(true);
//   useEffect(() => {
//     const timer = setTimeout(() => setLoading(false), 3000); // 3 seconds
//     return () => clearTimeout(timer);
//   }, []);

//   if (loading) {
//     return <SplashScreen onFinish={() => console.log("Splash finished")} />; // Show splash screen while loading
//   }

//   return (
//     <Router>
//       <Navbar />
//       <Routes>
//         <Route path='/' element={<Hero />} />
//         <Route path='/image' element={<SkinAnalyzer />} />
//         <Route path='/addcase' element={<CaseSheetForm />} />
//         <Route path='/cases' element={<CasesList />} />
//         <Route path='/contact' element={<ContactUs />} />
//         <Route path='/about' element={<AboutUs />} />
//         <Route path='/Register' element={<Register />} />
//         <Route path='/Login' element={<Login />} />
//         <Route path='/followup' element={<FollowUpPage />} />
//         <Route path='/followups/:id' element={<FollowUpForm />} />
//         <Route path='/todayfollowups' element={<TodayFollowUps />} />
//         <Route path='/followups' element={<FollowUps />} />
//         <Route path='/dashboard' element={<Dashboard />} />
//       </Routes>
//       <Footer />
//     </Router>
//   );
// }

// export default App;
/** @format */

import React, { useState, useEffect } from "react";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Hero from "./pages/Hero";
import CaseSheetForm from "./Components/CaseSheetForm";
import CasesList from "./Components/CasesList";
import Navbar from "./pages/Navbar";
import Footer from "./pages/Footer";
import SkinAnalyzer from "./pages/SkinAnalyzer";
import ContactUs from "./Components/Aboutus";
import AboutUs from "./Components/Aboutus";
import Register from "./Components/Register";
import Login from "./Components/Login";
import TodayFollowUps from "./Components/TodayFollowUps";
import FollowUps from "./Components/FollowUps";
import FollowUpPage from "./Components/FollowUpPage";
import FollowUpForm from "./Components/FollowUpForm";
import Dashboard from "./Components/Dashboard";
import SplashScreen from "./Components/SplashScreen";

function App() {
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // 🚀 యాప్ బ్యాకెండ్/ఏదైనా డేటా లోడ్ అవ్వడానికి పట్టే టైమ్ (ఉదాహరణకి 3 సెకన్లు)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // 🚀 యూజర్ రిక్వైర్మెంట్ కండిషన్:
  // యాప్ బ్యాకెండ్ లోడింగ్ పూర్తి అవ్వాలి (loading === false)
  // మరియు స్ప్లాష్ స్క్రీన్ వీడియో కూడా కంప్లీట్ అవ్వాలి (showSplash === false)
  // ఈ రెండూ జరిగేంత వరకు స్ప్లాష్ స్క్రీన్ కనిపిస్తూనే ఉంటుంది.
  if (loading || showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (




    <Router>
      <React.Fragment>

      <Navbar />
      <Routes>
        <Route path='/' element={<Hero />} />
        <Route path='/image' element={<SkinAnalyzer />} />
        <Route path='/addcase' element={<CaseSheetForm />} />
        <Route path='/cases' element={<CasesList />} />
        <Route path='/contact' element={<ContactUs />} />
        <Route path='/about' element={<AboutUs />} />
        <Route path='/Register' element={<Register />} />
        <Route path='/Login' element={<Login />} />
        <Route path='/followup' element={<FollowUpPage />} />
        <Route path='/followups/:id' element={<FollowUpForm />} />
        <Route path='/todayfollowups' element={<TodayFollowUps />} />
        <Route path='/followups' element={<FollowUps />} />
        <Route path='/dashboard' element={<Dashboard />} />
      </Routes>
      </React.Fragment>
      <Footer />

    </Router>
  );
}

export default App;
