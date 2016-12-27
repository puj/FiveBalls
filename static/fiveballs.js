var numCells = 12;
var cellSize = 50;

var numStartBalls = 10;
var numBallsPerTurn = 3;
var numBallTypes = 8;
var numBallsToCompleteRow = 3;

var numTurnsUntilNewBalls = 3;
var headerHeight = 150;
var gameBorderSize = 60;
var gameAreaSize = 800;

var scoreTextStyle = {
    font: "bold 50px Arial",
    fill: "green",
    align: "center"
};

var colorMap = [
    0xFF0000,
    0xFFAA00,
    0xFFFF00,
    0x0000FF,
    0x00FF00,
    0x00FFFF,
    0x8800AA,
    0xFF00FF,
    0x888800
];

var dirs = [
    [
        [
            1, 1
        ],
        [-1, -1]
    ],
    [
        [
            1, 0
        ],
        [-1, 0]
    ],
    [
        [
            0, 1
        ],
        [0, -1]
    ],
    [
        [
            -1, 1
        ],
        [1, -1]
    ]
];

function FiveBalls(PIXI) {
    this.PIXI = PIXI;
    this.score = 0;
    this.scoreSprite = null;

    this.init = function() {
        //Create the renderer
        var renderer = PIXI.autoDetectRenderer(800, 800);
        document.body.appendChild(renderer.view);
        var stage = new PIXI.Container();
        this.scoreContainer = new PIXI.Container();
        this.gameContainer = new PIXI.Container();
        this.upcomingContainer = new PIXI.Container();
        renderer.view.style.border = "1px dashed black";

        // Setup game container
        gameAreaSize = cellSize * numCells;
        this.gameContainer.x = gameBorderSize
        this.gameContainer.y = headerHeight + gameBorderSize
        this.gameContainer.width = gameAreaSize;
        this.gameContainer.height = gameAreaSize;

        // Setup score container
        this.scoreContainer.height = headerHeight;
        this.scoreContainer.width = this.gameContainer.width;
        this.scoreSprite = new PIXI.Text();
        this.scoreSprite.x = gameBorderSize;
        this.scoreSprite.y = gameBorderSize;
        this.scoreSprite.setStyle(scoreTextStyle);
        this.setScore(0);
        this.scoreContainer.addChild(this.scoreSprite);

        renderer.resize(gameBorderSize * 2 + gameAreaSize, gameBorderSize * 2 + gameAreaSize + headerHeight);
        renderer.backgroundColor = 0x223355;
        renderer.render(stage);

        var board = new Board(this.gameContainer);
        board.init(this.gameContainer);

        stage.addChild(this.gameContainer);
        stage.addChild(this.scoreContainer);
        stage.addChild(this.upcomingContainer);
        var gameLoop = function() {
            requestAnimationFrame(gameLoop);
            renderer.render(stage);
            update();
            render();
        }

        gameLoop();
    };

    this.addScore = function(numBalls) {
        FiveBalls.score = FiveBalls.score + (numBalls) + 2 * (numBalls - numBallsToCompleteRow)
        this.setScore(FiveBalls.score);
    }

    this.setScore = function(score) {
        this.scoreSprite.text = "Score : " + score;
    }

    function update() {};
    function render() {};
}

