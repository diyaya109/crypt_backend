import React from "react";
import { Link } from "react-router-dom";

// Note: In the next steps, we will use a "Context" to get these values dynamically.
// For now, they are hardcoded to show the UI.
const walletAddress = ''; // Will be like '0x123...' when connected
const connectWallet = () => alert("Connecting to wallet...");

function Navbar() {
  const truncatedAddress = walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : '';

  return (
    <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Brand / Logo */}
        <Link
          to="/"
          className="text-2xl font-bold tracking-wide hover:text-blue-400 transition"
        >
          CryptoFund
        </Link>

        {/* Links */}
        <div className="flex items-center space-x-6">
          <Link
            to="/"
            className="hidden sm:block hover:text-blue-400 transition font-medium"
          >
            Campaigns
          </Link>
          <Link
            to="/create"
            className="hidden sm:block hover:text-blue-400 transition font-medium"
          >
            Create Campaign
          </Link>
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition font-semibold"
          >
            {walletAddress ? truncatedAddress : "Connect Wallet"}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

