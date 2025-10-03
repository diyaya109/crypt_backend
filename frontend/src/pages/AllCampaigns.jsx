import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStateContext } from '../context';

const demoCampaigns = [
  { id: 'demo-1', creator: '0xDEMO...dEaD', image: 'https://placehold.co/600x400/2563eb/ffffff?text=Project+Alpha', goal: '10', amountCollected: '7.5', deadline: new Date().getTime() + 1296000000, title: 'Demo Project: The Alpha Initiative', story: "This is a sample project to demonstrate how campaigns look. We're building the future of decentralized applications." },
  { id: 'demo-2', creator: '0xDEMO...c0fe', image: 'https://placehold.co/600x400/1f2937/ffffff?text=Project+Beta', goal: '25', amountCollected: '5', deadline: new Date().getTime() + 2592000000, title: 'Demo Project: The Beta Launchpad', story: 'Support our beta launch! This demo shows a project that is just getting started on its funding journey.' },
  { id: 'demo-3', creator: '0xDEMO...bEEf', image: 'https://placehold.co/600x400/2563eb/ffffff?text=Project+Gamma', goal: '5', amountCollected: '5', deadline: new Date().getTime() + 259200000, title: 'Demo Project: Gamma - Fully Funded!', story: 'This campaign is fully funded! This is an example of what a successful project looks like on our platform.' },
];

function AllCampaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getCampaigns, refresh } = useStateContext();

    useEffect(() => {
        const fetchCampaigns = async () => {
            setIsLoading(true);
            const allCampaigns = await getCampaigns();
            const activeCampaigns = allCampaigns.filter(c => c !== null);

            // If there are no real campaigns, show demo campaigns
            if (activeCampaigns.length > 0) {
                setCampaigns(activeCampaigns);
            } else {
                setCampaigns(demoCampaigns);
            }
            setIsLoading(false);
        }
        fetchCampaigns();
    }, [refresh, getCampaigns]);

    return (
        <div className="relative container mx-auto p-8 text-gray-800 dark:text-gray-200">
            <div className="text-center pt-16 h-[50vh] flex flex-col justify-center items-center">
                <h1 className="text-5xl font-extrabold mb-4 animate-fade-in-down text-white">Fund the Future, Decentralized.</h1>
                <p className="text-lg max-w-2xl mx-auto animate-fade-in-down text-gray-300" style={{animationDelay: '200ms'}}>Support groundbreaking projects on a transparent, secure, and community-driven crowdfunding platform.</p>
            </div>
            
            <h2 className="text-3xl font-bold mb-8 border-b-2 border-blue-200 dark:border-blue-700 pb-2 text-white">Active Campaigns</h2>
            
            {isLoading && <p className="text-center text-white">Loading campaigns from the blockchain...</p>}
            
            {!isLoading && campaigns.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {campaigns.map((campaign, i) => {
                        const progress = campaign.goal > 0 ? (parseFloat(campaign.amountCollected) / parseFloat(campaign.goal)) * 100 : 0;
                        return (
                            <div key={campaign.id} className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 animate-fade-in-up" style={{animationDelay: `${i * 100}ms`}}>
                                <img src={campaign.image || 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image'} alt={campaign.title} className="w-full h-48 object-cover"/>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold mb-2 truncate text-white">{campaign.title}</h3>
                                    <p className="text-sm text-gray-400 mb-4">by {campaign.creator}</p>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <p className="text-sm font-medium mb-4 text-gray-300">{Math.round(progress)}% Funded</p>
                                    <Link to={`/campaign/${campaign.id}`} className="block text-center w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold">View Details</Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {!isLoading && campaigns.length === 0 && (
                <div className="text-center py-12 text-white">
                    <p>No active campaigns found on the network.</p>
                    <Link to="/create" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">
                        Be the first to create one!
                    </Link>
                </div>
            )}
        </div>
    );
}

export default AllCampaigns;
