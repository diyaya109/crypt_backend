import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStateContext } from '../context';
import { getFactory, fetchCampaignDetails } from '../utils/contract';
import { ethers } from "ethers";

export default function AllCampaigns() {
    const { provider, refresh } = useStateContext(); // Get the 'refresh' state
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCampaigns = async () => {
        setIsLoading(true);
        if (!provider) {
            console.warn("Provider is not available. Please connect your wallet.");
            setIsLoading(false);
            return;
        }
        
        try {
            const factory = getFactory(provider);
            const campaignAddresses = await factory.allCampaigns();

            const fetchedCampaigns = await Promise.all(
                campaignAddresses.map(async (address) => {
                    const details = await fetchCampaignDetails(address, provider);

                    const goalInETH = ethers.formatEther(details.goal);
                    const contributedInETH = ethers.formatEther(details.totalContributed);
                    const progress = (contributedInETH / goalInETH) * 100;

                    // Note: Your metaURI is a string. You need a separate service
                    // to parse the metadata and get the image/title.
                    // For now, let's use a placeholder until you add that logic.
                    const dummyData = {
                        title: "Untitled Campaign",
                        image: 'https://placehold.co/600x400/1e293b/ffffff?text=Loading...'
                    };
                    try {
                        const meta = await fetch(details.metaURI).then(res => res.json());
                        dummyData.title = meta.title;
                        dummyData.image = meta.image;
                    } catch (e) {
                        console.error(`Failed to fetch metadata for ${address}`, e);
                    }
                    
                    return {
                        id: address,
                        creator: details.creator,
                        progress: Math.min(100, progress),
                        ...dummyData,
                    };
                })
            );
            setCampaigns(fetchedCampaigns);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, [provider, refresh]); // 👈 Add `refresh` to the dependency array

    return (
        <div className="container mx-auto p-8">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-extrabold text-gray-800 mb-4 animate-fade-in-down">
                    Fund the Future, Decentralized.
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Support groundbreaking projects on a transparent, secure, and community-driven crowdfunding platform.
                </p>
            </div>
            
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
                                
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${campaign.progress}%` }}></div>
                                </div>
                                <p className="text-sm font-medium text-gray-700 mb-4">{campaign.progress.toFixed(2)}% Funded</p>
                                
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