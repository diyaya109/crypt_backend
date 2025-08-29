import { ethers } from "ethers";
import factoryABI from "./factoryABI.json";
import campaignABI from "./campaignABI.json";

const FACTORY_ADDRESS = process.env.REACT_APP_FACTORY_ADDRESS;

if (!FACTORY_ADDRESS) {
  console.warn("⚠️ REACT_APP_FACTORY_ADDRESS is not set. Please add it to your .env file.");
}

export function getFactory(providerOrSigner) {
  if (!FACTORY_ADDRESS) return null;
  return new ethers.Contract(FACTORY_ADDRESS, factoryABI.abi, providerOrSigner);
}

export function getCampaign(address, providerOrSigner) {
  return new ethers.Contract(address, campaignABI.abi, providerOrSigner);
}
