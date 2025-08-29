import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getCampaign } from "../utils/contract";
import { ethers } from "ethers";

export default function CampaignDetail() {
  const { address } = useParams();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function loadCampaign() {
      try {
        if (!window.ethereum) throw new Error("MetaMask not found");

        const provider = new ethers.BrowserProvider(window.ethereum);
        const campaign = getCampaign(address, provider);

        // Example: assuming your Campaign contract has getSummary()
        const campaignSummary = await campaign.getSummary();
        setSummary(campaignSummary);
      } catch (err) {
        console.error("Error loading campaign:", err);
      }
    }
    loadCampaign();
  }, [address]);

  if (!summary) return <p>Loading campaign...</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Campaign Details</h2>
      <p><b>Address:</b> {address}</p>
      <p><b>Minimum Contribution:</b> {summary[0]?.toString()}</p>
      <p><b>Balance:</b> {ethers.formatEther(summary[1] || "0")} ETH</p>
      <p><b>Requests Count:</b> {summary[2]?.toString()}</p>
      <p><b>Approvers Count:</b> {summary[3]?.toString()}</p>
      <p><b>Manager:</b> {summary[4]}</p>
    </div>
  );
}
