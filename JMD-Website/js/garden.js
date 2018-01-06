//######################SETUP##########################

//VARS parametric influencing parameters
var garden = {
	size: 9000,
	scaleW: 1680, //width for which was designed for (everything should be scaled down for smaller size - not done yet)
	// sectionPoints: {
	// 	a:{
	// 		[0, 200], //white_1
	// 		[400, 500], //threequaterwhite_1
	// 		[700, 900], //halfwhite_1
	// 		[1100,1150], //quaterwhite_1
	// 		[1400, 1800], //onpixel_1
	// 		[2500, 2900], //blackend/start
	// 		[3300, 3500], //onepixel_2
	// 		[3600, 3800], //quaterwhite_2
	// 		[4000, 4500], //halfwhite_2
	// 		[4700, 4900], //threequaterwhite_2
	// 		[5100, 5500]
	// 	}
	// }
}

var pillar = {
	active: true, //determines wheather the pillars
	size: 300, //sets the size of the pillars
	color: "black",
	points: [ //x,y coordinates for the pillars on the canvas
		{x: 0, y: 0},
		{x: 170, y: 500},
		{x: 170, y: 2450},
		{x: 170, y: 5230},
		{x: 476, y: 1218},
		{x: 476, y: 3222},
		{x: 476, y: 4610},
		{x: 1088, y: 213},
		{x: 1088, y: 2736},
		{x: 1394, y: 1296},
		{x: 1394, y: 3444},
	]
}

var lightShaft = {
	active: false, //determinates wheather the shaft is drawn
	x1: 0,
	x2: 0,
	y1: 0, //start of the shaft
	y2: 0, //end of the shaft
	middle: {
		width: 1, //size of the shaft
		color: "white"
	},
	border: {
		width: 1, //size of the surrounding border
		opacity: 1
	}
}

var lightSpot = {
	active: false, //determines whaether light spot is active (visually)
	x: 0,
	y: 0,
	opacity: 0,
	width: 400,
	height: 1000,
	image: new Image()
}

var shadow = {
	active: true,
	background: "rgba(1, 0, 0, 0.3)", //color of the background
	color: "black", //not linked with css yet
	intersections: {
		color: "rgba(100,100,100,0.1)", //color of the shadow overlays
		fuzzyness: 40 //spreading of the light, also relates to the lightshaft-size
	}
}


//BOOLEANS
var updateCanvas = true;


//VARS GENERIC (changed during the sketch)
var windowOffset = 0;

var Mouse = {
	x: 0,
	y: 0
};


// linking objects to the html
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");


// Necessary for storing the points of the pillars
var segments = [];

//relations
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;


//#####################FUNCTIONS#######################

//updating functions:

// Find intersection of RAY & SEGMENT
function getIntersection(ray,segment){

	// RAY in parametric: Point + Delta*T1
	var r_px = ray.a.x;
	var r_py = ray.a.y;
	var r_dx = ray.b.x-ray.a.x;
	var r_dy = ray.b.y-ray.a.y;

	// SEGMENT in parametric: Point + Delta*T2
	var s_px = segment.a.x;
	var s_py = segment.a.y;
	var s_dx = segment.b.x-segment.a.x;
	var s_dy = segment.b.y-segment.a.y;

	// Are they parallel? If so, no intersect
	var r_mag = Math.sqrt(r_dx*r_dx+r_dy*r_dy);
	var s_mag = Math.sqrt(s_dx*s_dx+s_dy*s_dy);
	if(r_dx/r_mag==s_dx/s_mag && r_dy/r_mag==s_dy/s_mag){
		// Unit vectors are the same.
		return null;
	}

	// SOLVE FOR T1 & T2
	// r_px+r_dx*T1 = s_px+s_dx*T2 && r_py+r_dy*T1 = s_py+s_dy*T2
	// ==> T1 = (s_px+s_dx*T2-r_px)/r_dx = (s_py+s_dy*T2-r_py)/r_dy
	// ==> s_px*r_dy + s_dx*T2*r_dy - r_px*r_dy = s_py*r_dx + s_dy*T2*r_dx - r_py*r_dx
	// ==> T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx)
	var T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx);
	var T1 = (s_px+s_dx*T2-r_px)/r_dx;

	// Must be within parametic whatevers for RAY/SEGMENT
	if(T1<0) return null;
	if(T2<0 || T2>1) return null;

	// Return the POINT OF INTERSECTION
	return {
		x: r_px+r_dx*T1,
		y: r_py+r_dy*T1,
		param: T1
	};
}

