import React, {createContext, useState} from 'react';

export const WalletContext = createContext();

export const WalletProvider = ({children}) => {
    const [connectionState, setConnectionState] = useState('disconnected');
    const [userAccount, setUserAccount] = useState(null);
    const [balance, setBalance] = useState('0');

    return (
        <WalletContext.Provider
            value={{connectionState, setConnectionState, userAccount, setUserAccount, balance, setBalance}}>
            {children}
        </WalletContext.Provider>
    );
};