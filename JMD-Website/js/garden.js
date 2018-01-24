//######################SETUP##########################

//importing Data from googleSpreadsheets
document.addEventListener('DOMContentLoaded', function() {
	var URL = "https://docs.google.com/spreadsheets/d/1iQRd7IAZk4n-SYmRO-Jsu1A1Mh6p75HUbq-Jfg-q1nA/edit?usp=sharing"
	Tabletop.init( { key: URL, callback: contentData, simpleSheet: true } )
})

document.addEventListener('DOMContentLoaded', function() {
	var URL = "https://docs.google.com/spreadsheets/d/112kX1SjyxW9D7rQ69ovMpJBAJluQoIbhlhMxlSrfSBw/edit?usp=sharing"
	Tabletop.init( { key: URL, callback: infoData, simpleSheet: true } )
})

// linking & importing objects to the html
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// var data = require

//VARS parametric influencing parameters
var garden = {
	size: 440000,
	scaleW: 1680, //width for which was designed for (everything should be scaled down for smaller size - not done yet)
	section: 'white_1', //current section is saved here
	sections: ['white_1', 'threequaterwhite_1', 'halfwhite_1', 'quaterwhite_1', 'onpixel_1', 'black', 'onepixel_2', 'quaterwhite_2', 'halfwhite_2', 'threequaterwhite_2', 'white_2'], //sections for garden
	sectionPoints: { //s: start, e: end
		a:[
			{s: 0, e: 3000}, //white_1 (start + end)
			{s:6000, e: 6000}, //threequaterwhite_1
			{s:10000, e: 10000}, //halfwhite_1
			{s:14000,e: 14000}, //quaterwhite_1
			{s:18000, e: 18000}, //onpixel_1
			{s:24000, e: 26000}, //blackend/start
			{s:30000, e: 30000}, //onepixel_2
			{s:40000, e: 40000}, //quaterwhite_2
			{s:45000, e: 45000}, //halfwhite_2
			{s:50000, e: 50000}, //threequaterwhite_2
			{s:60000, e: 90000} //white_2
		]
	}
}

// sets documents height to the gardens-size
document.body.style.height = garden.size

//Contains all colors and enables changes in the colorset
var colorset = {
	black: "#010006",
	softlyLit: "#2f2e2e",
	concrete: "#404040",
	concreteLit: "#BFBFBF",
	beige: "#F3EEE8",
	lightGrey: "#FBFBFB",
}

canvas.style.background = "#0e0d0d";

//POSITIONS OF pillars
var pillar = {
	active: false, //determines wheather the pillars
	size: 200, //sets the size of the pillars
	color: colorset.black,
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
	active: false, //determinates wheather the shaft is drawnd
	x1: 0,
	x2: 0,
	y1: 0, //start of the shaft
	y2: 0, //end of the shaft
	middle: {
		width: 1, //size of the shaft
		color: colorset.lightGrey
	},
	border: {
		width: 1, //size of the surrounding border
		opacity: 1,
		color: colorset.concrete
	}
}

var lightSpot = {
	active: false, //determines whaether light spot is active (visually)
	x: window.innerWidth/2,
	y: window.innerHeight,
	opacity: 0,
	width: 582,
	height: 635,
	image: new Image()
}

