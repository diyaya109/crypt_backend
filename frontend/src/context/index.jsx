import React, { useState, createContext, useContext } from 'react';
// import { ethers } from "ethers"; // We will enable this when connecting to the contract

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
    const [walletAddress, setWalletAddress] = useState('');

    const connectWallet = async () => {
        // We will add MetaMask connection logic here later
        if (walletAddress) {
            setWalletAddress('');
            console.log("Wallet Disconnected");
        } else {
            const mockAddress = "0xAbC123...dEF456";
            setWalletAddress(mockAddress);
            console.log("Wallet Connected:", mockAddress);
        }
    };

    return (
        <StateContext.Provider value={{
            connectWallet,
            walletAddress,
        }}>
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = () => useContext(StateContext);

