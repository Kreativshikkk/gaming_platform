import React from 'react';
import ChessBoard from './ChessBoard';
import GameControls from './GameControls';
import './styles/CheckersGamePage.css';

function GamePage() {
    return (
        <div className="CheckersGamePage">
            <ChessBoard />
            <div className="game-controls-container">
                <GameControls />
            </div>
        </div>
    );
}

export default GamePage;