var shadow = {
	active: false,
	background: colorset.softlyLit, //color of the background
	intersections: {
		opacity: 0.6,
		color: colorset.softlyLit, //color of the shadow overlays
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
function calcShift(dot,sizeX,sizeY, positioner){
	var point = {};
	point.x = dot.x + sizeX;
	point.y = dot.y + sizeY+positioner;
	return point;
}


function calcSegments(i_min, i_max, rectSize, c){

	for(var i = i_min; i<i_max; i++){
		const dot = jQuery.extend(true, {}, pillar.points[i]);
		var line = {};


		//line1
		line.a = calcShift(dot,0,0,c);
		line.b = calcShift(dot,0,rectSize,c);
		segments.push(jQuery.extend(true, {}, line));

		//line2
		line.a = calcShift(dot,0,rectSize,c);
		line.b = calcShift(dot,rectSize,rectSize,c);
		segments.push(jQuery.extend(true, {}, line));

		// //line3
		line.a = calcShift(dot,rectSize,rectSize,c);
		line.b = calcShift(dot,rectSize,0,c);
		segments.push(jQuery.extend(true, {}, line));

		// //line4
		line.a = calcShift(dot,rectSize,0,c);
		line.b = calcShift(dot,0,0,c);
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

//draws the lightSpot
function drawSpot(image, x, y, width, height, opacity){
	ctx.globalAlpha = opacity
	ctx.drawImage(image, x, y, width, height);
	ctx.globalAlpha = 1
}

//draw shaft line
function drawShaft(x1,y1, x2, y2, shaftSize){
	// //draw shaft light (left)
	// ctx.strokeStyle = lightShaft.border.color
	// ctx.beginPath()
	// ctx.moveTo(x1-shaftSize/2, y1);
	// ctx.lineTo(x2-shaftSize/2, y2);
	// ctx.lineTo(x1-shaftSize/2, y1);
	// ctx.lineWidth = (shaftSize-1)*0.4;
	// ctx.stroke();
	//
	// //draw shaft light (right)
	// ctx.beginPath()
	// ctx.moveTo(x1+shaftSize/2, y1);
	// ctx.lineTo(x2+shaftSize/2, y2);
	// ctx.lineTo(x1+shaftSize/2, y1);
	// ctx.lineWidth = (shaftSize-1)*0.4;
	// ctx.stroke();

	//draw light
	ctx.strokeStyle = lightShaft.middle.color
	ctx.beginPath()
	ctx.moveTo(x1,y1);
	ctx.lineTo(x2, y2);
	ctx.lineTo(x1, y1);
	ctx.lineWidth = shaftSize;
	ctx.stroke();

	//adopt background

}

//
function shaftText(textID){
	textWidth = lightShaft.width+"px"
	textLeftMargin = $(window).width()/2 - lightShaft.width/2 + 1
	$(textID).css({"width":textWidth, "margin-left": textLeftMargin+"px"})
}

//everything related to the canvas size
function resizeCanvas(){
	var scaleFactor = window.innerWidth/garden.scaleW
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

//deactivates all states
function deactivateStates(){
	lightShaft.active = false;
	pillar.active = false;
	shadow.active = false;
	lightSpot.active = false;
}

//a function to map a number from one area to another (S = Source, T = Target)
function mapArea(x, min_S, max_S, min_T, max_T){
	var y = (max_T-min_T)*(x-min_S)/(max_S-min_S) + min_T
	return y
}

//goes through the stages of one lightloop mapping the states on the scrollingposition. For more information take the relating sketch file from the folder 04_wireframes/02_juli folder
function scrollLight(sectionAnkers){
	for(var i=0; i<sectionAnkers.length; i++){
		if(sectionAnkers[i].s<windowOffset && windowOffset<=sectionAnkers[i].e){
			garden.section = garden.sections[i];
		}else if (i<sectionAnkers.length-1 && sectionAnkers[i].e<=windowOffset && sectionAnkers[i+1].s>windowOffset){
			garden.section = garden.sections[i] + "++"
		}
	}
	//default settings for lightShaft
	lightShaft.x1 = window.innerWidth/2
	lightShaft.x2 = lightShaft.x1
	lightShaft.y1 = 0;
	lightShaft.y2 = window.innerHeight;

	deactivateStates()

	switch (garden.section) {


		case garden.sections[0]:
		lightShaft.active = true
		lightShaft.width = window.innerWidth;

		break;

		case garden.sections[0]+"++":
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[0].e, sectionAnkers[1].s, window.innerWidth, window.innerWidth*0.75);
		break;

		case garden.sections[1]:
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.75
		break;

		case garden.sections[1]+"++":
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[1].e, sectionAnkers[2].s, window.innerWidth*0.75, window.innerWidth*0.5);
		pillar.active = true
		break;

		case garden.sections[2]:
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.5

		pillar.active = true
		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[2]+"++":
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[2].e, sectionAnkers[3].s, window.innerWidth*0.5, window.innerWidth*0.25);

		pillar.active = true
		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[3]:
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.25

		pillar.active = true

		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[3]+"++":
		lightShaft.active = true;

		pillar.active = true

		lightSpot.active = true
		lightShaft.width = mapArea(windowOffset, sectionAnkers[3].e, sectionAnkers[4].s, window.innerWidth*0.25, 2);
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, 1)
		break;

		case garden.sections[4]:
		lightShaft.active = true;
		lightShaft.width = 1

		pillar.active = true
		shadow.active = true

		lightSpot.active = true
		break;

		case garden.sections[4]+"++":
		lightShaft.active = true;
		lightShaft.width = 1
		lightShaft.y2 = mapArea(windowOffset, sectionAnkers[4].e, sectionAnkers[5].s, window.innerHeight, 0);
		if(lightShaft.y2>window.innerHeight/2){
			shadow.intersections.opacity = mapArea(lightShaft.y2, window.innerHeight, window.innerHeight - 300, 0, 1);
		}else if (lightShaft.y2<window.innerHeight/2) {
			shadow.intersections.opacity = mapArea(lightShaft.y2, 0, 300, 0, 1)
		}

		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		pillar.active = true
		shadow.active = true

		lightSpot.y = lightShaft.y2
		break;

		case garden.sections[5]:
		pillar.active = true
		break;

		case garden.sections[5]+"++":
		lightShaft.active = true;
		lightShaft.width = 1
		lightShaft.y1 = mapArea(windowOffset, sectionAnkers[5].e, sectionAnkers[6].s, window.innerHeight, 0);
		if(lightShaft.y1>window.innerHeight/2){
			shadow.intersections.opacity = mapArea(lightShaft.y1, window.innerHeight, window.innerHeight - 150, 0, 1)
		}else if (lightShaft.y1<window.innerHeight/2) {
			shadow.intersections.opacity = mapArea(lightShaft.y1, 0, 300, 0, 1)
		}
		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		pillar.active = true
		shadow.active = true

		lightSpot.y = lightShaft.y1
		break;

		case garden.sections[6]:
		lightShaft.active = true;
		lightShaft.width = 1


		pillar.active = true
		shadow.active = true

		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[6]+"++":
		lightShaft.active = true;

		pillar.active = true

		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		lightShaft.width = mapArea(windowOffset, sectionAnkers[6].e, sectionAnkers[7].s, 2, window.innerWidth*0.25);
		break;

		case garden.sections[7]:
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.25

		pillar.active = true

		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[7]+"++":
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[7].e, sectionAnkers[8].s, window.innerWidth*0.25, window.innerWidth*0.5);

		pillar.active = true
		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[8]:
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.5

		pillar.active = true
		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[8]+"++":
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[8].e, sectionAnkers[9].s, window.innerWidth*0.5, window.innerWidth*0.75);

		pillar.active = true
		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[9]:
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.75
		break;

		case garden.sections[9]+"++":
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[9].e, sectionAnkers[10].s, window.innerWidth*0.75, window.innerWidth);
		break;

		case garden.sections[10]:
		lightShaft.active = true
		lightShaft.width = window.innerWidth;
		break;
		default:

	}
}

