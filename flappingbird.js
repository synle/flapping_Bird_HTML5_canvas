(function() {
    //canvas related
    var canvas = document.getElementById('myCanvas');
    var statusText = document.getElementById('statusText');
    var context = canvas.getContext('2d');
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
    var offsetX = 0;
    var offsetY = 0;
    var r = 20;
    var lineStroke = 2;
    var lockOn = false;
    var lineStrokeCenter = 5;
    var step = 0.5;
    //constants
    var TUBE_CONSTANT = {
        gap: 120, //vertical gap between the top half and bottom half
        width: 50, //width of the tube
        distance: 200, //distance between tube
        heightDelta: 200, //height difference for nearby tube
        total: 10 //maximum total amount of tube
    }
    var BIRD_CONSTANT = {}
    var PHYSICS_CONSTANT = {
            gravity: -10, //drag bird down
            birdMovement: 5, //bird movement
            birdFlap: 20
        }
        //stuffs
    var upforce = 0; //upforce that keep bird up
    var countPassTube = 0;//count of how many tubes have passed
    var isOver = false;
    var updateLoop, updateTubesLoop;//event loop
    
    //offset x and y
    offsetX = canvasWidth / 8;//offset the bird
    
    function drawCircle(r, centerx, centery) {
        context.fillStyle = '#000000';
        for (var i = 1; i < 360; i += step) {
            var x = r * Math.cos(i);
            var y = r * Math.sin(i);
            plot(context, x + centerx, y + centery, lineStroke);
        }
        context.fillStyle = '#00ff00';
        plot(context, centerx, centery, centery % 2 ? lineStrokeCenter : lineStrokeCenter + 4);
    }

    function plot(context, x, y, thickness) {
        context.fillRect(x, y, thickness, thickness);
    }

    function drawRect(x, y, w, h) {
        if (arguments.length === 4){
            context.beginPath();
            context.rect(x, y, w, h);
            context.fillStyle = 'yellow';
            context.fill();
            context.lineWidth = 5;
            context.strokeStyle = 'black';
            context.stroke();
        }
        else{
            var rect = arguments[0];
            drawRect(rect.x, rect.y, rect.w, rect.h);
        }
    }
    
    function getTopHalfBox(tube){
        var x = tube.x - TUBE_CONSTANT.width / 2;
        var y = 0;
        var w = TUBE_CONSTANT.width;
        var h = tube.y - TUBE_CONSTANT.gap / 2;
        
        return {
            x : x,
            y : y,
            w : w,
            h : h,
        }
    }
    
    function getBottomHalfBox(tube){
        var x = tube.x - TUBE_CONSTANT.width / 2;
        var y = 0;
        var w = TUBE_CONSTANT.width;
        var h = tube.y - TUBE_CONSTANT.gap / 2;
        y = h + TUBE_CONSTANT.gap;
        h = canvasHeight;
        
        return {
            x : x,
            y : y,
            w : w,
            h : h,
        }
    }

    function drawTube(tube) {
        var topTube = getTopHalfBox(tube);
        var bottomTube = getBottomHalfBox(tube);
        
        drawRect(topTube);
        drawRect(bottomTube);
    }

    function drawTubes() {
            for (var i = 0; i < visibleTubes.length; i++) {
                drawTube(visibleTubes[i]);
            }
        }
        //generate new tube
    function generateTube() {
        if (visibleTubes.length > TUBE_CONSTANT.total)
            return;
        var maxX = 0;
        for (var i = 0; i < visibleTubes.length; i++) {
            if (maxX < visibleTubes[i].x)
                maxX = visibleTubes[i].x;
        }
        if (maxX > canvasWidth - TUBE_CONSTANT.width - TUBE_CONSTANT.distance)
            return;
        var x = canvasWidth;
        var y = 0;
        var lastY = visibleTubes.length === 0 ? 0 : visibleTubes[visibleTubes.length - 1].y;
        while (y < TUBE_CONSTANT.gap || y + TUBE_CONSTANT.gap / 2 > canvasHeight || lastY - y > TUBE_CONSTANT.heightDelta) {
            y = Math.random() * canvasHeight;
        }
        visibleTubes.push({
            x: x,
            y: y
        });
    }

    function youfail() {
        console.log('you fail');
        statusText.innerHTML = 'You failed with score of ' + countPassTube + '. Press enter to restart';
        clearInterval(updateLoop);
        clearInterval(updateTubesLoop);
        
        //reset the time
        countPassTube = 0;
        isOver = true;
    }
    
    function isBirdCollided(circle, rect){
        return isPointBoundedInRect(circle, rect);
        //return isPointBoundedInRect({x : circle.x + circle.r, y: circle.y - circle.r}, rect) === false
        //&& isPointBoundedInRect({x : circle.x + circle.r, y: circle.y + circle.r }, rect) === false;
    }
    
    function isPointBoundedInRect(pt, rect){
        return pt.x >= rect.x && pt.x <= rect.x + rect.w
        && pt.y >= rect.y && pt.y <= rect.y + rect.h;
    }
    
    
    function newGame(){
        isOver = false;
        countPassTube = 0;
        visibleTubes = [];
        
        //recap circle offset
        offsetY = canvasWidth / 4;//reset offset y
        
        //update drag based on gravity
        updateLoop = setInterval(function() {
            statusText.innerHTML = countPassTube;
            context.clearRect(0, 0, canvas.width, canvas.height);
            //tube
            //move tubes;
            var updatedVisibleTubes = [];
            for (var i = 0; i < visibleTubes.length; i++) {
                visibleTubes[i].x -= PHYSICS_CONSTANT.birdMovement;
                //if (visibleTubes[i].x < offsetX){
                    //already passed, increase counter
                //    countPassTube++;
                //}
                
                //if it moved pass the endpoint, hide it
                if (visibleTubes[i].x > 0){
                    updatedVisibleTubes.push(visibleTubes[i]);
                }
                
                if (visibleTubes[i].x <= 0){
                    countPassTube++;
                }
            }
            
            if (visibleTubes.length != updatedVisibleTubes.length){
                visibleTubes = updatedVisibleTubes;
            }
                
            // generate and draw tube
            drawTubes();
            //bird stuffs
            if (upforce > 0)
                upforce--;
            //offsetY adjusted by gravity, upforce, and gravity pull as it gets close to the ground
            var isYouFail = false;
            offsetY += -1 * (upforce + PHYSICS_CONSTANT.gravity + 0.1 * PHYSICS_CONSTANT.gravity * (canvasHeight - offsetY) / canvasHeight);
            drawCircle(r, offsetX, offsetY);
            if (r + offsetY > canvasHeight || offsetY - r <= 0) {
                isYouFail = true;
            }
            
            
            //check for the first coming box
            var firstTube = updatedVisibleTubes[0];
            var topTube = getTopHalfBox(firstTube);
            var bottomTube = getBottomHalfBox(firstTube);
            
            //check for collision for top segment
            if (isBirdCollided({x : offsetX, y : offsetY, r : r}, topTube)){
                isYouFail = true;
            }
            
            //check for collision for bottom segment
            if (isBirdCollided({x : offsetX, y : offsetY, r : r}, bottomTube)){
                isYouFail = true;
            }
        


            //you fail, then show error
            if (isYouFail){
                youfail();
            }
        }, 50);
        
        
        updateTubesLoop = setInterval(function() {
            generateTube();
        }, 1000);
    }
    
    //flapping
    canvas.onclick = function() {
        upforce = PHYSICS_CONSTANT.birdFlap;
    }

    document.onkeypress = function(e) {
        switch(e.charCode){
            case 32://spacebar
                upforce = PHYSICS_CONSTANT.birdFlap;
                break;
            case 13://enter to refresh
                if (isOver === true){
                    isOver = false;
                    newGame();//make a new game
                }
                break;
        }
    }

    newGame();
})();