// src/pages/CampaignDetail.jsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchCampaignDetails } from "../utils/contract";
import { ethers } from "ethers";
import { useStateContext } from "../context";

export default function CampaignDetail() {
  const { address } = useParams();
  const { provider } = useStateContext();
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCampaign() {
      if (!provider) {
        console.warn("Provider is not available. Please connect your wallet.");
        setIsLoading(false);
        return;
      }
      try {
        const campaignDetails = await fetchCampaignDetails(address, provider);
        setDetails(campaignDetails);
      } catch (err) {
        console.error("Error loading campaign:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCampaign();
  }, [address, provider]);

  if (isLoading) return <p>Loading campaign details...</p>;
  if (!details) return <p>Campaign not found or failed to load.</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Campaign Details</h2>
      <p><b>Address:</b> {address}</p>
      <p><b>Creator:</b> {details.creator}</p>
      <p><b>Goal:</b> {ethers.formatEther(details.goal)} ETH</p>
      <p><b>Total Contributed:</b> {ethers.formatEther(details.totalContributed)} ETH</p>
      <p><b>Deadline:</b> {new Date(Number(details.deadline) * 1000).toLocaleString()}</p>
    </div>
  );
}