import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./pages/Navbar";
import CampaignList from "./pages/CampaignList";
import CreateCampaign from "./pages/CreateCampaign";

function App() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6">
        <Routes>
          <Route path="/" element={<CampaignList />} />
          <Route path="/create" element={<CreateCampaign />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
