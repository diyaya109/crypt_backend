// src/pages/CampaignList.jsx
import React, { useEffect, useState } from "react";
import { getFactory } from "../utils/contract";
import { ethers } from "ethers";

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch existing campaigns
  const loadCampaigns = async () => {
    try {
      const factory = getFactory();
      const all = await factory.allCampaigns();
      setCampaigns(all);
    } catch (err) {
      console.error("Error loading campaigns:", err);
    }
  };

  // Create a new campaign
  const handleCreate = async () => {
    try {
      setLoading(true);
      const factory = getFactory();

      const metaURI = "ipfs://testMetaURI"; // placeholder, replace with real IPFS later
      const goal = ethers.parseEther("0.1"); // fundraising goal (0.1 ETH for test)
      const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days from now

      const tx = await factory.createCampaign(metaURI, goal, deadline);
      await tx.wait();

      console.log("✅ Campaign created!");
      loadCampaigns(); // refresh after creation
    } catch (err) {
      console.error("Error creating campaign:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Campaigns</h1>

      <button
        onClick={handleCreate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create New Campaign"}
      </button>

      <ul className="mt-6 space-y-2">
        {campaigns.length === 0 && <p>No campaigns yet.</p>}
        {campaigns.map((addr, i) => (
          <li
            key={i}
            className="p-3 bg-gray-100 rounded-lg border text-gray-800"
          >
            {addr}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CampaignList;