//calculates the shadow-polygons
function getSightPolygon(sightX,sightY){

	// Get all unique points
	var points = (function(segments){
		var a = [];
		segments.forEach(function(seg){
			a.push(seg.a,seg.b);
		});
		return a;
	})(segments);
	var uniquePoints = (function(points){
		var set = {};
		return points.filter(function(p){
			var key = p.x+","+p.y;
			if(key in set){
				return false;
			}else{
				set[key]=true;
				return true;
			}
		});
	})(points);

	// Get all angles
	var uniqueAngles = [];
	for(var j=0;j<uniquePoints.length;j++){
		var uniquePoint = uniquePoints[j];
		var angle = Math.atan2(uniquePoint.y-sightY,uniquePoint.x-sightX);
		uniquePoint.angle = angle;
		uniqueAngles.push(angle-0.00001,angle,angle+0.00001);
	}

	// RAYS IN ALL DIRECTIONS
	var intersects = [];
	for(var j=0;j<uniqueAngles.length;j++){
		var angle = uniqueAngles[j];

		// Calculate dx & dy from angle
		var dx = Math.cos(angle);
		var dy = Math.sin(angle);

		// Ray from center of screen to mouse
		var ray = {
			a:{x:sightX,y:sightY},
			b:{x:sightX+dx,y:sightY+dy}
		};

		// Find CLOSEST intersection
		var closestIntersect = null;
		for(var i=0;i<segments.length;i++){
			var intersect = getIntersection(ray,segments[i]);
			if(!intersect) continue;
			if(!closestIntersect || intersect.param<closestIntersect.param){
				closestIntersect=intersect;
			}
		}

		// Intersect angle
		if(!closestIntersect) continue;
		closestIntersect.angle = angle;

		// Add to list of intersects
		intersects.push(closestIntersect);

	}

	// Sort intersects by angle
	intersects = intersects.sort(function(a,b){
		return a.angle-b.angle;
	});

	// Polygon is intersects, in order of angle
	return intersects;

}

//calculates dots for positioning relating to calc-segments
function calcShift(dot,x,y){
	var point = {};
	point.x = dot.x + x;
	point.y = dot.y + y;
	return point;
}

// calculates segments dots from x,y values of the pillars
function calcSegments(i_min, i_max, rectSize){
	for(var i = i_min; i<i_max; i++){
		const dot = jQuery.extend(true, {}, pillar.points[i]);
		var line = {};


		//line1
		line.a = calcShift(dot,0,0);
		line.b = calcShift(dot,0,rectSize);
		segments.push(jQuery.extend(true, {}, line));

		//line2
		line.a = calcShift(dot,0,rectSize);
		line.b = calcShift(dot,rectSize,rectSize);
		segments.push(jQuery.extend(true, {}, line));

		// //line3
		line.a = calcShift(dot,rectSize,rectSize);
		line.b = calcShift(dot,rectSize,0);
		segments.push(jQuery.extend(true, {}, line));

		// //line4
		line.a = calcShift(dot,rectSize,0);
		line.b = calcShift(dot,0,0);
		segments.push(jQuery.extend(true, {}, line));
	}
}

//draws the shadows
function drawPolygon(polygon,ctx,fillStyle){
	ctx.fillStyle = fillStyle;
	ctx.beginPath();
	ctx.moveTo(polygon[0].x ,polygon[0].y -windowOffset);
	for(var i=1;i<polygon.length;i++){
		var intersect = polygon[i];
		ctx.lineTo(intersect.x ,intersect.y -windowOffset);
	}
	ctx.fill();
}

//Everything visible in the canvas
function draw(){

	scrollLight(0, 200,400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200)

	//set the lightspot to the center of the screen and make it relate to the scrollingposition (obsolete)
	lightSpot.x = canvas.width/2;
	lightSpot.y = (windowOffset/$(document).height())*canvas.height*1.4 - 80
	// lightSpot.x = Mouse.x
	// lightSpot.y = Mouse.y

	// Clear canvas
	ctx.clearRect(0,0,canvas.width,canvas.height);

	if(shadow.active){
		// Sight Polygons
		var polygons = [getSightPolygon(lightSpot.x,lightSpot.y+windowOffset)];
		for(var angle=0;angle<Math.PI*2; angle+=(Math.PI*2)/10){
			var dx = Math.sin(angle)*shadow.intersections.fuzzyness;
			var dy = Math.cos(angle)*shadow.intersections.fuzzyness;
			polygons.push(getSightPolygon((lightSpot.x+dx) ,(lightSpot.y+dy+windowOffset)));
		};

		drawPolygon(polygons[0],ctx,shadow.background);
		// DRAW AS A GIANT POLYGON
		for(var i=1;i<polygons.length;i++){
			drawPolygon(polygons[i],ctx, shadow.intersections.color);
		}
	}

	if(lightShaft.active){
	drawShaft(lightShaft.x1, lightShaft.y1, lightShaft.x2, lightShaft.y2, lightShaft.width);
	}

	ctx.drawImage(lightSpot.image,lightSpot.x-lightSpot.image.width/2,lightSpot.y-lightSpot.image.height/2, lightSpot.image.width, lightSpot.image.height);

	if(pillar.active){
		for(var i=0;i<pillar.points.length;i++){
			ctx.fillStyle = pillar.color
			var spot = pillar.points[i];
			ctx.beginPath();
			ctx.moveTo(spot.x ,spot.y -windowOffset);
			ctx.lineTo(spot.x+pillar.size,spot.y -windowOffset);
			ctx.lineTo(spot.x+pillar.size,spot.y + pillar.size -windowOffset);
			ctx.lineTo(spot.x,spot.y+pillar.size -windowOffset);
			ctx.fill();
		}
	}
}

