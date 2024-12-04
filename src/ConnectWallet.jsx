import React, {useState, useEffect, useContext} from 'react';
import './styles/ConnectWallet.css';
import {WalletContext} from "./WalletContext.js";

const ethers = require("ethers");

function ConnectWallet() {
    const [isWrongNetwork, setIsWrongNetwork] = useState(false)
    const {
        connectionState,
        setConnectionState,
        userAccount,
        setUserAccount,
        balance,
        setBalance
    } = useContext(WalletContext);
    const [menuVisible, setMenuVisible] = useState(false);
    const idSepolia = '0xaa36a7';

    //checking whether network wrong or not
    const checkNetwork = async () => {
        console.log("checking the network...")
        try {
            const chainId = await window.ethereum.request({method: 'eth_chainId'});
            if (chainId !== idSepolia) { // Sepolia network ID
                setIsWrongNetwork(true);
                setConnectionState('wrongNetwork');
                console.log("connected to the wrong network")
            } else {
                setIsWrongNetwork(false);
                console.log("connected to the right network")
                setConnectionState('disconnected'); //maybe we'll fix this
            }
        } catch (err) {
            console.error(err);
        }
    };


    const connectWalletHandler = async () => {
        console.log("connecting the wallet...")
        if (window.ethereum) {
            if (connectionState === "connected") {
                console.log(`connected to ${userAccount}`)
                setMenuVisible(!menuVisible);
                return;
            }
            if (connectionState === "wrongNetwork") {
                try {
                    await window.ethereum.request({
                        "method": "wallet_switchEthereumChain",
                        "params": [
                            {
                                chainId: "0xaa36a7"
                            }
                        ],
                    });
                    return;

                } catch (err) {
                    console.error(err);
                }

            }
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = await provider.getSigner();
                const account = await signer.getAddress();
                setUserAccount(account);
                const balance = await provider.getBalance(account);
                setBalance(ethers.formatEther(balance));
                const chainId = await window.ethereum.request({method: 'eth_chainId'});
                if (chainId === idSepolia) {
                    setConnectionState('connected');
                    setIsWrongNetwork(false);
                } else {
                    setConnectionState('wrongNetwork');
                    setIsWrongNetwork(true);
                }

                console.log(`connected to ${userAccount}`)
            } catch (err) {
                console.error(err);
            }
        } else {
            alert("Please install MetaMask!");
        }
    };


    //listen chain changes
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


    //listen account changes
    useEffect(() => {
        //change account
        const handleAccountsChanged = async (accounts) => {
            console.log("changing the account...")
            if (!accounts || accounts.length === 0) {
                setConnectionState('disconnected');
                setBalance('0');
                console.log("Please connect to MetaMask.")
                return;
            }
            console.log(accounts)
            try {
                await connectWalletHandler();
            } catch (err) {
                console.error(err);
            }
        };

        if (window.ethereum) {
            // Listen for account changes
            window.ethereum.on('accountsChanged', async (accounts) => {
                await handleAccountsChanged(accounts);
            });
        }
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            }
        };
    }, []);


    //for connecting right after reload
    useEffect(() => {
        const checkWalletConnection = async () => {
            console.log("checking wallet connection...")
            if (window.ethereum && !isWrongNetwork) {
                try {
                    const accounts = await window.ethereum.request({method: 'eth_accounts'});
                    if (accounts.length > 0) {
                        await connectWalletHandler();
                    }
                    if (accounts.length === 0) {
                        setConnectionState('disconnected');
                    }
                } catch (err) {
                    console.error("Error checking wallet connection:", err);
                }
            }
        };
        checkWalletConnection();
    }, [isWrongNetwork]);


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
            text: userAccount ? `${userAccount.slice(0, 2)}...${userAccount.slice(-4)}` : '',
            class: 'connected',
        },
    };

    const {text, class: buttonClass} = buttonState[connectionState];

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