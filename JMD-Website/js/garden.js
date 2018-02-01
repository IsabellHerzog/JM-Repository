//######################SETUP##########################

//importing Data from googleSpreadsheets CONTENT
document.addEventListener('DOMContentLoaded', function() {
	var URL = "https://docs.google.com/spreadsheets/d/1gOexCcBm8hd-o1hEjzHu0bcVQMbBkhWvmRo8ATCH9qc/edit?usp=sharing"
	Tabletop.init( { key: URL, callback: contentData, simpleSheet: true } )
})
//importing Data from googleSpreadsheets INFORMATIONAL DATA
document.addEventListener('DOMContentLoaded', function() {
	var URL = "https://docs.google.com/spreadsheets/d/112kX1SjyxW9D7rQ69ovMpJBAJluQoIbhlhMxlSrfSBw/edit?usp=sharing"
	Tabletop.init( { key: URL, callback: infoData, simpleSheet: true } )
})

// linking & importing objects to the html
var canvas = document.getElementById("canvas");

var ctx = canvas.getContext("2d");

ctx.fillRect(0, 0, 150, 100);
// var data = require

var t_years = {
    positions: [],
    tens: [],
    hundreds: []
}

//VARS parametric influencing parameters
var garden = {
	size: 440000,
	scaleW: 1680, //width for which was designed for (everything should be scaled down for smaller size - not done yet)
	section: 'white_1', //current section is saved here
	sections: ['white_1', 'threequaterwhite_1', 'halfwhite_1', 'quaterwhite_1', 'onpixel_1', 'black', 'onepixel_2', 'quaterwhite_2', 'halfwhite_2', 'threequaterwhite_2', 'white_2'], //sections for garden
	sectionPoints: { //s: start, e: end
		a:[
			{s: 0, e: 600}, //white_1 (start + end)
			{s: 1000, e: 1000}, //threequaterwhite_1
			{s:1400, e: 1400}, //halfwhite_1
			{s:2300,e: 2300}, //quaterwhite_1
			{s:3300, e: 3300}, //onpixel_1
			{s:24000, e: 31700}, //blackend/start
			{s:36000, e: 36000}, //onepixel_2
			{s:36500, e: 36500}, //quaterwhite_2
			{s:37000, e: 37000}, //halfwhite_2
			{s:37500, e: 37500}, //threequaterwhite_2
			{s:38000, e: 39200} //white_2
		]
	}
}

//Contains all colors and enables changes in the colorset
var colorset = {
	black: "#010006",
	softlyLit: "#404040",
	concrete: "#0e0d0d",
	concreteLit: "#BFBFBF",
	beige: "#F3EEE8",
	lightGrey: "#BFBFBF",
}

//POSITIONS OF pillars
var pillar = {
	active: false, //determines wheather the pillars
	size: 200, //sets the size of the pillars
	color: colorset.black,
	points: [ //x,y coordinates for the pillars on the canvas
		{x: -200, y: -200}, //first one is hidden
        {x: 1092, y: 500},
        {x: 400, y: 965},
        {x: 1092, y: 1325},
        {x: 300, y: 1670},
        {x: 1320, y: 2020},
        {x: 725, y: 2720},
        {x: 1092, y: 3000},
        {x: 400, y: 3370},
        {x: 610, y: 3940},
        {x: 1100, y: 3940},
        {x: 1320, y: 4435},
        {x: 400, y: 4840},
        //{x: 1088, y: 2736},
        //{x: 1088, y: 2736},
        //{x: 476, y: 3222},
        //{x: 476, y: 4610},
        //{x: 1394, y: 3444},
        //{x: 170, y: 5230},
        {x: 476, y: 1000000000099909877788}
	]
}

//settings of the lightShaft
var lightShaft = {
	active: false, //determinates wheather the shaft is drawnd
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
		opacity: 1,
		color: colorset.concrete
	}
}

//settings of the lightSpot
var lightSpot = {
	active: false, //determines whaether light spot is active (visually)
	x: window.innerWidth/2,
	y: window.innerHeight,
	opacity: 0,
	width: 582,
	height: 635,
	image: new Image()
}

