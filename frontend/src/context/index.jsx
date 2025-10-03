import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { ethers } from "ethers";

// ================================================================
// CONTRACT DETAILS
// ================================================================
const contractAddress = "0x45adfec3F2309348DE005aB840f7A0db9c5BEe9A";
// FIX: Switched to a public RPC URL that does not require an API key.
const SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/dnvuizKMmhQ4l1UKH5eSc";

// ABIs
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
  { "inputs": [], "name": "withdrawn", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "contributions", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }
];

// ================================================================
// STATE CONTEXT
// ================================================================
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
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(web3Provider);
            const signer = await web3Provider.getSigner();
            const factoryContract = new ethers.Contract(contractAddress, factoryABI, signer);
            setContract(factoryContract);
        } catch (error) {
            console.error(error);
            alert("Failed to connect wallet.");
        }
    };

    const getCampaignDetails = useCallback(async (campaignAddress) => {
        try {
            const campaignContract = new ethers.Contract(campaignAddress, campaignABI, defaultProvider);
            const creator = await campaignContract.creator();
            const metaURI = await campaignContract.metaURI(); // This is the image URL
            const goal = await campaignContract.goal();
            const deadline = await campaignContract.deadline();
            const totalContributed = await campaignContract.totalContributed();
            const withdrawn = await campaignContract.withdrawn();
            
            return {
                id: campaignAddress,
                creator,
                image: metaURI,
                title: `Campaign: ${campaignAddress.substring(0, 10)}...`,
                story: "The full story for this campaign is available on the details page. Support this project to make it a reality!",
                goal: ethers.formatEther(goal),
                amountCollected: ethers.formatEther(totalContributed),
                deadline: Number(deadline) * 1000,
                withdrawn,
            };
        } catch (error) { 
            console.error(`Error in getCampaignDetails for ${campaignAddress}:`, error); 
            return null; 
        }
    }, []);
    
    const getCampaigns = useCallback(async () => {
        try {
            const factoryContract = new ethers.Contract(contractAddress, factoryABI, defaultProvider);
            const campaignAddresses = await factoryContract.allCampaigns();
            const campaignPromises = campaignAddresses.map(address => getCampaignDetails(address));
            return Promise.all(campaignPromises);
        } catch(error) { 
            console.error("Could not fetch campaigns:", error); 
            return []; 
        }
    }, [getCampaignDetails]);
    
    const getDonations = useCallback(async (userAddress) => {
      try {
        const factoryContract = new ethers.Contract(contractAddress, factoryABI, defaultProvider);
        const campaignAddresses = await factoryContract.allCampaigns();
        const donations = [];

        for (const address of campaignAddresses) {
          const campaignContract = new ethers.Contract(address, campaignABI, defaultProvider);
          const contribution = await campaignContract.contributions(userAddress);

          if (contribution > 0) {
            const campaignDetails = await getCampaignDetails(address);
            if(campaignDetails) {
                donations.push({
                    ...campaignDetails,
                    amount: ethers.formatEther(contribution)
                });
            }
          }
        }
        return donations;
      } catch (error) {
        console.error("Error in getDonations:", error);
        return [];
      }
    }, [getCampaignDetails]);
    
    const triggerRefresh = () => {
        setRefresh(prev => !prev);
    };
    
    return (
        <StateContext.Provider value={{ connectWallet, walletAddress, contract, provider, getCampaigns, getCampaignDetails, getDonations, refresh, triggerRefresh }}>
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = () => useContext(StateContext);

// ================================================================
// TOAST CONTEXT & PROVIDER
// ================================================================
const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

const Toast = ({ type, message }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return (
        <div className={`fixed bottom-5 right-5 text-white px-6 py-3 rounded-xl shadow-lg animate-slide-in-up ${bgColor}`}>
            {message}
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);
    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };
    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && <Toast type={toast.type} message={toast.message} />}
        </ToastContext.Provider>
    );
};

// ================================================================
// THEME CONTEXT & PROVIDER
// ================================================================
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('dark');
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);
    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

