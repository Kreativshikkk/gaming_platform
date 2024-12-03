import React from 'react';
import ChessBoard from './ChessBoard';
import GameControls from './GameControls';

function GamePage() {
    return (
        <div style={{ display: 'flex' }}>
            <div style={{ flex: 1 }}>
                <ChessBoard />
            </div>
            <div style={{ flex: 1 }}>
                <GameControls />
            </div>
        </div>
    );
}

export default GamePage;