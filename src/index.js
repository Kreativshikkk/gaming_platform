import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './client/components/App.jsx';
import {WalletProvider} from "./client/WalletContext.js";

ReactDOM.createRoot(document.getElementById('root')).render(
    <WalletProvider>
        <App />
    </WalletProvider>,
);