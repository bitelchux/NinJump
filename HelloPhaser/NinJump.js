var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var NinJump;
(function (NinJump) {
    var ScreenSetting = (function () {
        function ScreenSetting(_width, _height) {
            this.scaleHeight = _height * 1.0 / 1080;
            this.scaleWidth = _width * 1.0 / 1920;
            this.height = _height;
            this.width = _width;
            this.keepWidth = this.scaleWidth > this.scaleHeight;
            this.scale = this.keepWidth ? this.scaleWidth : this.scaleHeight;
        }
        return ScreenSetting;
    })();
    var screenSetting;
    function GetScreenSetting() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        return new ScreenSetting(width, height);
    }
    var Ninja = (function (_super) {
        __extends(Ninja, _super);
        function Ninja(game, x, y) {
            _super.call(this, game, x, y, 'ninja');
            game.physics.enable(this, Phaser.Physics.ARCADE);
            this.gravity = 1000 * screenSetting.scale;
            this.animations.add('idle', [0, 3, 6, 9]);
            this.animations.add('jumpUp', [10, 12, 13, 14]);
            this.animations.add('jumpDown', [15, 17, 18, 19]);
            this.state = 'jumping';
            this.jumpPower = 0;
            this.anchor.set(0.5);
            this.lastPole = null;
            this.scale.setTo(screenSetting.scale);
        }
        return Ninja;
    })(Phaser.Sprite);
    var Pole = (function (_super) {
        __extends(Pole, _super);
        function Pole(play, x, y, key) {
            var game = play.game;
            _super.call(this, game, x, y, key);
            game.physics.enable(this, Phaser.Physics.ARCADE);
            this._game = play;
            this.body['immovable'] = true;
            this.scale.setTo(screenSetting.scale);
            this.anchor.setTo(0.5, 0);
            this.downVelocity = 50 * screenSetting.scaleHeight;
        }
        Pole.prototype.update = function () {
            var game = this._game;
            if (game.ninja.state == 'jumping') {
                this.body['velocity']['x'] = game.ninja.jumpPower;
            }
            else {
                this.body['velocity']['x'] = 0;
            }
            if (this.x < (0 - this.width / 2)) {
                //pole is out of the screen
                this.destroy();
                game.addNewPoles();
            }
        };
        return Pole;
    })(Phaser.Sprite);
    var Background = (function (_super) {
        __extends(Background, _super);
        function Background(play, x) {
            _super.call(this, play.game, x, 0, 'backgroundScene');
            this._play = play;
            this.scale.setTo(screenSetting.scale);
            this.anchor.setTo(0, 0);
            play.game.physics.enable(this);
        }
        Background.prototype.update = function () {
            var game = this._play;
            if (game.ninja.state == 'jumping') {
                this.body['velocity']['x'] = game.ninja.jumpPower * 0.15;
            }
            else {
                this.body['velocity']['x'] = 0;
            }
            if (this.x < 0 - this.width) {
                //out of the screen
                //destroy and add a new background
                var backgroundGroup = game.backgroundGroup;
                var latestChild = backgroundGroup.getAt(backgroundGroup.length - 3);
                var newX = latestChild.x + latestChild.width;
                var newBackground = new Background(this._play, newX - 5);
                backgroundGroup.add(newBackground);
                backgroundGroup.remove(this, true, true);
            }
        };
        return Background;
    })(Phaser.Sprite);
    var Play = (function (_super) {
        __extends(Play, _super);
        function Play() {
            _super.apply(this, arguments);
            this.minPoleGap = 250 * screenSetting.scale;
            this.maxPoleGap = 500 * screenSetting.scale;
            this.minPoleHeight = 500 * screenSetting.scale;
            this.maxPoleHeight = 800 * screenSetting.scale;
            this.startPosition = 400 * screenSetting.scale;
            this.powerBarPosition = 20 * screenSetting.scale;
        }
        Play.prototype.preload = function () {
            this.load.atlasJSONArray('ninja', 'Graphics/ninja/ninja.png', 'Graphics/ninja/ninja2.json');
            this.load.image('squarePole', 'Graphics/scene/Tiles/tile_Square.png');
            this.load.image('trianglePole', 'Graphics/scene/Tiles/tile_Triangle.png');
            this.load.image('powerbar', 'Graphics/assets/powerbar2.png');
            this.load.image('backgroundScene', 'Graphics/scene/BG/background.png');
            this.load.image('scoreboard', 'Graphics/assets/scoreboard.png');
            this.load.image('replaybutton', 'Graphics/assets/replaybutton.png');
            this.load.image('facebookbutton', 'Graphics/assets/facebook_icon.png');
        };
        Play.prototype.create = function () {
            this.largestPoleNumber = 0;
            this.game.physics.startSystem(Phaser.Physics.ARCADE);
            //background 
            this.backgroundGroup = new Phaser.Group(this.game);
            var background1 = new Background(this, 0);
            var background2 = new Background(this, background1.x + background1.width - 5);
            var background3 = new Background(this, background2.x + background2.width - 5);
            this.backgroundGroup.add(background1);
            this.backgroundGroup.add(background2);
            this.backgroundGroup.add(background3);
            //score
            this.score = 0;
            this.scoreText = this.game.make.text(this.game.width - 100, 10, this.score.toString(), {
                font: "bold 22px Comic Sans MS",
                fill: "black"
            });
            this.game.add.existing(this.scoreText);
            this.poleGroup = new Phaser.Group(this.game);
            this.ninja = new Ninja(this.game, this.startPosition, 100);
            this.add.existing(this.ninja);
            this.ninja.body['gravity']['y'] = this.ninja.gravity;
            this.ninja.lastPole = this.addPole(this.startPosition);
            this.input.onDown.add(this.prepareToJump, this);
            this.ninja.animations.play('jumpDown', 7, false);
        };
        Play.prototype.update = function () {
            //get the scene moving
            var _this = this;
            //check for collision
            this.game.physics.arcade.collide(this.ninja, this.poleGroup, function (ninja, pole) {
                _this.checkLanding(ninja, pole, _this);
            });
            if (this.ninja.y > this.game.height && this.ninja.state != 'died') {
                //ninja died
                this.ninja.state = 'died';
                this.die();
            }
        };
        Play.prototype.die = function () {
            var _this = this;
            this.scoreBoard = this.add.bitmapData(this.game.width, this.game.height);
            var boardImg = new Phaser.Image(this.game, this.game.width / 2, this.game.height / 3, 'scoreboard', 0);
            this.scoreBoard.fill(10, 10, 10, 0.6);
            this.scoreBoard.addToWorld();
            boardImg.anchor.setTo(0.5);
            boardImg.scale.setTo(screenSetting.scale);
            //score
            topScore = Math.max(this.score, topScore);
            var yourscoreText = this.game.make.text(boardImg.x, boardImg.y - boardImg.height / 6, "Your score: " + this.score.toString(), {
                font: "bold 30px Comic Sans MS",
                fill: "white"
            });
            yourscoreText.anchor.set(0.5, 0.5);
            var topScoreText = this.game.make.text(boardImg.x, boardImg.y + boardImg.height / 8, "Top score: " + topScore.toString(), {
                font: "bold 30px Comic Sans MS",
                fill: "white"
            });
            topScoreText.anchor.set(0.5, 0.5);
            //replay button
            var replayButton = new NinJumpButton(this.game, this.game.width * 2 / 3, this.game.height * 5 / 8, 'replaybutton');
            replayButton.scale.setTo(screenSetting.scale);
            replayButton.onButtonClick(this, function () {
                _this.game.state.restart();
            });
            var facebookButton = new NinJumpButton(this.game, this.game.width / 3, this.game.height * 5 / 8, 'facebookbutton');
            facebookButton.scale.setTo(screenSetting.scale);
            facebookButton.onButtonClick(this, function () {
                //this.game.state.restart();
                if (FB) {
                    FB.ui({
                        method: 'feed',
                        link: 'http://ninjump.azurewebsites.net/',
                        caption: 'I got ' + _this.score + ' On NinJump',
                    }, function (response) { });
                }
            });
            this.scoreBoard.draw(boardImg);
            this.scoreBoard.draw(yourscoreText);
            this.scoreBoard.draw(topScoreText);
        };
        Play.prototype.addNewPoles = function () {
            var maxPoleX = 0;
            this.poleGroup.forEach(function (pole) {
                maxPoleX = Math.max(pole.x, maxPoleX);
            }, this);
            var nextPolePosition = maxPoleX + this.game.rnd.between(this.minPoleGap, this.maxPoleGap);
            this.addPole(nextPolePosition);
        };
        Play.prototype.addPole = function (x) {
            if (x < this.game.width + this.maxPoleGap * 2) {
                var poleType = this.game.rnd.between(0, 1);
                var newPole = new Pole(this, x, this.game.rnd.between(this.minPoleHeight, this.maxPoleHeight), poleType == 0 ? 'squarePole' : 'trianglePole');
                newPole.poleNumber = this.largestPoleNumber;
                this.largestPoleNumber++;
                this.poleGroup.add(newPole);
                var nextPolePosition = x + this.game.rnd.between(this.minPoleGap, this.maxPoleGap);
                this.addPole(nextPolePosition);
                return newPole;
            }
            return null;
        };
        Play.prototype.prepareToJump = function () {
            if (this.ninja.state == 'idle') {
                this.powerBar = this.add.sprite(this.ninja.x - this.ninja.width / 2, this.ninja.y - this.ninja.height / 2 - this.powerBarPosition, 'powerbar');
                this.powerBar.width = 0;
                this.powerTween = this.add.tween(this.powerBar);
                this.powerTween.to({
                    width: 100 * screenSetting.scale,
                }, 1000, Phaser.Easing.Linear.None, true);
                this.input.onDown.remove(this.prepareToJump, this);
                this.input.onUp.add(this.jump, this);
            }
        };
        Play.prototype.jump = function () {
            var ninjaJumpPower = -this.powerBar.width * 5 - 100;
            this.powerBar.destroy();
            this.tweens.removeAll();
            this.ninja.body['velocity']['y'] = ninjaJumpPower * 2;
            this.ninja.jumpPower = ninjaJumpPower;
            this.ninja.state = 'jumping';
            this.powerTween.stop();
            this.ninja.animations.stop();
            this.ninja.animations.play('jumpUp', 5, false);
            this.input.onUp.remove(this.jump, this);
            if (this.ninja.lastPole != null) {
                this.ninja.lastPole.body.velocity.y = 0;
            }
        };
        Play.prototype.updateScore = function (diff) {
            if (diff != 0) {
                this.score += Math.pow(2, diff);
                //display
                this.scoreText.text = this.score.toString();
            }
        };
        Play.prototype.checkLanding = function (ninja, pole, game) {
            if (ninja.body.velocity.y == 0) {
                //ninja landed on the pole
                if (ninja.state == 'jumping') {
                    //first touch
                    ninja.state = 'idle';
                    //listen to jump action
                    game.input.onDown.add(game.prepareToJump, game);
                    ninja.animations.stop();
                    ninja.animations.play('idle', 5, true);
                    if (ninja.x != game.startPosition) {
                        ninja.x = game.startPosition;
                    }
                    //update score
                    var diff = pole.poleNumber - ninja.lastPole.poleNumber;
                    ninja.lastPole = pole;
                    game.updateScore(diff);
                    pole.body.velocity.y = pole.downVelocity;
                }
            }
            else {
                if (ninja.state == 'jumping') {
                    ninja.state = 'falling';
                }
            }
        };
        return Play;
    })(Phaser.State);
    var NinJumpButton = (function (_super) {
        __extends(NinJumpButton, _super);
        function NinJumpButton(game, x, y, key) {
            _super.call(this, game, x, y, key);
            this.scale.setTo(screenSetting.scale);
            this.anchor.setTo(0.5);
            this.onInputDown.add(function (button) {
                var buttontween = game.add.tween(button.scale);
                buttontween.to({ x: 0.8 * screenSetting.scale, y: 0.8 * screenSetting.scale }, 100, Phaser.Easing.Linear.None, true);
            });
            this.onInputUp.add(function (button) {
                var buttontween = game.add.tween(button.scale);
                buttontween.to({ x: screenSetting.scale, y: screenSetting.scale }, 100, Phaser.Easing.Linear.None, true);
            }, this, 2);
            game.add.existing(this);
        }
        NinJumpButton.prototype.onButtonClick = function (caller, callback) {
            this.onInputUp.add(callback, caller, 1);
        };
        return NinJumpButton;
    })(Phaser.Button);
    var Intro = (function (_super) {
        __extends(Intro, _super);
        function Intro() {
            _super.apply(this, arguments);
        }
        Intro.prototype.preload = function () {
            this.load.image('logo', 'Graphics/assets/logo.png');
            this.load.image('playbutton', 'Graphics/assets/playButton.png');
        };
        Intro.prototype.create = function () {
            var _this = this;
            this.introImage = this.add.sprite(screenSetting.width / 2, screenSetting.height / 3, 'logo');
            this.introImage.anchor.setTo(0.5, 0.5);
            this.introImage.scale.setTo(0.5 * screenSetting.scale);
            this.stage.backgroundColor = "#87CEEB";
            var introTween = this.add.tween(this.introImage.scale);
            introTween.to({
                x: screenSetting.scale, y: screenSetting.scale,
            }, 2000, Phaser.Easing.Bounce.Out, true);
            var instructionText = this.game.make.text(this.game.width / 2, this.introImage.y + this.introImage.height, 'Hold the screen to gain jump power', {
                font: "bold 30px Comic Sans MS",
                fill: "white",
                wordWrap: true,
                wordWrapWidth: this.game.width * 3 / 4,
                align: 'center',
            });
            instructionText.anchor.set(0.5, 0);
            this.game.add.existing(instructionText);
            var button = new NinJumpButton(this.game, screenSetting.width / 2, instructionText.y + instructionText.height * 1.5, 'playbutton');
            button.anchor.setTo(0.5, 0);
            button.onButtonClick(this, function () {
                _this.game.state.start('play');
            });
        };
        return Intro;
    })(Phaser.State);
    var Game = (function (_super) {
        __extends(Game, _super);
        function Game() {
            var gameConfig;
            screenSetting = GetScreenSetting();
            console.log(screenSetting);
            gameConfig = {};
            gameConfig.width = screenSetting.width;
            gameConfig.height = screenSetting.height;
            gameConfig.renderer = Phaser.AUTO;
            gameConfig.parent = 'content';
            _super.call(this, gameConfig);
            this.state.add('intro', Intro);
            this.state.add('play', Play);
            this.state.start('intro');
        }
        return Game;
    })(Phaser.Game);
    NinJump.Game = Game;
})(NinJump || (NinJump = {}));
//# sourceMappingURL=NinJump.js.map