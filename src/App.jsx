import React from 'react';
import ConnectWallet from './ConnectWallet';
import Sidebar from "./Sidebar";
import GamePage from "./CheckersGamePage";
import './App.css';


function App() {
    return (
        <div className="App">
            <ConnectWallet />
            <div className="content">
                <Sidebar/>
                <GamePage/>
            </div>
        </div>
    );
}

export default App;
