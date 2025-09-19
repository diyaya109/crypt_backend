import React, { useState } from "react";
import { ethers } from "ethers";
import { useStateContext } from '../context';
import { getFactory } from "../utils/contract";

function CreateCampaign() {
    const { signer, triggerRefresh } = useStateContext(); // Get the refresh function
    const [form, setForm] = useState({
        metaURI: '',
        goal: '',
        deadline: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleFormFieldChange = (fieldName, e) => {
        setForm({ ...form, [fieldName]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!signer) {
            alert("Please connect your wallet first!");
            setIsLoading(false);
            return;
        }

        try {
            const factory = getFactory(signer);

            const goalInWei = ethers.parseEther(form.goal);
            const deadlineInSeconds = new Date(form.deadline).getTime() / 1000;

            const tx = await factory.createCampaign(form.metaURI, goalInWei, deadlineInSeconds);
            console.log("Transaction sent:", tx.hash);
            
            await tx.wait();

            console.log("✅ Campaign created! Transaction:", tx.hash);
            
            triggerRefresh(); // 👈 Call this function after a successful transaction

            // Reset form
            setForm({ metaURI: '', goal: '', deadline: '' });

        } catch (error) {
            console.error("Error creating campaign:", error);
            alert("Failed to create campaign. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-80px)] p-4 bg-gray-50">
            <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-2xl">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                    🚀 Launch Your Campaign
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="metaURI" className="block text-sm font-medium text-gray-700">Campaign IPFS Metadata URI</label>
                        <input
                            id="metaURI"
                            type="text"
                            placeholder="ipfs://<hash>"
                            value={form.metaURI}
                            onChange={(e) => handleFormFieldChange('metaURI', e)}
                            className="mt-1 border border-gray-300 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    
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