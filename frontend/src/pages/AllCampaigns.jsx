import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Note: We're using MOCK DATA here to build the UI.
// In a later step, we will replace this with real data from your smart contract.
const mockCampaigns = [
    { 
        id: '0x1A2b3c4D5e6F7g8H9i0JkL1m2N3o4P5q6R7s8T9u', 
        title: 'Decentralized Social Media Platform', 
        creator: '0xabc...def', 
        progress: 75, 
        image: 'https://placehold.co/600x400/1e293b/ffffff?text=Project+A' 
    },
    { 
        id: '0x2B3c4D5e6F7g8H9i0JkL1m2N3o4P5q6R7s8T9u1A', 
        title: 'NFT Marketplace for Independent Artists', 
        creator: '0x123...456', 
        progress: 40, 
        image: 'https://placehold.co/600x400/1e293b/ffffff?text=Project+B' 
    },
    { 
        id: '0x3C4d5E6f7G8h9I0j1K2l3M4n5O6p7Q8r9S0t1U2v', 
        title: 'Renewable Energy Blockchain Initiative', 
        creator: '0x789...abc', 
        progress: 92, 
        image: 'https://placehold.co/600x400/1e293b/ffffff?text=Project+C' 
    },
];


export default function AllCampaigns() {
    // We will replace the mock data with a call to the contract later
    const [campaigns, setCampaigns] = useState(mockCampaigns);
    const [isLoading, setIsLoading] = useState(false); // Will be used for real data fetching

    // Your original useEffect logic will be re-integrated here later
    // For now, we are just displaying the mock data.

    return (
        <div className="container mx-auto p-8">
            {/* === Hero Section === */}
            <div className="text-center mb-16">
                <h1 className="text-5xl font-extrabold text-gray-800 mb-4 animate-fade-in-down">
                    Fund the Future, Decentralized.
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Support groundbreaking projects on a transparent, secure, and community-driven crowdfunding platform.
                </p>
            </div>
            
            {/* === Campaigns Section === */}
            <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b-2 border-blue-200 pb-2">
                Active Campaigns
            </h2>
            
            {isLoading ? <p className="text-center text-gray-500">Loading campaigns...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {campaigns.map(campaign => (
                        <div key={campaign.id} className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                            <img src={campaign.image} alt={campaign.title} className="w-full h-48 object-cover"/>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{campaign.title}</h3>
                                <p className="text-sm text-gray-500 mb-4">by {campaign.creator}</p>
                                
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${campaign.progress}%` }}></div>
                                </div>
                                <p className="text-sm font-medium text-gray-700 mb-4">{campaign.progress}% Funded</p>
                                
                                <Link to={`/campaign/${campaign.id}`} className="block text-center w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition font-semibold">
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {campaigns.length === 0 && !isLoading && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No active campaigns yet.</p>
                    <Link to="/create" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">
                        Be the first to create one!
                    </Link>
                </div>
            )}
        </div>
    );
}

