var numCells = 12;
var cellSize = 50;

var numStartBalls = 10;
var numBallsPerTurn = 3;
var numBallTypes = 8;
var numBallsToCompleteRow = 5;

var numTurnsUntilNewBalls = 1;
var headerHeight = 80;
var gameBorderSize = 60;
var gameAreaSize = 600;

var movementThreshold = .5;
var speed = 50;

var dropballSound = "dropballSound";
var clearSound = "clearSound";

var scoreTextStyle = {
    font: "bold 50px Arial",
    fill: "white",
    align: "center"
};

var colorMap = [
    0xFF0000,
    0xFFAA00,
    0xFFFF00,
    0x0000FF,
    0x00CC00,
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
    this.tileTexture = new PIXI.Texture.fromImage("static/tile.png")
    this.ballTexture = new PIXI.Texture.fromImage("static/ball.png")

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

        // Setup upcoming balls container
        this.upcomingContainer.height = headerHeight;
        this.upcomingContainer.width = this.gameContainer.width;
        this.upcomingContainer.x = gameBorderSize + gameAreaSize / 2;
        this.upcomingContainer.y = gameBorderSize;

        this.upcomingBallSprites = [];
        for (var i = 0; i < 3; i++) {
            var ballSprite = new PIXI.Sprite(FiveBalls.ballTexture);
            ballSprite.x = i * cellSize;
            ballSprite.y = 0;
            this.upcomingContainer.addChild(ballSprite);
            this.upcomingBallSprites[i] = ballSprite;
        }

        renderer.resize(gameBorderSize * 2 + gameAreaSize, gameBorderSize * 2 + gameAreaSize + headerHeight);
        renderer.backgroundColor = 0x223355;
        renderer.render(stage);

        this.loadSounds();

        var board = new Board(this.gameContainer);
        board.init(this.gameContainer);

        stage.addChild(this.gameContainer);
        stage.addChild(this.scoreContainer);
        stage.addChild(this.upcomingContainer);
        var gameLoop = function() {
            requestAnimationFrame(gameLoop);
            renderer.render(stage);
            board.update();
            render();
        }

        gameLoop();
    };

    this.loadSounds = function() {
        createjs.Sound.registerSound("static/dropball.wav", dropballSound);
        createjs.Sound.registerSound("static/clear.wav", clearSound);
    }

    this.playSound = function(soundId) {
        createjs.Sound.play(soundId);
    }

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
    this.ballPathMatrix = new Array(numCells);
    this.stage = stage;
    this.selectedBall = null;
    this.upcomingBallIndices = [];
    this.numTurns = 0;
    this.currentTarget = null;

    this.init = function() {
        // Init tiles
        for (var i = 0; i < numCells; i++) {
            this.tileMatrix[i] = new Array(numCells);
            this.ballPathMatrix[i] = new Array(numCells);
            for (var j = 0; j < numCells; j++) {
                this.ballPathMatrix[i][j] = 0;
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

    this.update = function() {
        if (this.path == null || this.selectedBall == null) {
            return;
        }
        console.log("Current target : " + this.currentTarget);
        console.log("Selected ball : " + this.selectedBall);
        this.currentTarget = this.path[0];

        var dx = this.currentTarget.sprite.x - this.selectedBall.sprite.x;
        var dy = this.currentTarget.sprite.y - this.selectedBall.sprite.y;
        var length = Math.abs(dx) + Math.abs(dy);

        if (length <= movementThreshold) {
            this.path.shift();
            if (this.path.length == 0) {
                this.moveBall(this.selectedBall, this.currentTarget.x, this.currentTarget.y);
                this.numTurns = this.numTurns + 1;
                var clearedSomething = this.checkNextTurnsConditions();
                if (clearedSomething) {
                    FiveBalls.playSound(clearSound);

                } else {
                    FiveBalls.playSound(dropballSound);
                }
                this.selectedBall = null;
                this.currentTarget = null;
                this.path = null;
            }

        } else {
            dx = dx / length;
            dy = dy / length;
            this.selectedBall.sprite.x += dx * speed;
            this.selectedBall.sprite.y += dy * speed;
        }
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
            FiveBalls.upcomingBallSprites[i].tint = colorMap[this.upcomingBallIndices[i]];
        }
    }

    this.addTile = function(x, y) {
        var board = this;
        var tileSprite = new PIXI.Sprite(FiveBalls.tileTexture);
        var tile = new Tile(x, y, tileSprite);
        tileSprite.x = x * cellSize;
        tileSprite.y = y * cellSize;
        tileSprite.interactive = true;
        tileSprite.on('mouseup', function(mousedata) {
            board.tileClicked(tile);
        });
        this.stage.addChild(tileSprite);
        this.tileMatrix[x][y] = tile;
        tile.deselect();
    }

    this.addBall = function(x, y, colorIndex) {
        var ballSprite = new PIXI.Sprite(FiveBalls.ballTexture);
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
        if (this.currentTarget != null) {
            return;
        }

        var ball = this.ballMatrix[tile.x][tile.y];
        if (ball != null) {
            if (this.selectedBall) {
                this.tileMatrix[this.selectedBall.x][this.selectedBall.y].deselect();
            }
            this.selectedBall = ball;
            tile.select();
        } else {
            if (this.selectedBall) {
                var selectedTile = this.tileMatrix[this.selectedBall.x][this.selectedBall.y];
                this.path = this.findPath(selectedTile, tile);

                selectedTile.deselect();
                if (this.path == null) {
                    return;
                }
            }
        }
    }

    this.findPath = function(from, to) {
        var path = [];
        var closed = [];
        var open = [from];
        var cameFrom = {};
        var gs = {};
        var fs = {};

        for (var i = 0; i < numCells; i++) {
            for (var j = 0; j < numCells; j++) {
                gs[this.tileMatrix[i][j]] = 99999999;
                fs[this.tileMatrix[i][j]] = 99999999;
            }

        }
        gs[from] = 0;
        fs[from] = from.dist(to);

        var count = 0;
        while (open.length != 0) {
            var curr = this.getLowestInMap(open, fs);
            if (curr == to) {
                // reconstruct
                while (curr != from) {
                    path.unshift(curr);
                    count = count + 1;
                    curr = cameFrom[curr];
                }
                return path;
            }

            closed.push(curr);
            var neighbors = this.getNeighbors(curr.x, curr.y);
            for (var i = 0; i < neighbors.length; i++) {
                var neighbor = neighbors[i];
                if (closed.indexOf(neighbor) != -1) {
                    continue;
                }
                var tentativeGScore = gs[curr] + curr.dist(neighbor);
                if (open.indexOf(neighbor) == -1) {
                    open.push(neighbor);
                } else if (tentativeGScore >= gs[neighbor]) {
                    continue;
                }

                cameFrom[neighbor] = curr;
                gs[neighbor] = tentativeGScore;
                fs[neighbor] = gs[neighbor] + neighbor.dist(to);
            }

        }
        return null;
    }

    this.getLowestInMap = function(list, map) {
        var lowestIndex = 0;
        for (var i = 0; i < list.length; i++) {
            if (map[list[i]] < map[list[lowestIndex]]) {
                lowestIndex = i;
            }
        }

        var ret = list[lowestIndex];
        list.splice(lowestIndex, 1);
        return ret;
    }

    this.getNeighbors = function(x, y) {
        var neighbors = [];
        for (var i = -1; i <= 1; i++) {
            for (var j = -1; j <= 1; j++) {
                if (i == j || (i != 0 && j != 0)) {
                    continue;
                }
                var newX = x + i;
                var newY = y + j;
                if (!this.inBounds(newX, newY)) {
                    continue;
                }

                if (this.ballMatrix[newX][newY] != null) {
                    continue;
                }
                neighbors.push(this.tileMatrix[newX][newY]);
            }
        }
        return neighbors;
    }

    this.inBounds = function(x, y) {
        return x >= 0 && y >= 0 && x < numCells && y < numCells;
    }

    this.checkNextTurnsConditions = function() {
        var clearedSomething = false;
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
                        clearedSomething = true;
                    }
                }
            }
        }

        if (!clearedSomething) {
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

        return clearedSomething;
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
        if ((x + y) % 2 == 0) {
            this.sprite.tint = 0x555555;
        } else {
            this.sprite.tint = 0x555555;
        }
    }
    this.deselect = function() {
        if ((x + y) % 2 == 0) {
            this.sprite.tint = 0xffffff;
        } else {
            this.sprite.tint = 0xCCCCCC;
        }
    }

    this.dist = function(otherBall) {
        return Math.pow(this.x - otherBall.x, 2) + Math.pow(this.y - otherBall.y, 2);
    }

    Tile.prototype.toString = function tileToString() {
        return this.x + ", " + this.y;
    };
}

function Ball(x, y, colorIndex, sprite) {
    this.x = x;
    this.y = y;
    this.colorIndex = colorIndex;
    this.sprite = sprite;

    this.onClick = function(mouseEvent) {}

}