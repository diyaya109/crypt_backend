import React, { useEffect, useState } from "react";
import API from "./api";

function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");

  // Fetch campaigns from backend
  const fetchCampaigns = async () => {
    try {
      const res = await API.get("/campaigns");
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Create campaign
  const createCampaign = async () => {
    try {
      await API.post("/campaigns", { title, goal, deadline });
      setTitle("");
      setGoal("");
      setDeadline("");
      fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  // Contribute
  const contribute = async (id, amount) => {
    try {
      await API.post('/campaigns/${id}/contribute', { amount });
      fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-4xl font-bold text-center text-indigo-600 mb-8">
        💰 CryptoCrowdfunding
      </h1>

      {/* Create Campaign */}
      <div className="max-w-lg mx-auto bg-white p-6 shadow-lg rounded-xl mb-8">
        <h2 className="text-2xl font-semibold mb-4">🚀 Create Campaign</h2>
        <input
          type="text"
          placeholder="Campaign Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full mb-3 rounded"
        />
        <input
          type="number"
          placeholder="Goal (in ETH)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="border p-2 w-full mb-3 rounded"
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="border p-2 w-full mb-3 rounded"
        />
        <button
          onClick={createCampaign}
          className="bg-green-500 text-white px-4 py-2 rounded w-full hover:bg-green-600"
        >
          Create Campaign
        </button>
      </div>

      {/* Campaign List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="bg-white p-6 shadow-lg rounded-xl text-center"
          >
            <h3 className="text-xl font-bold mb-2">{c.title}</h3>
            <p><b>Goal:</b> {c.goal} ETH</p>
            <p><b>Raised:</b> {c.raised} ETH</p>
            <p><b>Deadline:</b> {c.deadline}</p>
            <input
              type="number"
              placeholder="Amount"
              id={'amt-${c.id}'}
              className="border p-2 w-full rounded mt-3"
            />
            <button
              onClick={() =>
                contribute(c.id, document.getElementById('amt-${c.id}').value)
              }
              className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600 mt-2"
            >
              Contribute
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;