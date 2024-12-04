import React from 'react';
import './styles/ChessBoard.css';

function ChessBoard() {
    return (
        <div className="chessboard-container">
            <img src="/chessboard.jpg" alt="Chess Board" className="chessboard-image" />
        </div>
    );
}

export default ChessBoard;