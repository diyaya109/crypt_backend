import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { ethers } from "https://esm.sh/ethers@6";
import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

// ================================================================
// CONTRACT DETAILS (ABIs generated from your Solidity code)
// ================================================================
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your Deployed Factory Address

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
  { "inputs": [], "name": "totalContributed", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }
];

const SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/dnvuizKMmhQ4l1UKH5eSc";


// 1. STATE MANAGEMENT (CONTEXT)

const StateContext = createContext();
const ThemeContext = createContext();

const StateContextProvider = ({ children }) => {
    const [walletAddress, setWalletAddress] = useState('');
    const [provider, setProvider] = useState(null);
    const [contract, setContract] = useState(null);
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
        } catch (error) { console.error(error); alert("Failed to connect wallet."); }
    };

    const publishCampaign = async (form, showToast) => {
        try {
            if (!contract) throw new Error("Wallet not connected");
            const goalInWei = ethers.parseEther(form.goal);
            const deadlineInSeconds = Math.floor((new Date(form.deadline)).getTime() / 1000);
            const tx = await contract.createCampaign(form.image, goalInWei, deadlineInSeconds);
            await tx.wait();
            showToast('success', 'Campaign created successfully!');
            return true;
        } catch (error) {
            console.error(error);
            showToast('error', `Error: ${error.reason || "Transaction failed"}`);
            return false;
        }
    }

    const getCampaigns = async () => {
        try {
            const factoryContract = new ethers.Contract(contractAddress, factoryABI, defaultProvider);
            const campaignAddresses = await factoryContract.allCampaigns();
            return Promise.all(campaignAddresses.map(address => getCampaignDetails(address, true)));
        } catch(error) { console.error(error); return []; }
    }
    
    const getCampaignDetails = async (campaignAddress, isSummary = false) => {
        try {
            const campaignContract = new ethers.Contract(campaignAddress, campaignABI, defaultProvider);
            const creator = await campaignContract.creator();
            const metaURI = await campaignContract.metaURI();
            const goal = await campaignContract.goal();
            const deadline = await campaignContract.deadline();
            const totalContributed = await campaignContract.totalContributed();
            
            const details = {
                id: campaignAddress, creator, image: metaURI,
                goal: ethers.formatEther(goal),
                amountCollected: ethers.formatEther(totalContributed),
                deadline: Number(deadline) * 1000,
                title: `Campaign: ${campaignAddress.substring(0, 10)}...`,
                story: "The full story for this campaign is stored in its off-chain metadata, linked via the metaURI.",
            };
            
            if (!isSummary) {
                // Future enhancement: fetch list of donators if available in the contract
            }
            return details;
        } catch (error) { console.error(error); return null; }
    };

    const donate = async (campaignAddress, amount, showToast) => {
        if (!provider) return alert("Please connect your wallet to donate.");
        try {
            const signer = await provider.getSigner();
            const campaignContract = new ethers.Contract(campaignAddress, campaignABI, signer);
            const tx = await campaignContract.contribute({ value: ethers.parseEther(amount) });
            await tx.wait();
            showToast('success', 'Donation successful!');
            return true;
        } catch (error) {
            console.error(error);
            showToast('error', `Error: ${error.reason || "Donation failed"}`);
            return false;
        }
    }

    return ( <StateContext.Provider value={{ connectWallet, walletAddress, publishCampaign, getCampaigns, getCampaignDetails, donate }}>{children}</StateContext.Provider> );
};

const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('light');
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);
    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
    return ( <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider> );
};

const useStateContext = () => useContext(StateContext);
const useTheme = () => useContext(ThemeContext);


// 2. UI & ANIMATION COMPONENTS

const ToastContext = createContext();
const useToast = () => useContext(ToastContext);
const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);
    const showToast = (type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000); };
    return ( <ToastContext.Provider value={{ showToast }}>{children}{toast && <Toast type={toast.type} message={toast.message} />}</ToastContext.Provider> );
};

const Toast = ({ type, message }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    return ( <div className={`fixed bottom-5 right-5 text-white px-6 py-3 rounded-xl shadow-lg animate-slide-in-up ${bgColor}`}>{message}</div> );
};

