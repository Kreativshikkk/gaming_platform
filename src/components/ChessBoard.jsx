import React, {useEffect, useState} from 'react';
import '../styles/ChessBoard.css';
import {MessageType} from "../MessageTypes.js";
import {Man, King} from "../server/CheckersStructure.js";

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
                if (i < 3) board[i][j] = new Man('black', i, j);
                else if (i > 4) board[i][j] = new Man('white', i, j);
            }
        }
    }
    return board;
};

const invertedBoard = (board) => {
    const newBoard = [];
    for (let i = boardSize - 1; i >= 0; i--) {
        newBoard.push(board[i].slice().reverse());
    }
    return newBoard;
}

const Board = ({isGameReady, roomId, userId, socket, usersInRoom}) => {

    const [board, setBoard] = useState(generateInitialBoard());
    const [selected, setSelected] = useState(null);
    const [moving, setMoving] = useState('white');

    let color;
    if (isGameReady) {
        color = usersInRoom.filter(user => user.userId === userId)[0]?.userColor;
    }

    useEffect(() => {
        if (color === 'black') {
            setBoard(invertedBoard(generateInitialBoard()));
        }
        if (!isGameReady) {
            setBoard(generateInitialBoard());
        }
    }, [color, isGameReady]);

    useEffect(() => {
        const onBoardUpdate = (data) => {
            console.log(usersInRoom);
            if (color === 'white') {
                setBoard(data.board);
            } else {
                setBoard(invertedBoard(data.board));
            }
            setMoving(data.moving);
        }

        socket.on(MessageType.UPDATE_BOARD, onBoardUpdate);

        return () => {
            socket.off(MessageType.UPDATE_BOARD, onBoardUpdate);
        };
    }, [socket, userId, usersInRoom, color]);

    useEffect(() => {
        const onInvalidMove = () => {
            alert('Invalid move!');
        }

        socket.on(MessageType.INVALID_MOVE, onInvalidMove);

        return () => {
            socket.off(MessageType.INVALID_MOVE, onInvalidMove);
        };
    }, [socket]);

    const handleCellClick = (row, col) => {
        if (!isGameReady) {
            alert('Waiting for another player');
            return;
        }
        if (selected) {
            let fromRow, fromCol, toRow, toCol;
            if (color === 'black') {
                fromRow = boardSize - selected.row - 1
                fromCol = boardSize - selected.col - 1
                toRow = boardSize - row - 1
                toCol = boardSize - col - 1
            } else if (color === 'white') {
                fromRow = selected.row
                fromCol = selected.col
                toRow = row
                toCol = col
            }
            socket.emit(MessageType.MAKE_MOVE, {
                userId: userId,
                roomId: roomId,
                fromRow: fromRow,
                fromCol: fromCol,
                toRow: toRow,
                toCol: toCol
            });
            setSelected(null);
        } else if (board[row][col] && board[row][col].color === color && moving === color) {
            setSelected({row, col});
        } else if (selected && selected.row === row && selected.col === col) {
            setSelected(null);
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
                        {cell && (cell instanceof Man) && (
                            <div
                                className="checker"
                                style={{
                                    backgroundColor: cell.color === 'black' ? 'black' : 'white',
                                }}
                            />
                        )}
                        {cell && (cell instanceof King) && (
                            <div
                                className="checker-king"
                                style={{
                                    backgroundColor: cell.color === 'black' ? 'black' : 'white',
                                    color: cell.color === 'black' ? 'white' : 'black',
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

export default Board;