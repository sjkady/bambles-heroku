(function(brambles) {
    function extend() {
        var result = {};
        Array.prototype.slice.call(arguments).forEach(function(object) {
            for (var key in object) {
                if (result[key] === undefined) {
                    result[key] = object[key];
                } else if (typeof result[key] == 'object' && typeof object[key] == 'object') {
                    result[key] = extend(result[key], object[key]);
                }
            }
        });
        return result;
    }

    var Game = brambles.Game = function() {
        this.updateState({
            'players': [],
            'dead': []
        });
    };
    Game.prototype.updateState = function(state) {
        this.state = state;
    };

    var GameView = brambles.GameView = function(game, canvas, socket, options) {
        this.options = extend(options || {}, {
            'width': 640,
            'height': 640
        }, {
            'players': {
                'fillStyle': 'blue',
                'radius': 10
            }
        }, {
            'dead': {
                'fillStyle': 'orange',
                'radius': 10
            }
        });
        this.game = game;
        this.canvas = canvas;
        this.socket = socket;
        this.context = this.canvas.getContext('2d');

        this.initialize();
    };

    GameView.prototype.rectangle = function(left, top, width, height) {
        this.left = left || 0;
        this.top = top || 0;
        this.width = width || 0;
        this.height = height || 0;
        this.right = this.left + this.width;
        this.bottom = this.top + this.height;
        rectangle.prototype.set = function(left, top, width, height) {
            this.left = left;
            this.top = top;
            this.width = width || this.width;
            this.height = height || this.height;
            this.right = this.left + this.width;
            this.bottom = this.top + this.height;
        };
        rectangle.prototype.within = function(r) {
            return r.left <= this.left && r.right >= this.right && r.top <= this.top && r.bottom >= this.bottom;
        };
        rectangle.prototype.overlaps = function(r) {
            return this.left < r.right && r.left < this.right && this.top < r.bottom && r.top < this.bottom;
        };
    };

    GameView.prototype.camera = function(xView, yView) {
        // position of camera (left-top coordinate)
        this.xView = xView || 0;
        this.yView = yView || 0;
        // distance from followed object to border before camera starts move
        this.xDeadZone = 0;
        // min distance to horizontal borders
        this.yDeadZone = 0;
        // min distance to vertical borders
        // viewport dimensions
        this.wView = this.options.width;
        this.hView = this.options.height;
        // allow camera to move in vertical and horizontal axis
        this.axis = this.options.axis;
        // object that should be followed
        this.followed = null;
        // rectangle that represents the viewport
        this.viewportRect = this.rectangle(this.xView, this.yView, this.wView, this.hView);
        // rectangle that represents the world's boundary (room's boundary)
        this.worldRect = this.rectangle(0, 0, this.options.room.width, this.options.room.height);
        camera.prototype.follow = function(gameObject, xDeadZone, yDeadZone) {
            this.followed = gameObject;
            this.xDeadZone = xDeadZone;
            this.yDeadZone = yDeadZone;
        };
        camera.prototype.update = function() {
            // keep following the player (or other desired object)
            if (this.followed !== null) {
                if (this.axis == AXIS.HORIZONTAL || this.axis == AXIS.BOTH) {
                    // moves camera on horizontal axis based on followed object position
                    if (this.followed.x - this.xView + this.xDeadZone > this.wView) {
                        this.xView = this.followed.x - (this.wView - this.xDeadZone);
                    } else if (this.followed.x - this.xDeadZone < this.xView) {
                        this.xView = this.followed.x - this.xDeadZone;
                    }
                }
                if (this.axis == AXIS.VERTICAL || this.axis == AXIS.BOTH) {
                    // moves camera on vertical axis based on followed object position
                    if (this.followed.y - this.yView + this.yDeadZone > this.hView) {
                        this.yView = this.followed.y - (this.hView - this.yDeadZone);
                    } else if (this.followed.y - this.yDeadZone < this.yView) {
                        this.yView = this.followed.y - this.yDeadZone;
                    }
                }
            }
            // update viewportRect
            this.viewportRect.set(this.xView, this.yView);
            // don't let camera leaves the world's boundary
            if (!this.viewportRect.within(this.worldRect)) {
                if (this.viewportRect.left < this.worldRect.left)
                    this.xView = this.worldRect.left;
                if (this.viewportRect.top < this.worldRect.top)
                    this.yView = this.worldRect.top;
                if (this.viewportRect.right > this.worldRect.right)
                    this.xView = this.worldRect.right - this.wView;
                if (this.viewportRect.bottom > this.worldRect.bottom)
                    this.yView = this.worldRect.bottom - this.hView;
            }
        };
    };

    GameView.prototype.map = function(options) {
      this.image = null;
      map.prototype.generate = function() {
        var ctx = document.createElement('canvas').getContext('2d');
        var row = Math.floor(this.options.width/10)+1;
        var colums = Math.floor(this.options.height/2)+1;
        ctx.save();
        for (var x = 0, i = 0; i < rows; x += 10, i++) {
          for (var y = 0, j = 0; j < columns; y += 10, j++) {
            ctx.beginPath();
            ctx.globalAlpha = 0.7;
            ctx.rect(x, y, 15, 15);
            ctx.fillStyle = 'rgb(' + (10 + (Math.random() * 55 | 0)) + ',' + (40 + (Math.random() * 75 | 0)) + ',' + (10 + (Math.random() * 25 | 0)) + ')';
            ctx.fill();
            ctx.closePath();
          }
        }
        ctx.restore();
        this.image = new Image();
        this.image.src = ctx.canvas.toDataURL('image/png');
        // clear context
        ctx = null;
      };
      map.prototype.draw = function(xView, yView) {
        var sx, sy, dx, dy;
        var sWidth, sHeight, dWidth, dHeight;
        var ctx = this.context;
        // offset point to crop the image
        sx = xView;
        sy = yView;
        sWidth = ctx.canvas.width;
        sHeight = ctx.canvas.height;
        // if cropped image is smaller than canvas we need to change the source dimensions
        if (this.image.width - sx < sWidth) {
          sWidth = this.image.width - sx;
        }
        if (this.image.height - sy < sHeight) {
          sHeight = this.image.height - sy;
        }
        // location on canvas to draw the croped image
        dx = 0;
        dy = 0;
        // match destination with source to not scale the image
        dWidth = sWidth;
        dHeight = sHeight;
        ctx.drawImage(this.image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
      };
    };

    GameView.prototype.initialize = function() {
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        this.room.map.generate();
        objects.forEach(function(object)
        {
          if (object.id == socketId)
          {
            var camera = new GameView.camera(0, 0, this.canvas.width, this.canvas.height, this.options.room.width, this.options.room.height);
            camera.follow(object, this.canvas.width, this.canvas.height);
          }
        }.bind(this));
    };
    GameView.prototype.update = function() {
        this.clear();
        this.paintPlayers();
        this.paintDead();
    };
    GameView.prototype.clear = function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };
    GameView.prototype.paintPlayers = function() {
        this.paintObjects(this.game.state.players, this.options.players);
    };
    GameView.prototype.paintDead = function() {
        this.paintObjects(this.game.state.dead, this.options.dead);
    };
    GameView.prototype.paintObjects = function(objects, options) {
        var socketId = this.socket.id;
        var ctx = this.context;
        objects.forEach(function(object) {
            if (object.id == socketId) {
                ctx.fillStyle = this.options.fillStyle;
            } else {
                ctx.fillStyle = options.fillStyle;
            }
            ctx.beginPath();
            ctx.arc(object.x, object.y, options.radius, 0, 2 * Math.PI);
            ctx.fill();
        }.bind(this));
    };
})(window.brambles = window.brambles || {});
