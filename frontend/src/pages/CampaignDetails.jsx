import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from "ethers";
import { useStateContext } from '../context';

// This is where you should define your components and icons
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const EthIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-9l3-3 3 3m-6 6l3 3 3-3" /></svg>;
const WithdrawIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.103c.72.186 1.345-.355 1.345-1.071v-3.674c0-.555-.345-1.054-.862-1.229a10.023 10.023 0 00-6.195-4.148c-.553-.191-1.127-.291-1.7-.308m-.831 2.545a2.225 2.225 0 01-1.656-2.222v-1.332a.831.831 0 00-.781-.826h-2.115a.831.831 0 00-.78.826v1.332c0 .991.802 1.83 1.777 2.054a10.02 10.02 0 005.516 2.378" /></svg>;

const StatBox = ({ icon, title, value }) => (
    <div className="flex items-center space-x-3">
        <div className="text-blue-500">{icon}</div>
        <div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        </div>
    </div>
);

function CampaignDetail() {
    const { address } = useParams();
    const { provider, getCampaignDetails, refresh, walletAddress, triggerRefresh } = useStateContext();
    const [campaign, setCampaign] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [isDonating, setIsDonating] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const donate = async () => {
        if (!walletAddress) return alert('Please connect your wallet to donate.');
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount greater than zero.');
            return;
        }

        setIsDonating(true);
        try {
            const signer = await provider.getSigner();
            const campaignContract = new ethers.Contract(address, campaignABI, signer);
            const tx = await campaignContract.contribute({ value: ethers.parseEther(amount) });
            await tx.wait();
            alert('Donation successful!');
            setAmount('');
            triggerRefresh();
        } catch (error) {
            console.error(error);
            alert(`Error: ${error.reason || "Donation failed"}`);
        } finally {
            setIsDonating(false);
        }
    };
    
    const handleWithdraw = async () => {
        if (!walletAddress) {
            alert("Please connect your wallet first.");
            return;
        }
        if (campaign.creator.toLowerCase() !== walletAddress.toLowerCase()) {
            alert("Only the campaign creator can withdraw funds.");
            return;
        }

        setIsWithdrawing(true);
        try {
            const signer = await provider.getSigner();
            const campaignContract = new ethers.Contract(address, campaignABI, signer);
            const tx = await campaignContract.withdraw();
            await tx.wait();
            alert("Funds withdrawn successfully!");
            triggerRefresh();
        } catch (error) {
            console.error("Withdrawal failed:", error);
            alert(`Withdrawal failed: ${error.reason || error.message}`);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const fetchCampaign = async () => {
        setIsLoading(true);
        const data = await getCampaignDetails(address);
        setCampaign(data);
        setIsLoading(false);
    };

    useEffect(() => {
        if(address) fetchCampaign();
    }, [address, refresh]);
    
    if(isLoading) return <p className="text-center p-12 text-gray-500 dark:text-gray-400">Loading campaign details...</p>;
    if(!campaign) return <p className="text-center p-12 text-gray-500 dark:text-gray-400">Campaign not found.</p>;
    
    const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24)));
    const progress = campaign.goal > 0 ? (parseFloat(campaign.amountCollected) / parseFloat(campaign.goal)) * 100 : 0;
    
    const canWithdraw = 
        campaign.creator.toLowerCase() === walletAddress.toLowerCase() &&
        new Date().getTime() >= campaign.deadline &&
        parseFloat(campaign.amountCollected) >= parseFloat(campaign.goal) &&
        !campaign.withdrawn;

    return (
        <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <img src={campaign.image || 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image'} alt={campaign.title} className="w-full h-96 object-cover rounded-2xl shadow-lg mb-8"/>
                    <h1 className="text-4xl font-bold mb-4">{campaign.title}</h1>
                    <p className="font-medium mb-2">Creator:</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 break-all mb-8">{campaign.creator}</p>
                    <h2 className="text-2xl font-bold mb-4">Story</h2>
                    <p className="leading-relaxed mb-8">{campaign.story}</p>
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl sticky top-28">
                        <div className="grid grid-cols-1 gap-y-4 mb-6">
                            <StatBox icon={<ClockIcon/>} title="Days Left" value={daysLeft}/>
                            <StatBox icon={<EthIcon/>} title={`Raised of ${campaign.goal} ETH`} value={campaign.amountCollected}/>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
                            <div className="bg-blue-600 h-2.5 rounded-full transition-width duration-500" style={{width: `${progress}%`}}></div>
                        </div>
                        
                        {canWithdraw ? (
                            <button
                                onClick={handleWithdraw}
                                disabled={isWithdrawing}
                                className="mt-4 bg-green-600 text-white px-6 py-3 w-full rounded-lg hover:bg-green-700 transition font-semibold text-lg disabled:opacity-60 transform hover:scale-105"
                            >
                                <div className="flex items-center justify-center space-x-2">
                                    <WithdrawIcon/>
                                    <span>{isWithdrawing ? "Withdrawing..." : "Withdraw Funds"}</span>
                                </div>
                            </button>
                        ) : (
                            <>
                                <h3 className="text-xl font-semibold mb-4">Fund this Campaign</h3>
                                <input type="number" placeholder="ETH 0.1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
                                <button onClick={donate} disabled={isDonating} className="bg-blue-600 text-white px-6 py-3 w-full rounded-lg hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-60 transform hover:scale-105">
                                    {isDonating ? "Processing Donation..." : "Fund Campaign"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}