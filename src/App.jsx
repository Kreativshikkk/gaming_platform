import React, {useState} from 'react';
import ConnectWallet from './ConnectWallet';
import Sidebar from "./Sidebar";
import GamePage from "./CheckersGamePage";
import './styles/App.css';


function App() {
    const [selectedGame, setSelectedGame] = useState(null);

    return (
        <div className="App">
            <ConnectWallet />
            <div className="content">
                <div className="sidebar-container">
                    <Sidebar setSelectedGame={setSelectedGame}/>
                </div>
                <div className="gamepage-container">
                    {selectedGame === 'Checkers' && <GamePage />}
                </div>
            </div>
        </div>
    );
}


export default App;
