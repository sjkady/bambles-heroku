(function(brambles){
    function extend(){
        var result = {};
        Array.prototype.slice.call(arguments).forEach(function(object){
            for (var key in object){
                if (result[key] === undefined) {
                    result[key] = object[key];
                } else if(typeof result[key] == 'object' && typeof object[key] == 'object') {
                    result[key] = extend(result[key], object[key]);
                }
            }
        });
        return result;
    }

    var Game = brambles.Game = function(){
        this.updateState({
            'players': [],
            'zombies': []
        });
    };
    Game.prototype.updateState = function(state) {
        this.state = state;
    };

    var GameView = brambles.GameView = function(game, canvas, socket, options){
        this.options = extend(options || {}
                              , { 'width': 640, 'height': 640 }
                              , { 'players' : {'fillStyle': 'blue', 'radius': 10 }}
                              , { 'zombies': { 'fillStyle': 'orange', 'radius': 10 }});
        this.game = game;
        this.canvas = canvas;
        this.socket = socket;
        this.context = this.canvas.getContext('2d');

        this.initialize();
    };
    GameView.prototype.initialize = function(){
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
    };
    GameView.prototype.update = function(){
        this.clear();
        this.paintPlayers();
        this.paintZombies();
    };
    GameView.prototype.clear = function(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };
    GameView.prototype.paintPlayers = function(){
        this.paintObjects(this.game.state.players, this.options.players);
    };
    GameView.prototype.paintZombies= function(){
        this.paintObjects(this.game.state.zombies, this.options.zombies);
    };
    GameView.prototype.paintObjects = function(objects, options){
        var socketId = this.socket.id;
        var ctx = this.context;
        objects.forEach(function(object){
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
})(window.bramble = window.bramble || {});
