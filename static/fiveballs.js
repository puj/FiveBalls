var numCells = 12;
var cellSize = 50;
var borderSize = 50;

var numStartBalls = 10;
var numBallsPerTurn = 3;
var numBallTypes = 8;

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
        console.log("Hey");
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
    this.init = function() {
        // Init tiles
        for (var i = 0; i < numCells; i++) {
            this.tileMatrix = new Array(numCells);
            for (var j = 0; j < numCells; j++) {
              this.addTile(i,j);
            }
        }

        // Init balls
        for (var i = 0; i < numCells; i++) {
            this.ballMatrix[i] = new Array(numCells);
        }

        // Place first balls
        var count = numStartBalls;
        while (count > 0) {
            var x = Math.floor(Math.random() * numCells);
            var y = Math.floor(Math.random() * numCells);
            if (this.ballMatrix[x][y] != null) {
                continue;
            }

            var color = Math.floor(Math.random() * numBallTypes);
            this.addBall(x, y, color);
            count = count - 1;
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
    }

    this.addBall = function(x, y, colorIndex) {
        var ballSprite = new PIXI.Sprite(this.ballTexture);
        ballSprite.x = this.getCoordsForCell(x, y)[0];
        ballSprite.y = this.getCoordsForCell(x, y)[1];
        ballSprite.tint = colorMap[colorIndex];
        var ball = new Ball(x, y, ballSprite);

        this.ballMatrix[x][y] = ball;
        this.stage.addChild(ballSprite);
    }

    this.moveBall = function(ball, x, y) {
        var coords = this.getCoordsForCell(x, y);
        ball.ballSprite.x = coords[0];
        ball.ballSprite.y = coords[1];
    }

    this.removeBall = function(ball) {
        this.stage.removeChild(ballSprite);
        this.ballMatrix[ball.x,
            ball.y] = null;
    }

    this.tileClicked = function(tile) {
        var ball = this.ballMatrix[tile.x][tile.y];
        if (ball != null) {
            console.log("From board, ball clicked : " + ball.x + " , " + ball.y);
        } else {

            console.log("From board, tiled clicked : " + tile.x + " , " + tile.y);
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

function Ball(x, y, colorIndex) {
    this.x = x;
    this.y = y;
    this.colorIndex = colorIndex;

    this.onClick = function(mouseEvent) {}

}