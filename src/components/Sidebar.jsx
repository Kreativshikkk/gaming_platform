import React from 'react';
import '../styles/Sidebar.css';

function Sidebar({ setSelectedGame }) {
    const games = ['Checkers', 'Chess', 'Battleship'];

    return (
        <div className="sidebar">
            <h2>Choose a game</h2>
            <ul>
                {games.map(game => (
                    <li
                        key={game}
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