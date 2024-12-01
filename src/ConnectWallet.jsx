import React, {useState} from 'react';
import './ConnectWallet.css';

const ethers = require("ethers");

function ConnectWallet() {
    const [userAccount, setUserAccount] = useState(null);
    const [balance, setBalance] = useState('0');

    const connectWalletHandler = async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                const account = await (await signer).getAddress();
                setUserAccount(account);

                const balance = await provider.getBalance(account);
                setBalance(ethers.formatEther(balance));
            } catch (err) {
                console.error(err);
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    return (
        <div className="connect-wallet">
            {/*<div className="logo">*/}
            {/*    <img src="/path-to-your-logo.png" alt="Logo"/>*/}
            {/*</div>*/}
            <h1 className="title">Crypto Kazinich</h1>
            <div className="wallet-info">
                {balance && <span className="balance">Balance: {balance} ETH</span>}
                <button onClick={connectWalletHandler} className="connect-button">
                    Connect Wallet
                </button>
            </div>
        </div>
    )
        ;
}

export default ConnectWallet;