//everything triggered when input-changes are happening
function drawLoop(){
	requestAnimationFrame(drawLoop);
	if(updateCanvas){
		resizeCanvas();
		draw();
		updateCanvas = false;
	}
}

//everything related to the canvas size
function resizeCanvas(){
	var scaleFactor = window.innerWidth/garden.scaleW
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

//draw shaft line
function drawShaft(x1,y1, x2, y2, shaftSize){
	ctx.strokeStyle = "white"
	ctx.beginPath()
	ctx.moveTo(x1,y1);
	ctx.lineTo(x2, y2);
	ctx.lineTo(x1, y1);
	ctx.lineWidth = shaftSize;
	ctx.stroke();
}

//a function to map a number from one area to another (S = Source, T = Target)
function mapArea(x, min_S, max_S, min_T, max_T){
	var y = (max_T-min_T)*(x-min_S)/(max_S-min_S) + min_T
	return y
}

//goes through the stages of one lightloop mapping the states on the scrollingposition. For more information take the relating sketch file from the folder 04_wireframes/02_juli folder
function scrollLight(fullwhite_1,threequaterwhite_1, halfwhite_1, quaterwhite_1, onpixel_1, blackstart, blackend, onepixel_2, quaterwhite_2, halfwhite_2, threequaterwhite_2, fullwhite_2, loopend){
// 	var section = ''
// 	if(loopend<=windowOffset){
// 		return
// 	if(fullwhite_2<=windowOffset){
// 		section = 'fullwhite+'
// 	}else if (threequaterwhite_2<windowOffset) {
// 		section = '3/4white+'
// 	}else if (threequaterwhite_2<windowOffset) {
// 	section = '1/2white+'
// }else if (threequaterwhite_2<windowOffset) {
// 	section = '1/4white+'
// }else if (threequaterwhite_2<windowOffset) {
// 	section = '3/4white+'
// }

	lightShaft.active = (fullwhite_1<=windowOffset && windowOffset<blackstart || blackend<windowOffset && windowOffset<=fullwhite_2); //activates/deactivates the drawing of the lightshaft depending on the scrollposition
	lightSpot.active = (halfwhite_1< windowOffset && windowOffset<onpixel_1 || onepixel_2<windowOffset && windowOffset<halfwhite_2); //activates/deactivates the lightSpotImage
	shadow.active = (quaterwhite_1<windowOffset && windowOffset<quaterwhite_2); //activates/deactivates shadows
	pillar.active = (quaterwhite_1<windowOffset && windowOffset<quaterwhite_2); //activates/deactivates pillars


	// switch (windowOffset){
	// 	case
	// }
	if(fullwhite_1<=windowOffset<onpixel_1){
		lightShaft.x1 = window.innerWidth/2
		lightShaft.x2 = lightShaft.x1
		lightShaft.y1 = 0;
		lightShaft.y2 = window.innerHeight;
		// if(windowOffset<threequaterwhite_1){
		lightShaft.width = mapArea(windowOffset, fullwhite_1, onpixel_1, window.innerWidth, 1);
	// 	console.log(lightShaft.width);
	// }
	}
}


//######################EVENTS##########################

//recalculates segments
calcSegments(0,1, garden.size)
calcSegments(1, pillar.points.length-1, pillar.size);

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);

//everything happening on pageload
window.onload = function(){
	lightSpot.image.onload = function(){
		drawLoop();
	};
	lightSpot.image.src = "assets/garden_lightShaftSpot.png";
};

//everything happening when mouse is moved
canvas.onmousemove = function(event){
	Mouse.x = event.clientX;
	Mouse.y = event.clientY;
	updateCanvas = true;
};

//everything happening when scrolling
window.addEventListener('scroll', function(e){
	updateCanvas = true;
	windowOffset = window.pageYOffset;
})
