import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Brand / Logo */}
        <Link
          to="/"
          className="text-2xl font-bold tracking-wide hover:text-blue-400 transition"
        >
          CryptoFund
        </Link>

        {/* Links */}
        <div className="flex space-x-6">
          <Link
            to="/"
            className="hover:text-blue-400 transition font-medium"
          >
            Campaigns
          </Link>
          <Link
            to="/create"
            className="hover:text-blue-400 transition font-medium"
          >
            Create Campaign
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
