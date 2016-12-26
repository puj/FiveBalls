var numCells = 12;
var cellSize = 50;
var borderSize = 50;

var numStartBalls = 10;
var numBallsPerTurn = 3;
var numBallTypes = 8;

var numTurnsUntilNewBalls = 3;

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

function FiveBalls(PIXI) {
    this.PIXI = PIXI;

    this.init = function() {
        //Create the renderer
        var renderer = PIXI.autoDetectRenderer(256, 256);
        document.body.appendChild(renderer.view);
        var stage = new PIXI.Container();
        renderer.view.style.border = "1px dashed black";

        var width = numCells * cellSize + 2 * borderSize;
        var height = numCells * cellSize + 2 * borderSize;

        renderer.resize(width, height);
        renderer.backgroundColor = 0x223355;
        renderer.render(stage);
        console.log("Starting game loop");
        var board = new Board(stage);
        board.init(stage);

        var gameLoop = function() {
            requestAnimationFrame(gameLoop);
            renderer.render(stage);
            update();
            render();
        }

        gameLoop();
    };

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
        tileSprite.x = borderSize + x * cellSize;
        tileSprite.y = borderSize + y * cellSize;
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
        this.stage.removeChild(ballSprite);
        this.ballMatrix[ball.x,
            ball.y] = null;
    }

    this.tileClicked = function(tile) {
        var ball = this.ballMatrix[tile.x][tile.y];
        if (ball != null) {
            this.selectedBall = ball;
        } else {
            if (this.selectedBall) {
                this.moveBall(this.selectedBall, tile.x, tile.y);
                this.selectedBall = null;
                this.numTurns = this.numTurns + 1;
                this.checkNextTurnsConditions();
            }
        }
    }

    this.checkNextTurnsConditions = function() {
        // Process 5+ in a row
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
            borderSize + x * cellSize,
            borderSize + y * cellSize
        ];
    }
}

function Tile(x, y, sprite) {
    this.x = x;
    this.y = y;
    this.sprite = sprite;
}

function Ball(x, y, colorIndex, sprite) {
    this.x = x;
    this.y = y;
    this.colorIndex = colorIndex;
    this.sprite = sprite;

    this.onClick = function(mouseEvent) {}

}