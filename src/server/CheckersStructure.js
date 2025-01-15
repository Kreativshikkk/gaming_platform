class Piece {
    constructor(color) {
        this.color = color;
    }

    isValidMove(fromRow, fromCol, toRow, toCol, board) {
    }

    canCaptureMore(fromRow, fromCol, board) {
    }

    makeMove(fromRow, fromCol, toRow, toCol, board) {
    }

    canMakeMove(board) {}
}

export class Man extends Piece {
    color;
    row;
    col;
    type;

    constructor(color, row, col) {
        super(color);
        this.color = color;
        this.row = row;
        this.col = col;
        this.type = 'man';
    }

    canMakeMove(board) {
        const directions = this.color === 'black' ? [[1, 1], [1, -1]] : [[-1, 1], [-1, -1]];
        const boardSize = board.length;

        for (let [dRow, dCol] of directions) {
            const newRow = this.row + dRow;
            const newCol = this.col + dCol;

            if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize && board[newRow][newCol] === null) {
                return true;
            }

            if (this.canCaptureMore(this.row, this.col, board)) {
                return true;
            }
        }

        return false;
    }

    isValidMove(fromRow, fromCol, toRow, toCol, board) {
        const mustCapture = board.some((row, i) =>
            row.some((cell, j) => cell !== null && cell.color === this.color && cell.canCaptureMore(i, j, board))
        );

        if (mustCapture) {
            const midRow = fromRow + (toRow - fromRow) / 2;
            const midCol = fromCol + (toCol - fromCol) / 2;
            const enemy = this.color === 'black' ? 'white' : 'black';
            return this.canCaptureMore(fromRow, fromCol, board) && Math.abs(fromRow - toRow) === 2 && Math.abs(fromCol - toCol) === 2
                && board[toRow][toCol] === null && board[midRow][midCol] && board[midRow][midCol].color === enemy;
            //we'll need to fix this shit...
        }

        if (this.color === 'black') {
            return (toRow - fromRow === 1 && Math.abs(fromCol - toCol) === 1 && board[toRow][toCol] === null)
        }
        if (this.color === 'white') {
            return (fromRow - toRow === 1 && Math.abs(fromCol - toCol) === 1 && board[toRow][toCol] === null)
        }
    }

    canCaptureMore(row, col, board){
        const enemy = this.color === 'black' ? 'white' : 'black';
        const boardSize = board.length;
        const availableEnemyDirections = [
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];
        return availableEnemyDirections.some(([dr, dc]) => {
            const enemyRow = row + dr;
            const enemyCol = col + dc;
            const landingRow = row + 2 * dr;
            const landingCol = col + 2 * dc;
            return enemyRow >= 0 && enemyRow < boardSize && enemyCol >= 0 && enemyCol < boardSize &&
                landingRow >= 0 && landingRow < boardSize && landingCol >= 0 && landingCol < boardSize &&
                board[enemyRow][enemyCol] !== null &&
                board[enemyRow][enemyCol].color === enemy && board[landingRow][landingCol] === null;
        });
    };

    makeMove(fromRow, fromCol, toRow, toCol, board) {
        const newBoard = board.map(row => [...row]);
        const moveDistance = Math.abs(fromRow - toRow);

        if (moveDistance === 2) {
            const midRow = fromRow + (toRow - fromRow) / 2;
            const midCol = fromCol + (toCol - fromCol) / 2;
            newBoard[midRow][midCol] = null;
        }

        newBoard[fromRow][fromCol] = null;
        newBoard[toRow][toCol] = board[fromRow][fromCol];

        this.row = toRow;
        this.col = toCol;

        if ((toRow === 7 && this.color === 'black') || (toRow === 0 && this.color === 'white')) {
            newBoard[toRow][toCol] = new King(this.color, toRow, toCol);
            const piece = newBoard[toRow][toCol];
            if (piece.canCaptureMore(toRow, toCol, newBoard)) {
                return {board: newBoard, moving: this.color};
            }
            else {
                return {board: newBoard, moving: this.color === 'white' ? 'black' : 'white'};
            }
        }

        board = newBoard;
        let moving;

        if (moveDistance === 2 && this.canCaptureMore(toRow, toCol, board)) {
            moving = this.color;
        } else {
            moving = this.color === 'white' ? 'black' : 'white';
        }

        return {board: board, moving: moving};
    }
}

