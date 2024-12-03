import React, { useState } from 'react';
import './Sidebar.css';

function Sidebar() {
    const [selectedGame, setSelectedGame] = useState(null);
    const games = ['Checkers', 'Chess', 'Battleship'];  // Список игр

    return (
        <div className="sidebar">
            <h2>Choose a game</h2>
            <ul>
                {games.map(game => (
                    <li
                        key={game}
                        className={selectedGame === game ? 'active' : ''}
                        onClick={() => setSelectedGame(game)}
                    >
                        {game}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Sidebar;