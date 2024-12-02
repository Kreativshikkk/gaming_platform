import React, {useState, useEffect} from 'react';
import './ConnectWallet.css';

const ethers = require("ethers");

function ConnectWallet() {
    const [userAccount, setUserAccount] = useState(null);
    const [balance, setBalance] = useState('0');
    const [connected, setConnected] = useState(false);
    const [isWrongNetwork, setIsWrongNetwork] = useState(false);
    const [connectionState, setConnectionState] = useState('disconnected');


    const checkNetwork = async () => {
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0xaa36a7') { // Sepolia network ID
                setIsWrongNetwork(true);
                setConnectionState('wrongNetwork');
            } else {
                setIsWrongNetwork(false);
                setConnectionState('disconnected'); //исправить позже после нормальной поддержки подключённого кошелька
            }
        } catch(err) {
            console.error(err);
        }
    };



    const connectWalletHandler = async () => {
        if (window.ethereum) {
            if (isWrongNetwork) {
                return;
            }
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = await provider.getSigner();
                const account = await signer.getAddress();
                setUserAccount(account);
                const balance = await provider.getBalance(account);
                setBalance(ethers.formatEther(balance));
                setConnectionState('connected');
            } catch (err) {
                console.error(err);
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    useEffect(() => {
        if (window.ethereum) {
            // Check the initial network
            checkNetwork();
            // Listen for network changes
            window.ethereum.on('chainChanged', async () => {
                await checkNetwork();
            });
        }
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('chainChanged', checkNetwork);
            }
        };
    }, []);



    const buttonState = {
        disconnected: {
            text: 'Connect Wallet',
            class: 'disconnected',
        },
        wrongNetwork: {
            text: 'Wrong Network',
            class: 'wrongNetwork',
        },
        connected: {
            text: 'Connected',
            class: 'connected',
        },
    };

    const { text, class: buttonClass } = buttonState[connectionState];

    return (
        <div className="connect-wallet">
            <div className="logo">
                <img src="/logo.png" alt="Logo"/>
            </div>
            <h1 className="title">Crypto Kazinich</h1>
            <div className="wallet-info">
                {balance && <span className="balance">Balance: {parseFloat(balance).toFixed(3)} ETH</span>}
                <button onClick={connectWalletHandler}
                        className={`connect-button ${buttonClass}`}>
                    {`${text}`}
                </button>
            </div>
        </div>
    );
}

export default ConnectWallet;