export class King extends Piece {
    color;
    row;
    col;
    type;
    constructor(color, row, col) {
        super(color);
        this.color = color;
        this.row = row;
        this.col = col;
        this.type = 'king';
    }

    canMakeMove(board) {
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        const boardSize = board.length;

        if (this.canCaptureMore(this.row, this.col, board)) {
            return true;
        }

        for (let [dRow, dCol] of directions) {
            let newRow = this.row + dRow;
            let newCol = this.col + dCol;

            while (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
                if (board[newRow][newCol] === null) {
                    return true;
                }
                newRow += dRow;
                newCol += dCol;
            }
        }

        return false;
    }

    isValidMove(fromRow, fromCol, toRow, toCol, board) {
        const enemy = this.color === 'black' ? 'white' : 'black';
        const boardSize = board.length;
        const dRow = Math.sign(toRow - fromRow);
        const dCol = Math.sign(toCol - fromCol);

        if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) {
            return false;
        }

        let pathClear = true;
        let enemyCaptured = false;
        let steps = Math.abs(toRow - fromRow);

        for (let i = 1; i <= steps; i++) {
            let checkRow = fromRow + i * dRow;
            let checkCol = fromCol + i * dCol;
            let currentPiece = board[checkRow][checkCol];

            if (currentPiece === null) {

            } else if (currentPiece.color === enemy && !enemyCaptured) {
                enemyCaptured = i !== steps && checkRow + dRow >= 0 && checkRow + dRow < boardSize &&
                checkCol + dCol >= 0 && checkCol + dCol < boardSize &&
                board[checkRow + dRow][checkCol + dCol] === null;
                if (i === steps) {
                    pathClear = false;
                }
                if (!enemyCaptured) {
                    break;
                }
            } else {
                pathClear = false;
                break;
            }
        }

        const mustCapture = board.some((row, i) =>
            row.some((cell, j) => cell !== null && cell.color === this.color && cell.canCaptureMore(i, j, board))
        );

        if (mustCapture) {
            return this.canCaptureMore(fromRow, fromCol, board) && enemyCaptured && pathClear;
        }

        return pathClear && (!enemyCaptured || (enemyCaptured && steps > 1));
    }

    canCaptureMore(fromRow, fromCol, board) {
        const enemy = this.color === 'black' ? 'white' : 'black';
        const boardSize = board.length;
        const directions = [
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];

        for (let [dRow, dCol] of directions) {
            let checkRow = fromRow + dRow;
            let checkCol = fromCol + dCol;

            while (checkRow >= 0 && checkRow < boardSize && checkCol >= 0 && checkCol < boardSize) {
                if (board[checkRow][checkCol] !== null) {
                    if (board[checkRow][checkCol].color === enemy &&
                        checkRow + dRow >= 0 && checkRow + dRow < boardSize &&
                        checkCol + dCol >= 0 && checkCol + dCol < boardSize &&
                        board[checkRow + dRow][checkCol + dCol] === null) {
                        return true;
                    }
                    break;
                }
                checkRow += dRow;
                checkCol += dCol;
            }
        }

        return false;
    }

    makeMove(fromRow, fromCol, toRow, toCol, board) {
        let captured = this.canCaptureMore(fromRow, fromCol, board);
        const newBoard = board.map(row => [...row]);
        const dRow = Math.sign(toRow - fromRow);
        const dCol = Math.sign(toCol - fromCol);
        const steps = Math.abs(toRow - fromRow);

        for (let i = 1; i <= steps; i++) {
            let checkRow = fromRow + i * dRow;
            let checkCol = fromCol + i * dCol;
            newBoard[checkRow][checkCol] = null;
        }

        newBoard[fromRow][fromCol] = null;
        newBoard[toRow][toCol] = board[fromRow][fromCol];

        this.row = toRow;
        this.col = toCol;

        board = newBoard;
        let moving;

        if (captured && this.canCaptureMore(toRow, toCol, board)) {
            moving = this.color;
        } else {
            moving = this.color === 'white' ? 'black' : 'white';
        }

        return {board: board, moving: moving};
    }
}