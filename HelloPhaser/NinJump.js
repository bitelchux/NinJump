var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var NinJump;
(function (NinJump) {
    var ScreenSetting = (function () {
        function ScreenSetting(width, height) {
            this.scaleHeight = height * 1.0 / 1080;
            this.scaleWidth = width * 1.0 / 1920;
            if (this.scaleWidth > this.scaleHeight) {
                this.height = height;
                this.width = height * 1.0 * 1920 / 1080;
                this.keepWidth = false;
            }
            else {
                this.width = width;
                this.height = width * 1.0 * 1080 / 1920;
                this.keepWidth = true;
            }
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
            this.gravity = 800;
            this.animations.add('idle', [0, 3, 6, 9]);
            this.animations.add('jumpUp', [10, 12, 13, 14]);
            this.animations.add('jumpDown', [15, 17, 18, 19]);
            this.state = 'idle';
            this.jumpPower = 0;
            this.anchor.set(0.5);
            this.lastPole = 1;
            this.scale.setTo(screenSetting.keepWidth ? screenSetting.scaleWidth : screenSetting.scaleHeight);
        }
        return Ninja;
    })(Phaser.Sprite);
    var Pole = (function (_super) {
        __extends(Pole, _super);
        function Pole(play, x, y) {
            var game = play.game;
            _super.call(this, game, x, y, 'pole');
            game.physics.enable(this, Phaser.Physics.ARCADE);
            this._game = play;
            this.body['immovable'] = true;
            this.scale.setTo(screenSetting.keepWidth ? screenSetting.scaleWidth : screenSetting.scaleHeight);
            this.anchor.setTo(0.5, 0);
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
            this.scale.setTo(screenSetting.keepWidth ? screenSetting.scaleWidth : screenSetting.scaleHeight);
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
            this.minPoleGap = 250 * (screenSetting.keepWidth ? screenSetting.scaleWidth : screenSetting.scaleHeight);
            this.maxPoleGap = 400 * (screenSetting.keepWidth ? screenSetting.scaleWidth : screenSetting.scaleHeight);
            this.minPoleHeight = 600 * (screenSetting.keepWidth ? screenSetting.scaleWidth : screenSetting.scaleHeight);
            this.maxPoleHeight = 800 * (screenSetting.keepWidth ? screenSetting.scaleWidth : screenSetting.scaleHeight);
            this.startPosition = 400 * (screenSetting.keepWidth ? screenSetting.scaleWidth : screenSetting.scaleHeight);
            this.powerBarPosition = 20 * (screenSetting.keepWidth ? screenSetting.scaleWidth : screenSetting.scaleHeight);
        }
        Play.prototype.preload = function () {
            this.load.atlasJSONArray('ninja', 'Graphics/ninja/ninja.png', 'Graphics/ninja/ninja2.json');
            this.load.image('pole', 'Graphics/scene/Tiles/tile_Square.png');
            this.load.image('powerbar', 'Graphics/assets/powerbar.png');
            this.load.image('backgroundScene', 'Graphics/scene/BG/background.png');
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
            //this.add.existing(background1);
            //var bg = this.add.sprite(0, 0, 'backgroundScene');
            this.poleGroup = new Phaser.Group(this.game);
            this.ninja = new Ninja(this.game, this.startPosition, 100);
            this.add.existing(this.ninja);
            this.ninja.body['gravity']['y'] = this.ninja.gravity;
            this.addPole(this.startPosition);
            this.input.onDown.add(this.prepareToJump, this);
            this.ninja.animations.play('idle', 7, true);
        };
        Play.prototype.update = function () {
            //get the scene moving
            var _this = this;
            //check for collision
            this.game.physics.arcade.collide(this.ninja, this.poleGroup, function (ninja, pole) {
                _this.checkLanding(ninja, pole, _this);
            });
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
                var newPole = new Pole(this, x, this.game.rnd.between(this.minPoleHeight, this.maxPoleHeight));
                newPole.poleNumber = this.largestPoleNumber;
                this.largestPoleNumber++;
                this.poleGroup.add(newPole);
                var nextPolePosition = x + this.game.rnd.between(this.minPoleGap, this.maxPoleGap);
                this.addPole(nextPolePosition);
            }
        };
        Play.prototype.prepareToJump = function () {
            if (this.ninja.body['velocity']['y'] == 0) {
            }
            this.powerBar = this.add.sprite(this.ninja.x - this.ninja.width / 2, this.ninja.y - this.ninja.height / 2 - this.powerBarPosition, 'powerbar');
            this.powerBar.width = 0;
            this.powerTween = this.add.tween(this.powerBar);
            this.powerTween.to({
                width: 100 * screenSetting.scaleWidth,
            }, 1000, Phaser.Easing.Linear.None, true);
            this.input.onDown.remove(this.prepareToJump, this);
            this.input.onUp.add(this.jump, this);
        };
        Play.prototype.jump = function () {
            var ninjaJumpPower = -this.powerBar.width * 3 - 100;
            this.powerBar.destroy();
            this.tweens.removeAll();
            this.ninja.body['velocity']['y'] = ninjaJumpPower * 2;
            this.ninja.jumpPower = ninjaJumpPower;
            this.ninja.state = 'jumping';
            this.powerTween.stop();
            this.ninja.animations.stop();
            this.ninja.animations.play('jumpUp', 5, false);
            this.input.onUp.remove(this.jump, this);
        };
        Play.prototype.checkLanding = function (ninja, pole, game) {
            if (ninja.body.velocity.y == 0) {
                //ninja landed on the pole
                var border = ninja.x - pole.x;
                if (ninja.state == 'jumping' && ninja.body.velocity.y == 0) {
                    ninja.state = 'idle';
                    //listen to jump action
                    game.input.onDown.add(game.prepareToJump, game);
                    ninja.animations.stop();
                    ninja.animations.play('idle', 5, true);
                    if (ninja.x != game.startPosition) {
                        ninja.x = game.startPosition;
                    }
                }
            }
            else {
                ninja.state = 'falling';
            }
        };
        return Play;
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
            _super.call(this, gameConfig);
            this.state.add('play', Play);
            this.state.start('play');
        }
        return Game;
    })(Phaser.Game);
    NinJump.Game = Game;
})(NinJump || (NinJump = {}));
//# sourceMappingURL=NinJump.js.map