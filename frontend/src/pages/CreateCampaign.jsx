import React, { useState } from "react";
import { getFactory } from "../utils/contract";
import { ethers } from "ethers";

function CreateCampaign() {
  const [minContribution, setMinContribution] = useState("");

  async function handleCreate() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factory = getFactory(signer);

      const tx = await factory.createCampaign(
        ethers.parseUnits(minContribution, "wei")
      );
      await tx.wait();

      alert("✅ Campaign Created!");
    } catch (err) {
      console.error(err);
      alert("❌ Error creating campaign");
    }
  }

  return (
    <div className="flex justify-center mt-10">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Create Campaign
        </h2>
        <input
          type="text"
          className="border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          placeholder="Minimum Contribution (wei)"
          value={minContribution}
          onChange={(e) => setMinContribution(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 w-full rounded-lg hover:bg-blue-700 transition"
          onClick={handleCreate}
        >
          Create
        </button>
      </div>
    </div>
  );
}

export default CreateCampaign;
