(function(brambles){
    function getJson(url){
        var request = new XMLHttpRequest();

        request.open('GET', url, false);
        request.send(null);
        return JSON.parse(request.responseText);
    }

    var canvas = document.getElementById('gameCanvas');

    var options = getJson('options.json');
    console.log(options);

    var game = new brambles.Game();

    var socket = io();
    socket.on('state', function(state){
        game.updateState(state);
    });

    var view = new brambles.GameView(game, canvas, socket, options);
    function animate(){
        view.update();
        requestAnimationFrame(animate);
    }
    animate();

    function mouseMoveHandler(event){
        socket.emit('position', {
            'x': event.pageX - this.offsetLeft,
            'y': event.pageY - this.offsetTop
        });
    }
    canvas.addEventListener('mouseenter', function(){
        canvas.addEventListener('mousemove', mouseMoveHandler);
    });
    canvas.addEventListener('mouseleave', function(){
        canvas.removeEventListener('mousemove', mouseMoveHandler);
    });
})(brambles);
