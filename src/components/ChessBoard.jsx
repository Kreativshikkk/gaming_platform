import React, { useState } from 'react';
import '../styles/ChessBoard.css';

const boardSize = 8;
const onSelectedColor = '#8e4624';
const blackCellColor = '#d3733a';
const whiteCellColor = '#f5dfc3';
const textColorOnBlack = '#f5dfc3';
const textColorOnWhite = '#d3733a';
const columnLabels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const rowLabels = ['1', '2', '3', '4', '5', '6', '7', '8'];

const generateInitialBoard = () => {
    const board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if ((i + j) % 2 === 1) {
                if (i < 3) board[i][j] = 'black';
                else if (i > 4) board[i][j] = 'white';
            }
        }
    }
    return board;
};

const Board = () => {
    const [board, setBoard] = useState(generateInitialBoard());
    const [selected, setSelected] = useState(null);

    const handleCellClick = (row, col) => {
        if (selected && isValidMove(selected.row, selected.col, row, col, board)) {
            makeMove(selected.row, selected.col, row, col, board, setBoard);
            setSelected(null);
        } else if (board[row][col]) {
            setSelected({ row, col });
        } else if (selected && selected.row === row && selected.col === col) {
            setSelected(null);
        }
        else {
            alert('Invalid move!');
        }
    };

    return (
        <div className="chessboard-container">
            {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                    <div
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className="cell"
                        style={{
                            backgroundColor: selected && selected.row === rowIndex && selected.col === colIndex
                                ? onSelectedColor
                                : (rowIndex + colIndex) % 2 === 1
                                    ? blackCellColor
                                    : whiteCellColor,
                            color: (rowIndex + colIndex) % 2 === 1 ? textColorOnBlack : textColorOnWhite,
                        }}
                    >
                        {cell && (
                            <div
                                className="checker"
                                style={{
                                    backgroundColor: cell === 'black' ? 'black' : 'white',
                                }}
                            />
                        )}
                        {(colIndex === 0) && <div className="left-digits">{rowLabels[rowIndex]}</div>}
                        {(rowIndex === boardSize - 1) && <div className="bottom-letters">{columnLabels[colIndex]}</div>}
                    </div>
                ))
            )}
        </div>
    );
};

const isValidMove = (fromRow, fromCol, toRow, toCol, board) => {
    const player = board[fromRow][fromCol];
    const enemy = player === 'black' ? 'white' : 'black';

    const canCapture = (row, col) => {
        const directions = [
            [2, 2], [2, -2], [-2, 2], [-2, -2]
        ];
        let capturePossible = false;
        directions.forEach(([dr, dc]) => {
            const midRow = row + dr / 2;
            const midCol = col + dc / 2;
            const newRow = row + dr;
            const newCol = col + dc;
            if (
                newRow >= 0 && newRow < boardSize &&
                newCol >= 0 && newCol < boardSize &&
                board[midRow][midCol] === enemy &&
                board[newRow][newCol] === null
            ) {
                capturePossible = true;
            }
        });
        return capturePossible;
    };

    const canReachAfterCaptures = (row, col, toRow, toCol) => {
        const boardSize = board.length;
        const availableEnemyDirections = [
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];

        const afterCapturingPossiblePositions = [];

        availableEnemyDirections.forEach(([dr, dc]) => {
            const enemyRow = row + dr;
            const enemyCol = col + dc;
            const landingRow = row + 2 * dr;
            const landingCol = col + 2 * dc;

            if (enemyRow >= 0 && enemyRow < boardSize && enemyCol >= 0 && enemyCol < boardSize &&
                landingRow >= 0 && landingRow < boardSize && landingCol >= 0 && landingCol < boardSize &&
                board[enemyRow][enemyCol] === enemy && board[landingRow][landingCol] === null) {
                afterCapturingPossiblePositions.push([landingRow, landingCol]);
            }
        });

        return afterCapturingPossiblePositions.some(([newRow, newCol]) => {
            return newRow === toRow && newCol === toCol;
        });
    };

    const mustCapture = board.some((row, i) =>
        row.some((cell, j) => cell === player && canCapture(i, j))
    );

    if (mustCapture) {
        return canReachAfterCaptures(fromRow, fromCol, toRow, toCol);
    }

    if (player === 'black') {
        return (toRow - fromRow === 1 && Math.abs(fromCol - toCol) === 1 && board[toRow][toCol] === null)
    }
    if (player === 'white') {
        return (fromRow - toRow === 1 && Math.abs(fromCol - toCol) === 1 && board[toRow][toCol] === null)
    }
};

const makeMove = (fromRow, fromCol, toRow, toCol, board, setBoard) => {
    const newBoard = board.map(row => [...row]);

    if (Math.abs(fromRow - toRow) === 2) {
        const midRow = fromRow + (toRow - fromRow) / 2;
        const midCol = fromCol + (toCol - fromCol) / 2;
        newBoard[midRow][midCol] = null;
    }

    newBoard[fromRow][fromCol] = null;
    newBoard[toRow][toCol] = board[fromRow][fromCol];

    setBoard(newBoard);
};

export default Board;