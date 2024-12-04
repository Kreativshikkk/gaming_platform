import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import {WalletProvider} from "./WalletContext.js";

ReactDOM.createRoot(document.getElementById('root')).render(
    <WalletProvider>
        <App />
    </WalletProvider>,
);