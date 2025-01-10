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

    isValidMove(fromRow, fromCol, toRow, toCol, board) {
        const enemy = this.color === 'black' ? 'white' : 'black';

        const canReachAfterCaptures = (row, col, toRow, toCol, board) => {
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
                    board[enemyRow][enemyCol] !== null &&
                    board[enemyRow][enemyCol].color === enemy && board[landingRow][landingCol] === null) {
                    afterCapturingPossiblePositions.push([landingRow, landingCol]);
                }
            });

            return afterCapturingPossiblePositions.some(([newRow, newCol]) => {
                return newRow === toRow && newCol === toCol;
            });
        };

        const canCapture = (row, col) => {
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

        const mustCapture = board.some((row, i) =>
            row.some((cell, j) => cell !== null && cell.color === this.color && canCapture(i, j, board))
        );

        if (mustCapture) {
            return canReachAfterCaptures(fromRow, fromCol, toRow, toCol, board);
        }

        if (this.color === 'black') {
            return (toRow - fromRow === 1 && Math.abs(fromCol - toCol) === 1 && board[toRow][toCol] === null)
        }
        if (this.color === 'white') {
            return (fromRow - toRow === 1 && Math.abs(fromCol - toCol) === 1 && board[toRow][toCol] === null)
        }
    }

    canCaptureMore(row, col, board) {
        return this.isValidMove(row, col, row + 2, col + 2, board) ||
            this.isValidMove(row, col, row + 2, col - 2, board) ||
            this.isValidMove(row, col, row - 2, col + 2, board) ||
            this.isValidMove(row, col, row - 2, col - 2, board);
    }

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
}