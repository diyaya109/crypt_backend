import React, { useState, useEffect, createContext, useContext } from 'react';
import { ethers } from "ethers";

const contractAddress = "0x45adfec3F2309348DE005aB840f7A0db9c5BEe9A";
const SEPOLIA_RPC_URL = "https://rpc.ankr.com/eth_sepolia";

const factoryABI = [
  { "inputs": [ { "internalType": "string", "name": "metaURI", "type": "string" }, { "internalType": "uint256", "name": "goal", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "createCampaign", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "allCampaigns", "outputs": [ { "internalType": "address[]", "name": "", "type": "address[]" } ], "stateMutability": "view", "type": "function" }
];

const campaignABI = [
  { "inputs": [], "name": "contribute", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [], "name": "creator", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "metaURI", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "goal", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "deadline", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "totalContributed", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "withdrawn", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }
];

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
    const [walletAddress, setWalletAddress] = useState('');
    const [provider, setProvider] = useState(null);
    const [contract, setContract] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const defaultProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

    const connectWallet = async () => {
        if (typeof window.ethereum === 'undefined') return alert("Please install MetaMask.");
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setWalletAddress(accounts[0]);
            console.log("✅ Wallet connected with address:", accounts[0]);
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(web3Provider);
            const signer = await web3Provider.getSigner();
            const factoryContract = new ethers.Contract(contractAddress, factoryABI, signer);
            setContract(factoryContract);
        } catch (error) { console.error(error); alert("Failed to connect wallet."); }
    };

    const getCampaigns = async () => {
        try {
            const factoryContract = new ethers.Contract(contractAddress, factoryABI, defaultProvider);
            const campaignAddresses = await factoryContract.allCampaigns();
            const campaignPromises = campaignAddresses.map(address => getCampaignDetails(address));
            return Promise.all(campaignPromises);
        } catch(error) { console.error(error); return []; }
    }
    
    const getCampaignDetails = async (campaignAddress) => {
        try {
            const campaignContract = new ethers.Contract(campaignAddress, campaignABI, defaultProvider);
            const creator = await campaignContract.creator();
            const metaURI = await campaignContract.metaURI();
            const goal = await campaignContract.goal();
            const deadline = await campaignContract.deadline();
            const totalContributed = await campaignContract.totalContributed();
            const withdrawn = await campaignContract.withdrawn();
            
            let metadata = { title: `Campaign: ${campaignAddress.substring(0, 10)}...`, story: "No story available.", image: "" };
            if (metaURI) {
                let ipfsHash = metaURI;
                if (metaURI.startsWith("ipfs://")) {
                    ipfsHash = metaURI.replace("ipfs://", "");
                }
                
                const ipfsGatewayURL = `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`;
                
                try {
                    const response = await fetch(ipfsGatewayURL);
                    
                    if (response.ok) {
                        const json = await response.json();
                        metadata.title = json.title;
                        metadata.story = json.story;
                        metadata.image = json.image;
                    } else {
                        console.error(`Failed to fetch IPFS metadata. Status: ${response.status}. URL: ${ipfsGatewayURL}`);
                    }
                } catch(e) {
                    console.error("Error fetching IPFS metadata. This might be a CORS issue. Check the browser console for details.", e);
                }
            }

            return {
                id: campaignAddress, creator,
                image: metadata.image || 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image',
                title: metadata.title,
                story: metadata.story,
                goal: ethers.formatEther(goal),
                amountCollected: ethers.formatEther(totalContributed),
                deadline: Number(deadline) * 1000,
                withdrawn,
            };
        } catch (error) { 
            console.error("Error in getCampaignDetails:", error); 
            return null; 
        }
    };
    
    const triggerRefresh = () => {
        setRefresh(prev => !prev);
    };
    
    return (
        <StateContext.Provider value={{ connectWallet, walletAddress, contract, provider, getCampaigns, getCampaignDetails, refresh, triggerRefresh }}>
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = () => useContext(StateContext);