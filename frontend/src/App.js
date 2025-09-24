import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { ethers } from "https://esm.sh/ethers@6";
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Icon components
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const EthIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-9l3-3 3 3m-6 6l3 3 3-3" /></svg>;

// ================================================================
// CONTRACT DETAILS
// ================================================================
const contractAddress = "0x45adfec3F2309348DE005aB840f7A0db9c5BEe9A";
const SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/dnvuizKMmhQ4l1UKH5eSc"; 

const factoryABI = [ { "inputs": [ { "internalType": "string", "name": "metaURI", "type": "string" }, { "internalType": "uint256", "name": "goal", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" } ], "name": "createCampaign", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "allCampaigns", "outputs": [ { "internalType": "address[]", "name": "", "type": "address[]" } ], "stateMutability": "view", "type": "function" } ];
const campaignABI = [ { "inputs": [], "name": "contribute", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [], "name": "creator", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "metaURI", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "goal", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "deadline", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalContributed", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" } ];

const demoCampaigns = [
  {
    id: 'demo-1',
    creator: '0xDEMO...dEaD',
    image: 'https://placehold.co/600x400/2563eb/ffffff?text=Project+Alpha',
    goal: '10',
    amountCollected: '7.5',
    deadline: new Date().getTime() + (15 * 24 * 60 * 60 * 1000),
    title: 'Demo Project: The Alpha Initiative',
    story: "This is a sample project to demonstrate how campaigns look. We're building the future of decentralized applications.",
  },
  {
    id: 'demo-2',
    creator: '0xDEMO...c0fe',
    image: 'https://placehold.co/600x400/1f2937/ffffff?text=Project+Beta',
    goal: '25',
    amountCollected: '5',
    deadline: new Date().getTime() + (30 * 24 * 60 * 60 * 1000),
    title: 'Demo Project: The Beta Launchpad',
    story: 'Support our beta launch! This demo shows a project that is just getting started on its funding journey.',
  },
  {
    id: 'demo-3',
    creator: '0xDEMO...bEEf',
    image: 'https://placehold.co/600x400/2563eb/ffffff?text=Project+Gamma',
    goal: '5',
    amountCollected: '5',
    deadline: new Date().getTime() + (3 * 24 * 60 * 60 * 1000),
    title: 'Demo Project: Gamma - Fully Funded!',
    story: 'This campaign is fully funded! This is an example of what a successful project looks like on our platform.',
  },
];

const StateContext = createContext();
const StateContextProvider = ({ children }) => {
    const [walletAddress, setWalletAddress] = useState('');
    const [provider, setProvider] = useState(null);
    const [contract, setContract] = useState(null);
    const [refresh, setRefresh] = useState(false);
    const defaultProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const getCampaigns = useCallback(async () => { try { const factoryContract = new ethers.Contract(contractAddress, factoryABI, defaultProvider); const campaignAddresses = await factoryContract.allCampaigns(); const campaignPromises = campaignAddresses.map(address => getCampaignDetails(address)); return Promise.all(campaignPromises); } catch(error) { console.error(error); return []; } }, []);
    const getCampaignDetails = useCallback(async (campaignAddress) => { try { const campaignContract = new ethers.Contract(campaignAddress, campaignABI, defaultProvider); const creator = await campaignContract.creator(); const metaURI = await campaignContract.metaURI(); const goal = await campaignContract.goal(); const deadline = await campaignContract.deadline(); const totalContributed = await campaignContract.totalContributed(); return { id: campaignAddress, creator, image: metaURI, goal: ethers.formatEther(goal), amountCollected: ethers.formatEther(totalContributed), deadline: Number(deadline) * 1000, title: `Campaign: ${campaignAddress.substring(0, 10)}...`, story: "The full story for this campaign is stored in its off-chain metadata, linked via the metaURI.", }; } catch (error) { console.error(error); return null; } }, []);
    const connectWallet = async () => { if (typeof window.ethereum === 'undefined') return alert("Please install MetaMask."); try { const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }); setWalletAddress(accounts[0]); const web3Provider = new ethers.BrowserProvider(window.ethereum); setProvider(web3Provider); const signer = await web3Provider.getSigner(); const factoryContract = new ethers.Contract(contractAddress, factoryABI, signer); setContract(factoryContract); } catch (error) { console.error(error); alert("Failed to connect wallet."); } };
    const triggerRefresh = () => { setRefresh(prev => !prev); };
    return ( <StateContext.Provider value={{ connectWallet, walletAddress, contract, provider, getCampaigns, getCampaignDetails, refresh, triggerRefresh }}> {children} </StateContext.Provider> );
};
const useStateContext = () => useContext(StateContext);
const ToastContext = createContext();
const useToast = () => useContext(ToastContext);
const ToastProvider = ({ children }) => { const [toast, setToast] = useState(null); const showToast = (type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000); }; return ( <ToastContext.Provider value={{ showToast }}> {children} {toast && <Toast type={toast.type} message={toast.message} />} </ToastContext.Provider> ); };
const Toast = ({ type, message }) => { const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500'; return ( <div className={`fixed bottom-5 right-5 text-white px-6 py-3 rounded-xl shadow-lg animate-slide-in-up ${bgColor}`}>{message}</div> ); };
const ThemeContext = createContext();
const ThemeProvider = ({ children }) => { const [theme, setTheme] = useState('light'); useEffect(() => { if (theme === 'dark') { document.documentElement.classList.add('dark'); } else { document.documentElement.classList.remove('dark'); } }, [theme]); const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light'); return ( <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider> ); };
const useTheme = () => useContext(ThemeContext);
const Footer = () => ( <footer className="bg-gray-900 text-white mt-12 py-8 dark:bg-gray-800"><div className="container mx-auto text-center"><p>&copy; 2025 CryptoFund. All Rights Reserved.</p><p className="text-sm text-gray-400 mt-2">Funding the future, one block at a time.</p></div></footer> );
const Navbar = () => { const { connectWallet, walletAddress } = useStateContext(); const truncatedAddress = walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : ''; return ( <nav className="bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-800 dark:text-white shadow-lg sticky top-0 z-50"> <div className="container mx-auto px-6 py-4 flex justify-between items-center"> <Link to="/" className="text-2xl font-bold tracking-wide hover:text-blue-500 transition-colors duration-300">CryptoFund</Link> <div className="flex items-center space-x-4"> <Link to="/" className="hidden sm:block hover:text-blue-500 transition-colors duration-300 font-medium">Campaigns</Link> <Link to="/create" className="hidden sm:block hover:text-blue-500 transition-colors duration-300 font-medium">Create Campaign</Link> <button onClick={connectWallet} className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-all duration-300 font-semibold transform hover:scale-105">{walletAddress ? truncatedAddress : "Connect Wallet"}</button> </div> </div> </nav> ); }

const TrackedShape = () => {
  const meshRef = useRef();
  useFrame((state) => {
    if (meshRef.current) {
      const { x, y } = state.mouse;
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, x * (Math.PI / 2), 0.05);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, y * (Math.PI / 2), 0.05);
    }
  });
  return ( <mesh ref={meshRef}> <torusKnotGeometry args={[1.2, 0.4, 128, 16]} /> <meshStandardMaterial color={'#2563eb'} wireframe /> </mesh> );
};
const Hero3D = () => {
  return ( <div className="w-full h-[400px] cursor-pointer"> <Canvas> <ambientLight intensity={0.8} /> <directionalLight position={[10, 10, 5]} intensity={1} /> <pointLight position={[-10, -10, -10]} intensity={0.5} /> <TrackedShape /> <OrbitControls enableZoom={true} enablePan={false} enableRotate={true} /> </Canvas> </div> );
};

function AllCampaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getCampaigns, refresh } = useStateContext();
    useEffect(() => { const fetchCampaigns = async () => { setIsLoading(true); const realCampaigns = (await getCampaigns()).filter(c => c !== null); if (realCampaigns.length > 0) { setCampaigns(realCampaigns); } else { setCampaigns(demoCampaigns); } setIsLoading(false); }; fetchCampaigns(); }, [refresh, getCampaigns]);
    return ( <div className="relative container mx-auto p-8 text-gray-800 dark:text-gray-200"> <div className="text-center mb-16 pt-8"> <h1 className="text-5xl font-extrabold mb-4 animate-fade-in-down">Fund the Future, Decentralized.</h1> <p className="text-lg max-w-2xl mx-auto animate-fade-in-down" style={{animationDelay: '200ms'}}> Support groundbreaking projects on a transparent, secure, and community-driven crowdfunding platform. </p> <Hero3D /> </div> <h2 className="text-3xl font-bold mb-8 border-b-2 border-blue-200 dark:border-blue-700 pb-2">Active Campaigns</h2> {isLoading && <p className="text-center">Loading campaigns...</p>} {!isLoading && campaigns.length > 0 && ( <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> {campaigns.map((campaign, i) => { const progress = campaign.goal > 0 ? (parseFloat(campaign.amountCollected) / parseFloat(campaign.goal)) * 100 : 0; return ( <div key={campaign.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 animate-fade-in-up" style={{animationDelay: `${i * 100}ms`}}> <img src={campaign.image || 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image'} alt={campaign.title} className="w-full h-48 object-cover"/> <div className="p-6"> <h3 className="text-xl font-bold mb-2 truncate">{campaign.title}</h3> <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">by {campaign.creator}</p> <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2"><div className="bg-blue-600 h-2.5 rounded-full transition-width duration-500" style={{ width: `${progress}%` }}></div></div> <p className="text-sm font-medium mb-4">{Math.round(progress)}% Funded</p> <Link to={`/campaign/${campaign.id}`} className="block text-center w-full bg-gray-800 dark:bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition font-semibold">View Details</Link> </div> </div> ) })} </div> )} </div> );
}

function CreateCampaign() {
    const navigate = useNavigate();
    const { contract, walletAddress, triggerRefresh } = useStateContext();
    const { showToast } = useToast();
    const [form, setForm] = useState({ title: '', story: '', goal: '', deadline: '', image: '' });
    const [isLoading, setIsLoading] = useState(false);
    const handleFormFieldChange = (fieldName, e) => setForm({ ...form, [fieldName]: e.target.value });
    const handleSubmit = async (e) => { e.preventDefault(); if (!walletAddress) return showToast('error', 'Please connect your wallet first!'); setIsLoading(true); try { if (!contract) throw new Error("Wallet not connected"); const goalInWei = ethers.parseEther(form.goal); const deadlineInSeconds = Math.floor((new Date(form.deadline)).getTime() / 1000); const tx = await contract.createCampaign(form.image, goalInWei, deadlineInSeconds); await tx.wait(); showToast('success', 'Campaign created successfully!'); triggerRefresh(); setForm({ title: '', story: '', goal: '', deadline: '', image: '' }); navigate('/'); } catch (error) { console.error(error); showToast('error', `Error: ${error.reason || "Transaction failed"}`); } finally { setIsLoading(false); } };
    return ( <div className="flex justify-center items-center min-h-[calc(100vh-80px)] p-4"><div className="w-full max-w-2xl bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl"><h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">🚀 Launch Your Campaign</h2><form onSubmit={handleSubmit} className="space-y-5"><div><label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Campaign Title</label><input id="title" type="text" placeholder="e.g., My Awesome Project" value={form.title} onChange={(e) => handleFormFieldChange('title', e)} className="mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div><div><label htmlFor="story" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Story</label><textarea id="story" placeholder="Tell us more about your project..." rows="4" value={form.story} onChange={(e) => handleFormFieldChange('story', e)} className="mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label htmlFor="goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fundraising Goal (ETH)</label><input id="goal" type="number" step="0.01" placeholder="0.50" value={form.goal} onChange={(e) => handleFormFieldChange('goal', e)} className="mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div><div><label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label><input id="deadline" type="date" value={form.deadline} onChange={(e) => handleFormFieldChange('deadline', e)} className="mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required /></div></div><div><label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Campaign Image URL (used as metaURI)</label><input id="image" type="url" placeholder="https://example.com/image.png" value={form.image} onChange={(e) => handleFormFieldChange('image', e)} className="mt-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div><button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-6 py-3 w-full rounded-lg hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-60"> {isLoading ? 'Submitting to Blockchain...' : 'Create Campaign'}</button></form></div></div> );
}

function CampaignDetail() {
    const { address } = useParams();
    const { getCampaignDetails, refresh, walletAddress, provider } = useStateContext();
    const { showToast } = useToast();
    const [campaign, setCampaign] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [isDonating, setIsDonating] = useState(false);

    const donate = async () => {
        if (!walletAddress) return showToast('error', 'Please connect your wallet to donate.');
        if (campaign.id.startsWith('demo-')) return showToast('error', "You cannot donate to a demo campaign.");
        if (!amount || parseFloat(amount) <= 0) return showToast('error', 'Please enter a valid amount.');
        setIsDonating(true);
        try {
            const signer = await provider.getSigner();
            const campaignContract = new ethers.Contract(address, campaignABI, signer);
            const tx = await campaignContract.contribute({ value: ethers.parseEther(amount) });
            await tx.wait();
            showToast('success', 'Donation successful!');
            setAmount('');
            const updatedData = await getCampaignDetails(address);
            setCampaign(updatedData);
        } catch (error) {
            console.error(error);
            showToast('error', `Error: ${error.reason || "Donation failed"}`);
        } finally {
            setIsDonating(false);
        }
    };

    const fetchCampaign = useCallback(async () => {
        setIsLoading(true);
        const isDemo = address.startsWith('demo-');
        if (isDemo) {
            const demoData = demoCampaigns.find(c => c.id === address);
            setCampaign(demoData);
        } else {
            const data = await getCampaignDetails(address);
            setCampaign(data);
        }
        setIsLoading(false);
    }, [address, getCampaignDetails]);

    useEffect(() => {
        if (address) fetchCampaign();
    }, [address, refresh, fetchCampaign]);

    if(isLoading) return <p className="text-center p-12 text-gray-500 dark:text-gray-400">Loading campaign details...</p>;
    if(!campaign) return <p className="text-center p-12 text-gray-500 dark:text-gray-400">Campaign not found.</p>;
    
    const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24)));
    const progress = campaign.goal > 0 ? (parseFloat(campaign.amountCollected) / parseFloat(campaign.goal)) * 100 : 0;
    
    return (
        <div className="container mx-auto p-8 text-gray-800 dark:text-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <img src={campaign.image || 'https://placehold.co/600x400/1e293b/ffffff?text=No+Image'} alt={campaign.title} className="w-full h-96 object-cover rounded-2xl shadow-lg mb-8"/>
                    <h1 className="text-4xl font-bold mb-4">{campaign.title}</h1>
                    <p className="font-medium mb-2">Creator:</p>
                    {/* THIS IS THE CORRECTED LINE */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 break-all mb-8">{campaign.creator}</p>
                    <h2 className="text-2xl font-bold mb-4">Story</h2>
                    <p className="leading-relaxed mb-8">{campaign.story}</p>
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl sticky top-28">
                        <div className="grid grid-cols-1 gap-y-4 mb-6">
                            <div className="flex items-center space-x-3"><div className="text-blue-500"><ClockIcon/></div><div><p className="text-2xl font-bold text-gray-800 dark:text-white">{daysLeft}</p><p className="text-sm text-gray-500 dark:text-gray-400">Days Left</p></div></div>
                            <div className="flex items-center space-x-3"><div className="text-blue-500"><EthIcon/></div><div><p className="text-2xl font-bold text-gray-800 dark:text-white">{campaign.amountCollected}</p><p className="text-sm text-gray-500 dark:text-gray-400">Raised of {campaign.goal} ETH</p></div></div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6"><div className="bg-blue-600 h-2.5 rounded-full transition-width duration-500" style={{width: `${progress}%`}}></div></div>
                        <h3 className="text-xl font-semibold mb-4">Fund this Campaign</h3>
                        <input type="number" placeholder="ETH 0.1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
                        <button onClick={donate} disabled={isDonating || campaign.id.startsWith('demo-')} className="bg-blue-600 text-white px-6 py-3 w-full rounded-lg hover:bg-blue-700 transition font-semibold text-lg disabled:opacity-60 transform hover:scale-105">
                            {isDonating ? "Processing Donation..." : "Fund Campaign"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function App() {
  return (
    <ThemeProvider>
        <ToastProvider>
            <StateContextProvider>
                <div className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans flex flex-col">
                    <Navbar />
                    <main className="flex-grow">
                        <Routes>
                            <Route path="/" element={<AllCampaigns />} />
                            <Route path="/create" element={<CreateCampaign />} />
                            <Route path="/campaign/:address" element={<CampaignDetail />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </StateContextProvider>
        </ToastProvider>
    </ThemeProvider>
  );
}

export default App;