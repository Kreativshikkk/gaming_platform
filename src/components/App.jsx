import React, {useState} from 'react';
import ConnectWallet from './ConnectWallet.jsx';
import Sidebar from "./Sidebar.jsx";
import GamePage from "./CheckersGamePage.jsx";
import '../styles/App.css';


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
