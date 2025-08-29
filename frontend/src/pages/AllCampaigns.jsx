import { useEffect, useState } from "react";
import { getContract } from "../utils/contract";
import { Link } from "react-router-dom";

export default function AllCampaigns() {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const contract = getContract();
        const all = await contract.allCampaigns();
        setCampaigns(all);
      } catch (err) {
        console.error(err);
      }
    };
    loadCampaigns();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">All Campaigns</h2>
      <ul className="mt-4">
        {campaigns.map((addr, i) => (
          <li key={i} className="my-2">
            <Link to={`/campaign/${addr}`} className="text-blue-500">
              {addr}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