//settings of the shadows
var shadow = {
	active: false,
	background: colorset.softlyLit, //color of the background
	intersections: {
		opacity: 0.3,
		color: colorset.concreteLit, //color of the shadow overlays
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
var shaftGrowing = true;
var shaftShrinking = false;
//relations
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;

//sets the background color
canvas.style.background = colorset.concrete;

// sets documents height to the gardens-size
garden.size = garden.sectionPoints.a[10].e
document.body.style.height = garden.size

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
		var angle = Math.atan2(uniquePoint.y-sightY,uniquePoint.x-sightX);//tried
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
	ctx.moveTo(polygon[0].x ,polygon[0].y -windowOffset); //maybe needed
	for(var i=1;i<polygon.length;i++){
		var intersect = polygon[i];
		ctx.lineTo(intersect.x ,intersect.y -windowOffset); //maybe needed
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

	//draw light
	ctx.strokeStyle = lightShaft.middle.color
	ctx.beginPath()
	ctx.moveTo(x1,y1);
	ctx.lineTo(x2, y2);
	ctx.lineTo(x1, y1);
	ctx.lineWidth = shaftSize;
	ctx.stroke();
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
	shaftGrowing = false;
	shaftShrinking = false;
}

//a function to map a number from one area to another (S = Source, T = Target)
function mapArea(x, min_S, max_S, min_T, max_T){
	var y = (max_T-min_T)*(x-min_S)/(max_S-min_S) + min_T
	return y
}

//separates emphazised (<em> </em>) from string

// function splitEm(fullText) {
// 	if (fullText.split("<em>")[0] != ""){
// 		if (fullText.split("<em>").length <= 1){
// 			return ""
// 		}
// 		var next = fullText.split("<em>")[1]
// 		if (next[0] != ""){
// 			return next.split("</em>")[0]
// 		}
// 	}else {
// 		var next = fullText.split("<em>")[1]
// 		if (next[0] != ""){
// 			return next.split("</em>")[0]
// 		}
// 	}
// }

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
		shaftGrowing = true;
		lightShaft.active = true
		lightShaft.width = window.innerWidth;

		break;

		case garden.sections[0]+"++":
		shaftGrowing = true;
		lightShaft.active = true;
			lightShaft.width = mapArea(windowOffset, sectionAnkers[0].e, sectionAnkers[1].s, window.innerWidth, window.innerWidth*0.75);
		break;

		case garden.sections[1]:
		shaftGrowing = true;
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.75
		break;

		case garden.sections[1]+"++":
		shaftGrowing = true;
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[1].e, sectionAnkers[2].s, window.innerWidth*0.75, window.innerWidth*0.5);
		pillar.active = true
		break;

		case garden.sections[2]:
		shaftGrowing = true;
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.5

		pillar.active = true
		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[2]+"++":
		shaftGrowing = true;
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[2].e, sectionAnkers[3].s, window.innerWidth*0.5, window.innerWidth*0.25);

		pillar.active = true
		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[3]:
		shaftGrowing = true;
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.25

		pillar.active = true

		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[3]+"++":
		shaftGrowing = true;
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
		lightShaft.middle.color = "rgb(255, 255, 255)"
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
		var color = Math.round(mapArea(lightSpot.y, 0, window.innerHeight, 13, 64))
		shadow.background = "rgb("+color+","+color+","+color+")";
		break;

		case garden.sections[5]:

		pillar.active = true
		break;

		case garden.sections[5]+"++":
		lightShaft.middle.color = "rgb(200, 200, 200)"
		var color = Math.round(mapArea(lightSpot.y, 0, window.innerHeight, 50, 13))
		shadow.background = "rgb("+color+","+color+","+color+")";
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

		////lightspot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[6]+"++":
		shaftShrinking = true;
		lightShaft.active = true;

		pillar.active = true

		//lightspot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		lightShaft.width = mapArea(windowOffset, sectionAnkers[6].e, sectionAnkers[7].s, 2, window.innerWidth*0.25);
		break;

		case garden.sections[7]:
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.25

		pillar.active = true

		//lightspot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[7]+"++":
		shaftShrinking = true;
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[7].e, sectionAnkers[8].s, window.innerWidth*0.25, window.innerWidth*0.5);

		pillar.active = true
		//lightspot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[8]:
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.5

		pillar.active = true
		lightspot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[8]+"++":
		shaftShrinking = true;
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[8].e, sectionAnkers[9].s, window.innerWidth*0.5, window.innerWidth*0.75);

		pillar.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case garden.sections[9]:
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.75
		break;

		case garden.sections[9]+"++":
		shaftShrinking = true;
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
	segments = []

	calcSegments(1, pillar.points.length-1, pillar.size, garden.sectionPoints.a[4].s);
	calcSegments(0,1, 5000, windowOffset) //redefine, not calc -->write a different function
	// Clear canvas
	ctx.clearRect(0,0,canvas.width,canvas.height);

	if (shaftGrowing) {
		var color = 255
		if (lightShaft.width != null){
			color = Math.round(mapArea(lightShaft.width, 0, window.innerWidth, 64, 255))
		}

		ctx.fillStyle = "rgb("+color+","+color+","+color+")";
		ctx.rect(0, 0, window.innerWidth,window.innerHeight);
		ctx.fill();

	}

	if (shaftShrinking) {
		var color = Math.round(mapArea(lightShaft.width, 0, window.innerWidth, 50, 200))
		lightShaft.middle.color = "rgb(200, 200, 200)"
		ctx.fillStyle = "rgb("+color+","+color+","+color+")";
		ctx.rect(0, 0, window.innerWidth,window.innerHeight);
		ctx.fill();
	}

	// scrollLight(0, 200,400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200)
	scrollLight(garden.sectionPoints.a);


	if(shadow.active){
		// Sight Polygons
		var polygons = [getSightPolygon(lightSpot.x,lightSpot.y+windowOffset)];//needed
		for(var angle=0;angle<Math.PI*2; angle+=(Math.PI*2)/20){
			var dx = Math.sin(angle)*shadow.intersections.fuzzyness;
			var dy = Math.cos(angle)*shadow.intersections.fuzzyness;
			polygons.push(getSightPolygon((lightSpot.x+dx) ,(lightSpot.y+dy)));//needed
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
			ctx.moveTo(spot.x ,spot.y + garden.sectionPoints.a[4].s -windowOffset);//needed
			ctx.lineTo(spot.x+pillar.size,spot.y + garden.sectionPoints.a[4].s - windowOffset);//needed
			ctx.lineTo(spot.x+pillar.size,spot.y + pillar.size + garden.sectionPoints.a[4].s -windowOffset);//needed
			ctx.lineTo(spot.x,spot.y+pillar.size + garden.sectionPoints.a[4].s-windowOffset);//needed
			ctx.fill();
		}
	}
}

