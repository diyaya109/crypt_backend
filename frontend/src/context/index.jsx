import React, { useState, createContext, useContext } from 'react';
import { ethers } from "ethers";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
    const [walletAddress, setWalletAddress] = useState('');
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [refresh, setRefresh] = useState(false); // Add a new state for refreshing

    const connectWallet = async () => {
        try {
            if (!window.ethereum) {
                alert("Please install MetaMask to use this dApp!");
                return;
            }

            const newProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(newProvider);

            const newSigner = await newProvider.getSigner();
            setSigner(newSigner);

            const address = await newSigner.getAddress();
            setWalletAddress(address);
            console.log("Wallet Connected:", address);
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            setWalletAddress('');
        }
    };

    const disconnectWallet = () => {
        setWalletAddress('');
        setProvider(null);
        setSigner(null);
        console.log("Wallet Disconnected");
    };
    
    // Function to toggle the refresh state
    const triggerRefresh = () => {
        setRefresh(prev => !prev);
    };

    return (
        <StateContext.Provider value={{
            connectWallet,
            disconnectWallet,
            walletAddress,
            provider,
            signer,
            triggerRefresh, // Make this function globally available
            refresh, // Expose the refresh state
        }}>
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = () => useContext(StateContext);