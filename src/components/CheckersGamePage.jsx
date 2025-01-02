import React, {useState} from 'react';
import ChessBoard from './ChessBoard.jsx';
import GameControls from './GameControls.jsx';
import '../styles/CheckersGamePage.css';

function GamePage() {
    const [playerCount, setPlayerCount] = useState(0);

    return (
        <div className="CheckersGamePage">
            <ChessBoard isGameReady={playerCount >= 2}/>
            <div className="game-controls-container">
                <GameControls setPlayerCount={setPlayerCount}/>
            </div>
        </div>
    );
}

export default GamePage;