//fills the content in the white info-area from a spreadsheet
function infoData(data){

	for(i=0; i<data.length; i++){

		var this_content = data[i];

		var div = document.createElement("div");
		var h3 = document.createElement("h3");
		var p = document.createElement("p");

		h3.innerHTML = this_content.name;
		p.innerHTML = this_content.text;

		div.className += this_content.class;

		if(div.className ==="info-text-quote1" || div.className ==="info-text-quote2"){
			div.append(p);
		}else{
		div.append(p);
		}
		document.getElementById("light-content-wrapper").appendChild(div);
	}
}

//fills the content in the dark content-area from a spreadsheet
function contentData(data){

	for(i=0; i<data.length; i++){

		var this_content = data[i];

		//fills in the html content
		var div = document.createElement("div");
		div.className += "content-block";

		var innerDiv = document.createElement("div");
		innerDiv.className += this_content.class

		var metadataDiv = document.createElement("div");
		var subtitleDiv = document.createElement("div");

		var emBlock = document.createElement("div")
		emBlock.className += "emBlock"

		var emDiv = document.createElement("div")
		emDiv.className += "em "

		var imageDiv = document.createElement("div");

		if(this_content.class === "content-block-left"){
			emDiv.className += "em-left"
			imageDiv.className += "image-left"
			metadataDiv.className += "metadata-left";
			subtitleDiv.className += "subtitle-left";
		}else if(this_content.class === "content-block-right"){
			emDiv.className += "em-right"
			imageDiv.className += "image-right"
			metadataDiv.className += "metadata-right";
			subtitleDiv.className += "subtitle-right";
		}else if (this_content.class === "content-block-middle-left"){
			emDiv.className += "em-middle-left"
			imageDiv.className += "image-middle-left"
			metadataDiv.className += "metadata-middle-left";
			subtitleDiv.className += "subtitle-middle-left";
		}else {
			imageDiv.className += "image-middle-right"
			emDiv.className += "em-middle-right"
			metadataDiv.className += "metadata-middle-right";
			subtitleDiv.className += "subtitle-middle-right";
		}

		var em = document.createElement("p");
		em.innerHTML = "»"+this_content.em+"«"

		var h2 = document.createElement("h2")
		h2.innerHTML = this_content.name

		var p = document.createElement("p");
		p.innerHTML = this_content.text

		var img = document.createElement("img")
		img.src = "./assets/images/" + this_content.imgName
		img.style.opacity = "0.9"
		// img.style.backgroundBlendMode = "multiply";

		var metaP = document.createElement("p");
		metaP.innerHTML = this_content.metadata

		var subtitleP = document.createElement("p");
		subtitleP.innerHTML = this_content.subtitle

		innerDiv.append(h2)
		innerDiv.append(p)
		subtitleDiv.append(subtitleP)
		innerDiv.append(subtitleDiv)
		metadataDiv.append(metaP)
		imageDiv.append(img)
		imageDiv.append(metadataDiv)

		div.append(innerDiv)
		div.append(imageDiv)
		if (this_content.em != ""){
			emDiv.append(em)
			emBlock.append(emDiv)
			document.getElementById("dark-content-wrapper").appendChild(emBlock);
		}
		document.getElementById("dark-content-wrapper").appendChild(div);



		//defines/pulls year-infos into the t_years object
		if(4===this_content.year.length){

		//tens
		t_years.hundreds[i] = this_content.year.substring(0, 2);

		//hundreds
		t_years.tens.push(this_content.year.substring(2, 4));

		//POSITIONS
		t_years.positions[i] = div.getBoundingClientRect().y+windowOffset;
	}
	}
	drawLoop();
}