//Everything visible in the canvas
function draw(){

	// Clear canvas
	ctx.clearRect(0,0,canvas.width,canvas.height);

	// scrollLight(0, 200,400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200)
	scrollLight(garden.sectionPoints.a);


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
			ctx.globalAlpha = shadow.intersections.opacity;
			drawPolygon(polygons[i],ctx, shadow.intersections.color);
			ctx.globalAlpha = 1;
		}
	}

	if(lightShaft.active){
		drawShaft(lightShaft.x1, lightShaft.y1, lightShaft.x2, lightShaft.y2, lightShaft.width);
	}

	//set the lightspot to the center of the screen and make it relate to the scrollingposition (obsolete)
	if(lightSpot.active){
		lightSpot.x = canvas.width/2;
		lightSpot.image.height = mapArea(lightShaft.width, 1, window.innerWidth, lightSpot.height, 40*window.innerHeight)//window.innerHeight*4
		lightSpot.image.width = mapArea(lightShaft.width, 1, window.innerWidth, lightSpot.width, 1*window.innerWidth)//window.innerHeight*4
		drawSpot(lightSpot.image,lightSpot.x-lightSpot.image.width/2,lightSpot.y-lightSpot.image.height/2, lightSpot.image.width, lightSpot.image.height, lightSpot.opacity);
	}
	if(pillar.active){
		for(var i=0;i<pillar.points.length;i++){
			ctx.fillStyle = pillar.color
			var spot = pillar.points[i];
			ctx.beginPath();
			ctx.moveTo(spot.x ,spot.y + garden.sectionPoints.a[4].s -windowOffset);
			ctx.lineTo(spot.x+pillar.size,spot.y + garden.sectionPoints.a[4].s - windowOffset);
			ctx.lineTo(spot.x+pillar.size,spot.y + pillar.size + garden.sectionPoints.a[4].s -windowOffset);
			ctx.lineTo(spot.x,spot.y+pillar.size + garden.sectionPoints.a[4].s-windowOffset);
			ctx.fill();
		}
	}
}

function infoData(data){

	//assigns the content to new divs
	for(i=0; i<data.length; i++){
		var this_content = data[i];

		var div = document.createElement("div");
		var h2 = document.createElement("h2");
		var p = document.createElement("p");
		
		h2.innerHTML = this_content.name;
		p.innerHTML = this_content.text;

		div.className += this_content.class;
		div.append(h2);
		div.append(p);

		document.getElementById("dark-content-wrapper").appendChild(div);
	}
}

function contentData(data){

	for(i=0; i<data.length; i++){
		var div = document.createElement("div");
		var h2 = document.createElement("h2")
		var p = document.createElement("p");
		h2.innerHTML = data[i].name
		p.innerHTML = data[i].text

		div.append(h2)
		div.append(p)

		document.getElementById("dark-content-wrapper").appendChild(div);
	}
}

//everything that changes HTML or CSS Properties
function manipulateHTML(){
	shaftText('#text1')
}

//everything triggered when input-changes are happening
function drawLoop(){
	requestAnimationFrame(drawLoop);
	if(updateCanvas){
		resizeCanvas();
		draw();
		manipulateHTML();
		updateCanvas = false;
	}
}
//######################EVENTS##########################
calcSegments(0,1, garden.sectionPoints.a[7].s - garden.sectionPoints.a[4].e, garden.sectionPoints.a[4].e)
calcSegments(1, pillar.points.length-1, pillar.size, garden.sectionPoints.a[4].s);


//everything happening when scrolling
window.addEventListener('scroll', function(e){
	updateCanvas = true;
	windowOffset = window.pageYOffset;
	//y = mapArea(windowOffset, 0, 1000, 3, 6)
})

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
