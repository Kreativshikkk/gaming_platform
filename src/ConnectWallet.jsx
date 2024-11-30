import React, { useState } from 'react';
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
        <div>
            <button onClick={connectWalletHandler}>Connect Wallet</button>
            {userAccount && <p>Account: {userAccount}</p>}
            {userAccount && <p>Balance: {balance} ETH</p>}
        </div>
    );
}

export default ConnectWallet;