//makes Text of an ID align to the shaft
function shaftText(textID){
	textWidth = lightShaft.width+"px"
	textLeftMargin = $(window).width()/2 - lightShaft.width/2 + 1
	$(textID).css({"width":textWidth, "margin-left": textLeftMargin+"px"})
}

//draws the tmeline
function timeline(tens_moving, i){

	var time_position = t_years.positions[i]-windowOffset

	if(time_position>=window.innerHeight*0.47){

	$('#t-fixed').text(t_years.tens[i-1]);


	$('#h-fixed').text(t_years.hundreds[i-1]);

	$(tens_moving).text(t_years.tens[i]);
	var opacitator = mapArea(time_position, window.innerHeight, window.innerHeight*0.47,0,1)
	if(0<=opacitator && opacitator<=1){
	$(tens_moving).css({"opacity": opacitator});
	$(tens_moving).css({"top": time_position});

	$('#t-fixed').css({"top": 47 - opacitator*2 + "vh"});
	$('#t-fixed').css({"opacity": 1-opacitator});
}
}else if((time_position<window.innerHeight*0.47)){
	$('#t-fixed').css({"top": 47 + "vh"});
	$('#t-fixed').css({"opacity": 1});
	$(tens_moving).css({"top": window.innerHeight});
	timeline(tens_moving, i+1)
}
}

//everything that changes HTML or CSS Properties
function manipulateHTML(){
	shaftText('#text1');

	//move timeline
	timeline('#t-moving',0);
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

//everything happening when scrolling
window.addEventListener('scroll', function(e){
	updateCanvas = true;
	windowOffset = window.pageYOffset;
})

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);

//everything happening on pageload
window.onload = function(){
	lightSpot.image.onload = function(){
	};
	lightSpot.image.src = "assets/garden_lightShaftSpot.png";
};

//everything happening when mouse is moved (reassign canvasto the top one if you wanna use again)
canvas.onmousemove = function(event){
	Mouse.x = event.clientX;
	Mouse.y = event.clientY;
	updateCanvas = true;
};