function Board(stage) {
    this.tileMatrix = new Array(numCells);
    this.ballMatrix = new Array(numCells);
    this.tileTexture = new PIXI.Texture.fromImage("static/tile.png")
    this.ballTexture = new PIXI.Texture.fromImage("static/ball.png")
    this.stage = stage;
    this.selectedBall = null;
    this.upcomingBallIndices = [];
    this.numTurns = 0;
    this.init = function() {
        // Init tiles
        for (var i = 0; i < numCells; i++) {
            this.tileMatrix[i] = new Array(numCells);
            for (var j = 0; j < numCells; j++) {
                this.addTile(i, j);
            }
        }

        // Init balls
        for (var i = 0; i < numCells; i++) {
            this.ballMatrix[i] = new Array(numCells);
        }

        // Place first balls
        var emptyTiles = this.findOpenTiles();
        var randomEmptyTiles = this.pickNRandomFrom(numStartBalls, emptyTiles);
        for (var i = 0; i < randomEmptyTiles.length; i++) {
            var emptyTile = randomEmptyTiles[i];
            var color = Math.floor(Math.random() * numBallTypes);
            this.addBall(emptyTile.x, emptyTile.y, color);
        }

        this.createNewUpcoming();
    }

    this.pickNRandomFrom = function(n, fromThis) {
        var ret = [];
        while (ret.length != n) {
            var randomIndex = Math.floor(Math.random() * fromThis.length);
            if (ret.indexOf(fromThis[randomIndex]) == -1) {
                ret.push(fromThis[randomIndex]);
            }
        }

        return ret;
    }

    this.findOpenTiles = function() {
        var empties = [];
        for (var i = 0; i < numCells; i++) {
            for (var j = 0; j < numCells; j++) {
                if (this.ballMatrix[i][j] == null) {
                    empties.push(this.tileMatrix[i][j]);
                }
            }
        }
        return empties;
    }

    this.createNewUpcoming = function() {
        for (var i = 0; i < numBallsPerTurn; i++) {
            this.upcomingBallIndices[i] = Math.floor(Math.random() * numBallTypes);
        }
    }

    this.addTile = function(x, y) {
        var board = this;
        var tileSprite = new PIXI.Sprite(this.tileTexture);
        var tile = new Tile(x, y, tileSprite);
        tileSprite.x = x * cellSize;
        tileSprite.y = y * cellSize;
        tileSprite.interactive = true;
        tileSprite.on('mouseup', function(mousedata) {
            board.tileClicked(tile);
        });
        this.stage.addChild(tileSprite);
        this.tileMatrix[x][y] = tile;
    }

    this.addBall = function(x, y, colorIndex) {
        var ballSprite = new PIXI.Sprite(this.ballTexture);
        ballSprite.x = this.getCoordsForCell(x, y)[0];
        ballSprite.y = this.getCoordsForCell(x, y)[1];
        ballSprite.tint = colorMap[colorIndex];
        var ball = new Ball(x, y, colorIndex, ballSprite);
        this.ballMatrix[x][y] = ball;
        this.stage.addChild(ballSprite);
    }

    this.moveBall = function(ball, x, y) {
        var coords = this.getCoordsForCell(x, y);
        this.ballMatrix[ball.x][ball.y] = null;
        ball.sprite.x = coords[0];
        ball.sprite.y = coords[1];
        ball.x = x;
        ball.y = y;
        this.ballMatrix[x][y] = ball;
    }

    this.removeBall = function(ball) {
        this.stage.removeChild(ball.sprite);
        this.ballMatrix[ball.x][ball.y] = null;
    }

    this.tileClicked = function(tile) {
        var ball = this.ballMatrix[tile.x][tile.y];
        if (ball != null) {
            if (this.selectedBall) {
                this.tileMatrix[this.selectedBall.x][this.selectedBall.y].deselect();
            }
            this.selectedBall = ball;
            tile.select();
        } else {
            if (this.selectedBall) {
                this.tileMatrix[this.selectedBall.x][this.selectedBall.y].deselect();
                this.moveBall(this.selectedBall, tile.x, tile.y);
                this.selectedBall = null;
                this.numTurns = this.numTurns + 1;
                this.checkNextTurnsConditions();
            }
        }
    }

    this.inBounds = function(x, y) {
        return x >= 0 && y >= 0 && x < numCells && y < numCells;
    }

    this.checkNextTurnsConditions = function() {
        // Process 5+ in a row
        for (var i = 0; i < numCells; i++) {
            for (var j = 0; j < numCells; j++) {
                var ball = this.ballMatrix[i][j];
                if (ball == null) {
                    continue;
                }
                for (var k = 0; k < dirs.length; k++) {
                    var ballsInRow = [ball];
                    for (var di = 0; di < 2; di++) {
                        var countInDir = 1;
                        while (true) {
                            var newX = i + countInDir * dirs[k][di][0];
                            var newY = j + countInDir * dirs[k][di][1];
                            if (!this.inBounds(newX, newY)) {
                                break;
                            }

                            var newBall = this.ballMatrix[newX][newY];
                            if (newBall == null || newBall.colorIndex != ball.colorIndex) {
                                break;
                            }
                            countInDir = countInDir + 1;

                            ballsInRow.push(newBall);
                        }

                    }

                    if (ballsInRow.length >= numBallsToCompleteRow) {
                        for (var ii = 0; ii < ballsInRow.length; ii++) {
                            this.removeBall(ballsInRow[ii]);
                        }
                        FiveBalls.addScore(ballsInRow.length);
                    }
                }
            }
        }

        // Get empties
        var empties = this.findOpenTiles();

        if (this.numTurns % numTurnsUntilNewBalls == 0) {
            //Add new random balls
            var randomPlacements = this.pickNRandomFrom(numBallsPerTurn, empties);
            console.log("Turn " + this.numTurns + " with empties : " + randomPlacements);
            for (var i = 0; i < this.upcomingBallIndices.length; i++) {
                var tile = randomPlacements[i];
                console.log("Adding ball at " + tile.x + ", " + tile.y);
                this.addBall(tile.x, tile.y, this.upcomingBallIndices[i]);
            }
            this.createNewUpcoming();
        }
    }

    this.getCoordsForCell = function(x, y) {
        return [
            x * cellSize,
            y * cellSize
        ];
    }
}

function Tile(x, y, sprite) {
    this.x = x;
    this.y = y;
    this.sprite = sprite;

    this.select = function() {
        this.sprite.tint = 0x888888;
    }
    this.deselect = function() {
        this.sprite.tint = 0xffffff;
    }
}

function Ball(x, y, colorIndex, sprite) {
    this.x = x;
    this.y = y;
    this.colorIndex = colorIndex;
    this.sprite = sprite;

    this.onClick = function(mouseEvent) {}

}