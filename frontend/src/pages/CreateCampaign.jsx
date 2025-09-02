import React, { useState } from "react";
// import { ethers } from "ethers";
// import { useStateContext } from '../context'; // We will enable this later

function CreateCampaign() {
  const [form, setForm] = useState({
    title: '',
    story: '',
    goal: '',
    deadline: '',
    image: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleFormFieldChange = (fieldName, e) => {
    setForm({ ...form, [fieldName]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Form submitted:", form);
    // Here we will add the logic to call the smart contract
    // For now, we'll simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-80px)] p-4 bg-gray-50">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          🚀 Launch Your Campaign
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Campaign Title</label>
            <input
              id="title"
              type="text"
              placeholder="e.g., My Awesome Project"
              value={form.title}
              onChange={(e) => handleFormFieldChange('title', e)}
              className="mt-1 border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="story" className="block text-sm font-medium text-gray-700">Story</label>
            <textarea
              id="story"
              placeholder="Tell us more about your project and why it's amazing..."
              rows="4"
              value={form.story}
              onChange={(e) => handleFormFieldChange('story', e)}
              className="mt-1 border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal" className="block text-sm font-medium text-gray-700">Fundraising Goal (ETH)</label>
              <input
                id="goal"
                type="number"
                step="0.01"
                placeholder="0.50"
                value={form.goal}
                onChange={(e) => handleFormFieldChange('goal', e)}
                className="mt-1 border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => handleFormFieldChange('deadline', e)}
                className="mt-1 border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">Campaign Image URL</label>
            <input
              id="image"
              type="url"
              placeholder="https://example.com/your-project-image.png"
              value={form.image}
              onChange={(e) => handleFormFieldChange('image', e)}
              className="mt-1 border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 w-full rounded-lg hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Campaign...' : 'Create Campaign'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateCampaign;
