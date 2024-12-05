import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App.jsx';
import {WalletProvider} from "./WalletContext.js";

ReactDOM.createRoot(document.getElementById('root')).render(
    <WalletProvider>
        <App />
    </WalletProvider>,
);