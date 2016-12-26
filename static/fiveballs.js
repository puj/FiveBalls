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
    this.init = function() {
        // Init tiles
        for (var i = 0; i < numCells; i++) {
            this.tileMatrix = new Array(numCells);
            for (var j = 0; j < numCells; j++) {
                var tile = new PIXI.Sprite(this.tileTexture);
                tile.x = borderSize + i * cellSize;
                tile.y = borderSize + j * cellSize;
                this.stage.addChild(tile);
            }
        }

        // Init balls
        for (var i = 0; i < numCells; i++) {
            this.ballMatrix[i] = new Array(numCells);
        }
        
        
    }

    this.addBall = function(x, y, colorIndex) {
        var ballSprite = new PIXI.Sprite(this.ballTexture);
        ballSprite.x = borderSize + x * cellSize;
        ballSprite.y = borderSize + y * cellSize;
        ballSprite.tint = colorMap[colorIndex];
        this.ballMatrix[x][y] = new Ball(x, y, ballSprite);
        this.stage.addChild(ballSprite);
    }

    this.removeBall = function(ball) {
        this.stage.removeChild(ballSprite);
        this.ballMatrix[ball.x,
            ball.y] = null;
    }
}

function Ball(x, y, colorIndex) {
    this.x = x;
    this.y = y;
    this.colorIndex = colorIndex;
}