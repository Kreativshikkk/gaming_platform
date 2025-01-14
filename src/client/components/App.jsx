import React, {useState} from 'react';
import ConnectWallet from './ConnectWallet.jsx';
import Sidebar from "./Sidebar.jsx";
import GamePage from "./CheckersGamePage.jsx";
import '../styles/App.css';
import {ToastContainer, Zoom} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function App() {
    const [selectedGame, setSelectedGame] = useState(null);

    return (
        <div className="App">
            <ConnectWallet/>
            <div className="content">
                <div className="sidebar-container">
                    <Sidebar setSelectedGame={setSelectedGame}/>
                </div>
                <div className="gamepage-container">
                    {selectedGame === 'Checkers' && <GamePage/>}
                </div>
            </div>
            <ToastContainer
                position="bottom-right"
                limit={5}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Zoom}
            />
        </div>
    );
}


export default App;