const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const EthIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-9l3-3 3 3m-6 6l3 3 3-3" /></svg>;
const BackersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const LogoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 16a4 4 0 100-8 4 4 0 000 8z" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;


const Footer = () => ( <footer className="bg-gray-900 text-white mt-12 py-8 dark:bg-gray-800"><div className="container mx-auto text-center"><p>&copy; 2025 CryptoFund. All Rights Reserved.</p><p className="text-sm text-gray-400 mt-2">Funding the future, one block at a time.</p></div></footer> );
const SplashScreen = ({ isVisible }) => ( <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900 transition-opacity duration-1000 ease-out ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}><div className="animate-pulse"><LogoIcon /></div><h1 className="text-4xl font-bold text-white mt-4 animate-pulse">CryptoFund</h1></div> );

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
    );
};

// --- 3D Scene Component ---
const ThreeScene = () => {
    const mountRef = useRef(null);
    useEffect(() => {
        const currentMount = mountRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        currentMount.appendChild(renderer.domElement);
        camera.position.z = 5;

        const particleCount = 5000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 10;
        }
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMaterial = new THREE.PointsMaterial({ color: 0x4dabf7, size: 0.02 });
        const particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);

        const mouse = new THREE.Vector2();
        const onMouseMove = (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', onMouseMove);

        const animate = () => {
            requestAnimationFrame(animate);
            particleSystem.rotation.y += 0.0005;
            particleSystem.rotation.x += 0.0005;
            camera.position.x += (mouse.x * 2 - camera.position.x) * 0.02;
            camera.position.y += (-mouse.y * 2 - camera.position.y) * 0.02;
            camera.lookAt(scene.position);
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('resize', handleResize);
            currentMount.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full z-0"/>;
};



// 3. PAGE COMPONENTS


function Navbar() {
  const { connectWallet, walletAddress } = useStateContext();
  const truncatedAddress = walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : '';
  return ( 
    <nav className="bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-800 dark:text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold tracking-wide hover:text-blue-500 transition-colors duration-300">CryptoFund</Link>
            <div className="flex items-center space-x-4">
                <Link to="/" className="hidden sm:block hover:text-blue-500 transition-colors duration-300 font-medium">Campaigns</Link>
                <Link to="/create" className="hidden sm:block hover:text-blue-500 transition-colors duration-300 font-medium">Create Campaign</Link>
                <Link to="/contact" className="hidden sm:block hover:text-blue-500 transition-colors duration-300 font-medium">Contact</Link>
                <ThemeToggle />
                <button onClick={connectWallet} className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-all duration-300 font-semibold transform hover:scale-105">{walletAddress ? truncatedAddress : "Connect Wallet"}</button>
            </div>
        </div>
    </nav>
  );
}

const mockCampaigns = [
    { id: '0x111', creator: '0xMock1', title: 'Dummy: The Future of AI', story: 'A dummy campaign.', image: 'https://placehold.co/600x400/3498db/ffffff?text=AI', goal: '10', amountCollected: '7.5', deadline: new Date('2025-12-31').getTime(), backers: [ { address: '0xabc...def', amount: '1.5 ETH' }, { address: '0x123...456', amount: '2.0 ETH' } ] },
    { id: '0x222', creator: '0xMock2', title: 'Dummy: VR Education', story: 'A dummy campaign.', image: 'https://placehold.co/600x400/9b59b6/ffffff?text=VR', goal: '25', amountCollected: '5.2', deadline: new Date('2026-03-15').getTime(), backers: [ { address: '0x789...abc', amount: '0.8 ETH' } ] },
    { id: '0x333', creator: '0xMock3', title: 'Dummy: Decentralized Science', story: 'A dummy campaign.', image: 'https://placehold.co/600x400/2ecc71/ffffff?text=DeSci', goal: '50', amountCollected: '45.1', deadline: new Date('2025-11-20').getTime(), backers: [ { address: '0x456...789', amount: '10.0 ETH' }, { address: '0xghi...jkl', amount: '5.0 ETH' }, { address: '0xmno...pqr', amount: '12.0 ETH' } ] },
    { id: '0x444', creator: '0xMock4', title: 'Dummy: Green Energy DAO', story: 'A dummy campaign.', image: 'https://placehold.co/600x400/f1c40f/ffffff?text=DAO', goal: '100', amountCollected: '12.0', deadline: new Date('2026-06-01').getTime(), backers: [] },
    { id: '0x555', creator: '0xMock5', title: 'Dummy: Music NFT Platform', story: 'A dummy campaign.', image: 'https://placehold.co/600x400/e74c3c/ffffff?text=Music', goal: '30', amountCollected: '28.5', deadline: new Date('2026-02-10').getTime(), backers: [ { address: '0xstu...vwx', amount: '15.0 ETH' } ] },
    { id: '0x666', creator: '0xMock6', title: 'Dummy: Gaming Guild on Blockchain', story: 'A dummy campaign.', image: 'https://placehold.co/600x400/34495e/ffffff?text=Gaming', goal: '75', amountCollected: '35.0', deadline: new Date('2026-08-22').getTime(), backers: [ { address: '0xzyx...wvu', amount: '5.0 ETH' }, { address: '0tsr...qpo', amount: '10.0 ETH' } ] },
];

function AllCampaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getCampaigns } = useStateContext();

    useEffect(() => {
        const fetchCampaigns = async () => {
            const realCampaigns = await getCampaigns();
            setCampaigns([...realCampaigns, ...mockCampaigns]);
            setIsLoading(false);
        }
        fetchCampaigns();
    }, []);

    return (
        <div className="relative">
            <ThreeScene />
            <div className="relative container mx-auto p-8 text-gray-800 dark:text-gray-200">
                <div className="text-center mb-16 pt-16">
                    <h1 className="text-5xl font-extrabold mb-4 animate-fade-in-down">Fund the Future, Decentralized.</h1>
                    <p className="text-lg max-w-2xl mx-auto animate-fade-in-down" style={{animationDelay: '200ms'}}>Support groundbreaking projects on a transparent, secure, and community-driven crowdfunding platform.</p>
                </div>
                <h2 className="text-3xl font-bold mb-8 border-b-2 border-blue-200 dark:border-blue-700 pb-2">Active Campaigns</h2>
                {isLoading && <p className="text-center">Loading campaigns...</p>}
                {!isLoading && campaigns.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {campaigns.map((campaign, i) => {
                            const progress = campaign.goal > 0 ? (parseFloat(campaign.amountCollected) / parseFloat(campaign.goal)) * 100 : 0;
                            return (
                                <div key={campaign.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 animate-fade-in-up" style={{animationDelay: `${i * 100}ms`}}>
                                    <img src={campaign.image || 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image'} alt={campaign.title} className="w-full h-48 object-cover"/>
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold mb-2 truncate">{campaign.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">by {campaign.creator}</p>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2"><div className="bg-blue-600 h-2.5 rounded-full transition-width duration-500" style={{ width: `${progress}%` }}></div></div>
                                        <p className="text-sm font-medium mb-4">{Math.round(progress)}% Funded</p>
                                        <Link to={`/campaign/${campaign.id}`} className="block text-center w-full bg-gray-800 dark:bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition font-semibold">View Details</Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
                {!isLoading && campaigns.length === 0 && (<div className="text-center py-12"><p>No active campaigns yet.</p><Link to="/create" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">Be the first to create one!</Link></div>)}
            </div>
        </div>
    );
}

function CreateCampaign() {
  const navigate = useNavigate();
  const { publishCampaign, walletAddress } = useStateContext();
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', story: '', goal: '', deadline: '', image: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFormFieldChange = (fieldName, e) => setForm({ ...form, [fieldName]: e.target.value });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!walletAddress) return showToast('error', 'Please connect your wallet first!');
    setIsLoading(true);
    const success = await publishCampaign(form, showToast);
    setIsLoading(false);
    if(success) navigate('/');
  };

  return ( <div className="flex justify-center items-center min-h-[calc(100vh-80px)] p-4"><div className="w-full max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl"><h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">🚀 Launch Your Campaign</h2><form onSubmit={handleSubmit} className="space-y-5"><div><label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Campaign Title</label><input id="title" type="text" placeholder="e.g., My Awesome Project" value={form.title} onChange={(e) => handleFormFieldChange('title', e)} className="mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div><div><label htmlFor="story" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Story</label><textarea id="story" placeholder="Tell us more about your project..." rows="4" value={form.story} onChange={(e) => handleFormFieldChange('story', e)} className="mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label htmlFor="goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fundraising Goal (ETH)</label><input id="goal" type="number" step="0.01" placeholder="0.50" value={form.goal} onChange={(e) => handleFormFieldChange('goal', e)} className="mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div><div><label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label><input id="deadline" type="date" value={form.deadline} onChange={(e) => handleFormFieldChange('deadline', e)} className="mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div></div><div><label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Campaign Image URL (used as metaURI)</label><input id="image" type="url" placeholder="https://example.com/image.png" value={form.image} onChange={(e) => handleFormFieldChange('image', e)} className="mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div><button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-6 py-3 w-full rounded-lg hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-60"> {isLoading ? 'Submitting to Blockchain...' : 'Create Campaign'}</button></form></div></div> );
}

function CampaignDetail() {
    const { address } = useParams();
    const { getCampaignDetails, donate, walletAddress } = useStateContext();
    const { showToast } = useToast();
    const [campaign, setCampaign] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [isDonating, setIsDonating] = useState(false);

    const fetchCampaign = async () => {
        setIsLoading(true);
        const isMock = mockCampaigns.find(c => c.id === address);
        const data = isMock || await getCampaignDetails(address);
        setCampaign(data);
        setIsLoading(false);
    };

    useEffect(() => { if(address) fetchCampaign(); }, [address]);

    if(isLoading) return <p className="text-center p-12 text-gray-500 dark:text-gray-400">Loading campaign details...</p>;
    if(!campaign) return <p className="text-center p-12 text-gray-500 dark:text-gray-400">Campaign not found.</p>;
    
    const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24)));
    const progress = campaign.goal > 0 ? (parseFloat(campaign.amountCollected) / parseFloat(campaign.goal)) * 100 : 0;

    const handleDonate = async () => {
        if (!walletAddress) return showToast('error', 'Please connect your wallet to donate.');
        setIsDonating(true);
        const success = await donate(campaign.id, amount, showToast);
        if (success) { fetchCampaign(); setAmount(''); }
        setIsDonating(false);
    }

    const StatBox = ({ icon, title, value, delay }) => (
        <div className="flex items-center space-x-3 animate-fade-in-up" style={{animationDelay: delay}}>
            <div className="text-blue-500">{icon}</div>
            <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-8 text-gray-800 dark:text-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <img src={campaign.image || 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image'} alt={campaign.title} className="w-full h-96 object-cover rounded-2xl shadow-lg mb-8"/>
                    <h1 className="text-4xl font-bold mb-4">{campaign.title}</h1>
                    <p className="font-medium mb-2">Creator:</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 break-all mb-8">{campaign.creator}</p>
                    <h2 className="text-2xl font-bold mb-4">Story</h2>
                    <p className="leading-relaxed mb-8">{campaign.story}</p>
                    
                    <h2 className="text-2xl font-bold mb-4">Recent Backers</h2>
                    <div className="space-y-3">
                        {campaign.backers && campaign.backers.length > 0 ? (
                            campaign.backers.map((backer, index) => (
                                <div key={index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center animate-fade-in-up" style={{animationDelay: `${index * 100}ms`}}>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono truncate pr-4">{backer.address}</p>
                                    <p className="font-semibold">{backer.amount}</p>
                                </div>
                            ))
                        ) : (
                            <p>No backers yet. Be the first to contribute!</p>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl sticky top-28">
                        <div className="grid grid-cols-1 gap-y-4 mb-6">
                            <StatBox icon={<ClockIcon/>} title="Days Left" value={daysLeft} delay="100ms"/>
                            <StatBox icon={<EthIcon/>} title={`Raised of ${campaign.goal} ETH`} value={campaign.amountCollected} delay="200ms"/>
                            <StatBox icon={<BackersIcon/>} title="Total Backers" value={campaign.backers?.length || 0} delay="300ms"/>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6"><div className="bg-blue-600 h-2.5 rounded-full transition-width duration-500" style={{width: `${progress}%`}}></div></div>
                        <h3 className="text-xl font-semibold mb-4">Fund this Campaign</h3>
                        <input type="number" placeholder="ETH 0.1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
                        <button onClick={handleDonate} disabled={isDonating} className="bg-blue-600 text-white px-6 py-3 w-full rounded-lg hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-60 transform hover:scale-105">
                            {isDonating ? "Processing Donation..." : "Fund Campaign"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Contact() {
    const { showToast } = useToast();
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleFormFieldChange = (fieldName, e) => setForm({ ...form, [fieldName]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
        setForm({ name: '', email: '', message: '' });
        showToast('success', 'Your message has been sent!');
    };

    return (
        <div className="container mx-auto p-8 text-gray-800 dark:text-gray-200">
            <div className="text-center mb-16"><h1 className="text-5xl font-extrabold mb-4 animate-fade-in-down">Get in Touch</h1><p className="text-lg max-w-2xl mx-auto animate-fade-in-down" style={{animationDelay: '200ms'}}>We'd love to hear from you. Please fill out the form below or reach out to us via email.</p></div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="animate-fade-in-up">
                        <h3 className="text-2xl font-bold mb-4">Contact Information</h3>
                        <p className="mb-6">Feel free to reach out for any inquiries or support.</p>
                        <div className="flex items-center space-x-4">
                            <MailIcon />
                            <a href="mailto:bhaskarverma.of@gmail.com" className="hover:text-blue-500 transition-colors">bhaskarverma.of@gmail.com</a>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up" style={{animationDelay: '200ms'}}>
                        <div><label htmlFor="name" className="block text-sm font-medium">Full Name</label><input id="name" type="text" placeholder="John Doe" value={form.name} onChange={(e) => handleFormFieldChange('name', e)} className="mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div>
                        <div><label htmlFor="email" className="block text-sm font-medium">Email Address</label><input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => handleFormFieldChange('email', e)} className="mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div>
                        <div><label htmlFor="message" className="block text-sm font-medium">Message</label><textarea id="message" placeholder="Your message..." rows="4" value={form.message} onChange={(e) => handleFormFieldChange('message', e)} className="mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea></div>
                        <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-6 py-3 w-full rounded-lg hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-60 transform hover:scale-105">{isLoading ? 'Sending...' : 'Send Message'}</button>
                    </form>
                </div>
            </div>
        </div>
    );
}


// 4. MAIN APP COMPONENT

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
        <SplashScreen isVisible={isAppLoading} />
        <ThemeProvider>
            <ToastProvider>
                <StateContextProvider>
                    <div className={`transition-opacity duration-1000 ${isAppLoading ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans flex flex-col">
                            <Navbar />
                            <main className="flex-grow">
                                <Routes>
                                    <Route path="/" element={<AllCampaigns />} />
                                    <Route path="/create" element={<CreateCampaign />} />
                                    <Route path="/campaign/:address" element={<CampaignDetail />} />
                                    <Route path="/contact" element={<Contact />} />
                                </Routes>
                            </main>
                            <Footer />
                            <style>{`
                                .dark {
                                    color-scheme: dark;
                                }
                                @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                                @keyframes fade-in-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; opacity: 0; }
                                .animate-fade-in-down { animation: fade-in-down 0.5s ease-out forwards; opacity: 0; }
                                @keyframes slide-in-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
                                .animate-slide-in-up { animation: slide-in-up 0.3s ease-out forwards; }
                                .transition-width { transition: width 0.5s ease-in-out; }
                            `}</style>
                        </div>
                    </div>
                </StateContextProvider>
            </ToastProvider>
        </ThemeProvider>
    </>
  );
}

