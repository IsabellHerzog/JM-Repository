//######################SETUP##########################
document.addEventListener("DOMContentLoaded", function(event) {
	contentData()
	infoData()
  });

// linking & importing objects to the html
var canvasBg = document.getElementById("background-canvas");
var canvasFg = document.getElementById("foreground-canvas");
var ctxBg = canvasBg.getContext("2d");
var ctxFg = canvasFg.getContext("2d");

//To ensure data is loaded before anything else is done
var contentLoaded = false;
var infoLoaded = false;
var dataLoaded = false;
var ankerSet = false;
var timelineSet = false;
var hundreds = "";

var section_states = []
var section_active
var lightContentHeight

// var data = require

var t_years = {
	positions: [],
	tens: [],
	hundreds: []
}

var backgroundHue = {
	current: 255,
	lightest: 97,
	darkest: 13,
}

//VARS parametric influencing parameters
var garden = {
	size: 440000,
	scaleW: 1680, //width for which was designed for (everything should be scaled down for smaller size - not done yet)
	section: 'white_1', //current section is saved here
	sections: ['white_1', 'threequaterwhite_1', 'halfwhite_1', 'quaterwhite_1', 'onpixel_1', 'black', 'onepixel_2', 'quaterwhite_2', 'halfwhite_2', 'threequaterwhite_2', 'white_2'], //sections for garden
	sectionPoints: { //s: start, e: end
		a:[
			{s: 0, e: 300}, //white_1 (start + end)
			{s: 400, e: 400}, //threequaterwhite_1
			{s:1300, e: 1300}, //halfwhite_1
			{s:1600,e: 1600}, //quaterwhite_1
			{s:2500, e: 2500}, //onpixel_1
			{s:24000, e: 31700}, //blackend/start
			{s:44444444, e: 4444444}, //onepixel_2
			{s:44444444, e: 4444444}, //quaterwhite_2
			{s:44444444, e: 4444444}, //halfwhite_2
			{s:44444444, e: 4444444}, //threequaterwhite_2
			{s:44444444, e: 44444444} //white_2
		]
	}
}
var shaftwidth1 = 1
var shaftwidth2 = 0.75;
var shaftwidth3 = 0.55;
var shaftwidth4 = 0.25;

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
	size: 200, //sets the size of the
	color: colorset.black,
	pointsSource: [ //x,y coordinates for the pillars on the canvas
		{x: -200, y: -200}, //first one is hidden
		{x: 50, y: 2117},
		{x: 5, y: 3200},
		{x: 70, y: 3665},
		{x: 100, y: 5070},
		{x: 10, y: 5470},//5
		{x: 90, y: 6390},
		{x: 10, y: 7500},
		{x: 100, y: 8200},
		{x: 0, y: 9200},
		{x: 40, y: 10500},//10
		{x: 10, y: 12070},
		{x: 70, y: 12570},
		{x: 0, y: 13570},
		{x: 10, y: 14600},
		{x: 90, y: 14650},//15
		{x: 20, y: 16300},
		{x: 0, y: 17260},
		{x: 87, y: 17460},
		{x: 34, y: 18600},
		{x: 89, y: 18960},//20
		{x: 80, y: 19900},
		{x: 10, y: 20550},
		{x: 35, y: 21050},
		{x: 80, y: 21760},
		{x: 90, y: 22860},
		{x: 30, y: 23600},
		{x: 70, y: 24300},
		{x: 5, y: 25240},
		{x: 12, y: 26500},
		{x: 100, y: 27000},
		{x: 40, y: 27800},
		{x: 65, y: 28600},
		{x: 0, y: 28800},
		{x: 0, y: 30400},
		{x: 85, y: 31400},
		{x: 0, y: 33100},
		{x: 476, y: 1000000000099909877788}
	],
}

pillar.points = jQuery.extend(true, [], pillar.pointsSource);

//settings of the lightShaft
var lightShaft = {
	active: false, //determinates wheather the shaft is drawnd
	x1: 0,
	x2: 0,
	y1: 0, //start of the shaft
	y2: 0, //end of the shaft
	maxW: window.innerWidth,
	middle: {
		width: 1, //size of the shaft
		f_width: 0.75,
		color: "white"
	},
}

//settings of the lightSpot
var lightSpot = {
	active: false, //determines whaether light spot is active (visually)
	x: window.innerWidth/2,
	y: window.innerHeight,
	opacity: 0,
	width: 537,
	height: 537,
	image: new Image()
}

//settings of the shadows
var shadow = {
	active: false,
	color: "rgba(0,0,0,0.7)",
	intersections: {
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


// init controller
var controller = new ScrollMagic.Controller();

// create a scene
var timelineScene = new ScrollMagic.Scene({
        triggerElement: '#dark-content-wrapper'
    })
    .addTo(controller); // assign the scene to the controller

//relations
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;

//#####################FUNCTIONS#######################




//updateing garden sections
function getAnkers(){


	if(!ankerSet){
		// {s: 0, e: 600}, //white_1 (start + end)
		//white_1
		garden.sectionPoints.a[0].s = 0;
		garden.sectionPoints.a[0].e = 0;
		// garden.sectionPoints.a[0].e = get_boundaries("info-text-right1", 0).center;
		//halfwhite_1
		garden.sectionPoints.a[2].s = get_boundaries("info-text-quote1", 0).bot - 350;
		garden.sectionPoints.a[2].e = get_boundaries("info-text-quote1", 0).top + 100;
		//onpixel_1
		garden.sectionPoints.a[4].s = get_boundaries("info-text-quote2", 0).center;
		garden.sectionPoints.a[4].e = get_boundaries("info-text-quote2", 0).top;
		//blackend/start
		garden.sectionPoints.a[5].s = get_boundaries("#black-start", "id").bot -200;
		garden.sectionPoints.a[5].e = get_boundaries("#black-end", "id").center;
		//onepixel_2
		garden.sectionPoints.a[6].s = get_boundaries("#oneline", "id").top + 2*$("#oneline").height();
		garden.sectionPoints.a[6].e = get_boundaries("#oneline", "id").top + 2*$("#oneline").height();
		//white_2
		garden.sectionPoints.a[10].s = get_boundaries("#light-content-wrapper2", "id").center;
		garden.sectionPoints.a[10].e = get_boundaries("#light-content-wrapper2", "id").bot;


		//automate (in between stages)



		//threequaterwhite_1 default 0.75%
		garden.sectionPoints.a[1].s = (garden.sectionPoints.a[2].s-garden.sectionPoints.a[0].e)/2+garden.sectionPoints.a[0].e;
		garden.sectionPoints.a[1].e = (garden.sectionPoints.a[2].s-garden.sectionPoints.a[0].e)/2+garden.sectionPoints.a[0].e;

		//quaterwhite_1
		garden.sectionPoints.a[3].s = (garden.sectionPoints.a[4].s-garden.sectionPoints.a[2].e)/2+garden.sectionPoints.a[2].e;
		garden.sectionPoints.a[3].e = (garden.sectionPoints.a[4].s-garden.sectionPoints.a[2].e)/2+garden.sectionPoints.a[2].e;

		//halfwhite_2
		garden.sectionPoints.a[8].s = (garden.sectionPoints.a[10].s-garden.sectionPoints.a[6].e)/2+garden.sectionPoints.a[6].e
		garden.sectionPoints.a[8].e = (garden.sectionPoints.a[10].s-garden.sectionPoints.a[6].e)/2+garden.sectionPoints.a[6].e
		//quaterwhite_2
		garden.sectionPoints.a[7].s = (garden.sectionPoints.a[8].s-garden.sectionPoints.a[6].e)/2+garden.sectionPoints.a[6].e;
		garden.sectionPoints.a[7].e = (garden.sectionPoints.a[8].s-garden.sectionPoints.a[6].e)/2+garden.sectionPoints.a[6].e;
		//threequaterwhite_2
		garden.sectionPoints.a[9].s = (garden.sectionPoints.a[10].s-garden.sectionPoints.a[8].e)/2+garden.sectionPoints.a[8].e;
		garden.sectionPoints.a[9].e = (garden.sectionPoints.a[10].s-garden.sectionPoints.a[8].e)/2+garden.sectionPoints.a[8].e;
		ankerSet = false;
	}

	if(!timelineSet){
		//POSITIONS
		//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		// t_years.positions.push(div.getBoundingClientRect().y+windowOffset);
		for(var i=0; i<t_years.tens.length; i++){
			t_years.positions.push(get_boundaries("timeline-section", i).top)
			var div_t = document.createElement("div");
			var div_h = document.createElement("div");

			div_t.setAttribute("id", "t-element-t" + i);
			div_h.setAttribute("id", "t-element-h" + i);

			div_t.className += "t-element-t";
			div_h.className += "t-element-h";

			div_t.innerHTML = "<p>" + t_years.tens[i] +"</p>";
			div_h.innerHTML = "<p>" + t_years.hundreds[i] +"</p>";

			document.getElementById("timeline").appendChild(div_t);
			document.getElementById("timeline").appendChild(div_h);
		}
		timelineSet = true
	}
}

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

//calcs all the segments needed to draw pillars
function calcSegments(i_min, i_max, rectSize, c){

	for(var i = i_min; i<i_max; i++){


		const dot = jQuery.extend(true, {}, pillar.points[i]);

		var line = {};

		var this_pillar_Y = pillar.points[i].y + c

		if(windowOffset-200 < this_pillar_Y && this_pillar_Y<=windowOffset+window.innerHeight || i===0){

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
}

function calcX () {

var Source = jQuery.extend(true, [], pillar.pointsSource);
var spaceOutside = (window.innerWidth - $('#dark-content-wrapper').width())/2

	for (var i = 1; i < Source.length; i++){
		 var xPos = Source[i].x
		 var x

		if (xPos >= 0 && xPos <= 100){

			x = spaceOutside + mapArea(xPos, 0, 100, 0, $('#dark-content-wrapper').width()- pillar.size)
		}else if (xPos < 0){
			x = spaceOutside - 200 - (spaceOutside*0.3)
		}else {
			x = $('#dark-content-wrapper').width() + spaceOutside + (spaceOutside*0.3)
		}
		pillar.points[i].x = x
	}
}

//draws the shadows
function drawPolygon(polygon,ctx,fillStyle){

	ctx.rect(0,0,window.innerWidth, window.innerHeight);
	ctx.fillStyle = fillStyle; //shadowsOpacity
	ctx.fill();
	ctx.save();


	ctx.beginPath();
	ctx.moveTo(polygon[0].x ,polygon[0].y -windowOffset);
	for(var i=1;i<polygon.length;i++){
		var intersect = polygon[i];
		ctx.lineTo(intersect.x ,intersect.y -windowOffset);
	}
	ctx.closePath();
	ctx.clip();
	ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
	ctx.restore();
}

//draws the lightSpot
function drawSpot(image, x, y, width, height, opacity){
	ctxBg.globalAlpha = opacity
	ctxBg.drawImage(image, x, y, width, height);
	ctxBg.globalAlpha = 1
}

//draw shaft line
function drawShaft(x1,y1, x2, y2, shaftSize){

	//draw light
	ctxBg.strokeStyle = lightShaft.middle.color
	ctxBg.beginPath()
	ctxBg.moveTo(x1,y1);
	ctxBg.lineTo(x2, y2);
	ctxBg.lineTo(x1, y1);
	ctxBg.lineWidth = shaftSize;
	ctxBg.stroke();
}

//everything related to the canvas size
function resizeCanvas(){
	canvasBg.width = window.innerWidth;
	canvasBg.height = window.innerHeight;
	canvasFg.width = window.innerWidth;
	canvasFg.height = window.innerHeight;
	//default settings for lightShaft
	lightShaft.x1 = window.innerWidth/2
	lightShaft.x2 = lightShaft.x1
	lightShaft.y1 = 0;
	lightShaft.y2 = window.innerHeight;
	lightContentHeight = document.getElementById('light-content-wrapper').clientHeight;
	lightContentHeight = lightContentHeight-1950
	calcX();
	updateCanvas = true
}

//a function to map a number from one area to another (S = Source, T = Target)
function mapArea(x, min_S, max_S, min_T, max_T){
	var y = (max_T-min_T)*(x-min_S)/(max_S-min_S) + min_T
	return y
}

//deactivates all garden-states
function deactivateStates(){
	lightShaft.active = false;
	pillar.active = false;
	shadow.active = false;
	lightSpot.active = false;
	shaftGrowing = false;
	shaftShrinking = false;
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

		//'white_1', 'threequaterwhite_1', 'halfwhite_1', 'quaterwhite_1', 'onpixel_1', 'black', 'onepixel_2', 'quaterwhite_2', 'halfwhite_2', 'threequaterwhite_2', 'white_2'
		case 'white_1':
		shaftGrowing = true;
		lightShaft.active = true
		lightShaft.width = lightShaft.maxW;
		break;

		case 'white_1'+"++":
		lightShaft.middle.color = "rgb(255, 255, 255)";
		shaftGrowing = true;
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[0].e, sectionAnkers[1].s, shaftwidth1 * lightShaft.maxW, shaftwidth2 * lightShaft.maxW);
		break;

		case 'threequaterwhite_1':
		lightShaft.middle.color = "rgb(255, 255, 255)";
		shaftGrowing = true;
		lightShaft.active = true;
		lightShaft.width = lightShaft.maxW*0.9
		break;

		case 'threequaterwhite_1'+"++":
		lightShaft.middle.color = "rgb(255, 255, 255)";
		shaftGrowing = true;
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[1].e, sectionAnkers[2].s, shaftwidth2 * lightShaft.maxW, 895);
		pillar.active = true
		break;

		case 'halfwhite_1':
		lightShaft.middle.color = "rgb(255, 255, 255)";
		shaftGrowing = true;
		lightShaft.active = true;

		pillar.active = true
		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case 'halfwhite_1'+"++":
		lightShaft.middle.color = "rgb(255, 255, 255)";
		shaftGrowing = true;
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[2].e, sectionAnkers[3].s, 895, shaftwidth4 * lightShaft.maxW);

		pillar.active = true
		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case 'quaterwhite_1':
		lightShaft.middle.color = "rgb(255, 255, 255)";
		shaftGrowing = true;
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.25

		pillar.active = true

		lightSpot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case 'quaterwhite_1'+"++":
		lightShaft.middle.color = "rgb(255, 255, 255)";
		shaftGrowing = true;
		lightShaft.active = true;

		pillar.active = true

		lightSpot.active = true
		lightShaft.width = mapArea(windowOffset, sectionAnkers[3].e, sectionAnkers[4].s, window.innerWidth*0.25, 2);
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, 1)
		break;

		case 'onpixel_1':
		lightShaft.middle.color = "rgb(200, 200, 200)";
		lightShaft.active = true;
		lightShaft.width = 1

		pillar.active = true
		shadow.active = true

		lightSpot.active = true
		break;

		case 'onpixel_1'+"++":
		lightShaft.middle.color = "rgb(200, 200, 200)";
		lightShaft.active = true;
		lightShaft.width = 1
		lightShaft.y2 = mapArea(windowOffset, sectionAnkers[4].e, sectionAnkers[5].s, window.innerHeight, -20);
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
		var color = Math.round(mapArea(lightSpot.y, 0, window.innerHeight, backgroundHue.darkest*2.2, backgroundHue.lightest))
		canvasBg.style.background = "rgb("+color+","+color+","+color+")";
		break;

		case 'black':
		canvasBg.style.background = "rgb("+backgroundHue.darkest+","+backgroundHue.darkest+","+backgroundHue.darkest+")";
		pillar.active = true
		break;

		case 'black'+"++":
		lightShaft.middle.color = "rgb(200, 200, 200)"
		var color = Math.round(mapArea(lightSpot.y, 0, window.innerHeight, backgroundHue.lightest*0.7, backgroundHue.darkest))
		canvasBg.style.background = "rgb("+color+","+color+","+color+")";
		lightShaft.active = true;
		lightShaft.width = 1

		lightShaft.y1 = mapArea(windowOffset, sectionAnkers[5].e, sectionAnkers[6].s, window.innerHeight+300, 0);
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

		case 'onepixel_2':
		lightShaft.active = true;
		lightShaft.width = 1

		pillar.active = true
		shadow.active = true

		////lightspot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case 'onepixel_2'+"++":
		shaftShrinking = true;
		lightShaft.active = true;

		pillar.active = true

		//lightspot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		lightShaft.width = mapArea(windowOffset, sectionAnkers[6].e, sectionAnkers[7].s, 2, window.innerWidth*0.25);
		break;

		case 'quaterwhite_2':
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.25

		pillar.active = true

		//lightspot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case 'quaterwhite_2'+"++":
		shaftShrinking = true;
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[7].e, sectionAnkers[8].s, window.innerWidth*0.25, window.innerWidth*0.5);

		pillar.active = true
		//lightspot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case 'halfwhite_2':
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.5

		pillar.active = true
		lightspot.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case 'halfwhite_2'+"++":
		shaftShrinking = true;
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[8].e, sectionAnkers[9].s, window.innerWidth*0.5, window.innerWidth*0.75);

		pillar.active = true
		lightSpot.opacity = mapArea(lightShaft.width, window.innerWidth*0.5, 1, 0, .7)
		break;

		case 'threequaterwhite_2':
		lightShaft.active = true;
		lightShaft.width = window.innerWidth*0.75
		break;

		case 'threequaterwhite_2'+"++":
		shaftShrinking = true;
		lightShaft.active = true;
		lightShaft.width = mapArea(windowOffset, sectionAnkers[9].e, sectionAnkers[10].s, window.innerWidth*0.75, window.innerWidth);
		break;

		case 'white_2':
		lightShaft.active = true
		lightShaft.width = window.innerWidth;
		break;
		default:

	}
}


//Everything visible in the canvas
function draw(){

	segments = []

	calcSegments(1, pillar.points.length-1, pillar.size, lightContentHeight);
	calcSegments(0,1, 5000, windowOffset) //redefine, not calc -->write a different function

	// Clear canvas
	ctxBg.clearRect(0,0,window.innerWidth,window.innerHeight);
	ctxFg.clearRect(0,0,window.innerWidth,window.innerHeight);

	if (shaftGrowing) {
		var color = 255
		if (lightShaft.width != null){
			color = Math.round(mapArea(lightShaft.width, 0, lightShaft.maxW, backgroundHue.lightest, 255))
		}
		canvasBg.style.background = "rgb("+color+","+color+","+color+")";
	}

	if (shaftShrinking) {
		var color = Math.round(mapArea(lightShaft.width, 0, lightShaft.maxW, 50, 200))
		lightShaft.middle.color = "rgb(200, 200, 200)"
		ctxBg.fillStyle = "rgb("+color+","+color+","+color+")";
		ctxBg.rect(0, 0, window.innerWidth,window.innerHeight);
		ctxBg.fill();
	}

	//searches for boundaries of the div (top or bottom)
	scrollLight(garden.sectionPoints.a);

	if(shadow.active){
		// Sight Polygons
		var polygons = [getSightPolygon(lightSpot.x,lightSpot.y+windowOffset)];//needed
		for(var angle=0;angle<Math.PI*2; angle+=(Math.PI*2)/20){
			var dx = Math.sin(angle)*shadow.intersections.fuzzyness;
			var dy = Math.cos(angle)*shadow.intersections.fuzzyness;
			polygons.push(getSightPolygon((lightSpot.x+dx) ,(lightSpot.y+dy)));//needed
		};

		drawPolygon(polygons[0], ctxFg, shadow.color);
	}

	if(lightShaft.active){
		drawShaft(lightShaft.x1, lightShaft.y1, lightShaft.x2, lightShaft.y2, lightShaft.width);
	}

	//set the lightspot to the center of the screen and make it relate to the scrollingposition (obsolete)
	if(lightSpot.active){
		lightSpot.x = window.innerWidth/2 + 28
		lightSpot.image.height = mapArea(lightShaft.width, 1, window.innerWidth, lightSpot.height, 40*window.innerHeight)//window.innerHeight*4
		lightSpot.image.width = mapArea(lightShaft.width, 1, window.innerWidth, lightSpot.width, window.innerWidth)//window.innerHeight*4
		drawSpot(lightSpot.image,lightSpot.x-lightSpot.image.width/2,lightSpot.y-lightSpot.image.height/2, lightSpot.image.width, lightSpot.image.height, lightSpot.opacity);
	}

	if(pillar.active){
		for(var i=0;i<pillar.points.length;i++){
			ctxBg.fillStyle = pillar.color
			var spot = pillar.points[i];
			if(windowOffset-200 < spot.y <=windowOffset+window.innerHeight){
				ctxBg.beginPath();
				ctxBg.moveTo(spot.x ,spot.y +lightContentHeight -windowOffset);
				ctxBg.lineTo(spot.x+pillar.size,spot.y +lightContentHeight - windowOffset);
				ctxBg.lineTo(spot.x+pillar.size,spot.y +lightContentHeight + pillar.size -windowOffset);
				ctxBg.lineTo(spot.x,spot.y+pillar.size +lightContentHeight -windowOffset);
				ctxBg.fill();

			}
		}
	}
}

//fills the content in the white info-area from a spreadsheet
function infoData(){
	for(i=0; i<dataInfo.length; i++){

		var this_content = dataInfo[i];

		var div = document.createElement("div");
		var h3 = document.createElement("h3");
		var p = document.createElement("p");

		h3.innerHTML = this_content.name;
		p.innerHTML = this_content.text;

		div.className += this_content.class;

		//fills in an Id if one exists
		if(this_content.id.length >= 2){
			div.setAttribute("id", this_content.id);
		}

		div.append(p);

		if(this_content.section == "iWrapper1"){
			var wrapper = "light-content-wrapper"
		}else if(this_content.section == "iWrapper2"){
			var wrapper = "light-content-wrapper2"
		}

		document.getElementById(wrapper).appendChild(div);
	}
	infoLoaded = true
}


function contentData(){


	for(i=0; i<dataContent.length; i++){


		var this_content = dataContent[i];


		if(this_content.type === "content"){
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
				emDiv.className += "em-right"
				imageDiv.className += "image-middle-left"
				metadataDiv.className += "metadata-middle-left";
				subtitleDiv.className += "subtitle-middle-left";
			}else {
				imageDiv.className += "image-middle-right"
				emDiv.className += "em-left"
				metadataDiv.className += "metadata-middle-right";
				subtitleDiv.className += "subtitle-middle-right";
			}
			var emNumber = document.createElement("p");
			emNumber.innerHTML = this_content.emNumber
			emNumber.className += "emNumber"

			var em = document.createElement("p");
			em.innerHTML = this_content.em

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
			subtitleP.innerHTML = this_content.subtitle.split("-").join("&#8209;");

			innerDiv.append(h2)
			innerDiv.append(p)
			subtitleDiv.append(subtitleP)
			innerDiv.append(subtitleDiv)
			metadataDiv.append(metaP)
			imageDiv.append(img)
			imageDiv.append(metadataDiv)

			//fills in an Id if one exists
			if(this_content.id.length >= 2){
				div.setAttribute("id", this_content.id);
			}

			div.append(innerDiv)
			div.append(imageDiv)
			if (this_content.em != ""){
				emDiv.append(emNumber)
				emDiv.append(em)
				emBlock.append(emDiv)
				document.getElementById("dark-content-wrapper").appendChild(emBlock);
			}
			document.getElementById("dark-content-wrapper").appendChild(div);



			//defines/pulls year-infos into the t_years object
			if(4===this_content.year.length){
				//tens
				t_years.hundreds.push(this_content.year.substring(0, 2));

				//hundreds
				t_years.tens.push(this_content.year.substring(2, 4));

				//POSITIONS
				var p = $(div);
				t_years.positions.push(div.getBoundingClientRect().y+windowOffset);
			}

		}else if(this_content.type === "section"){
			var div = document.createElement("div");
			div.className = "content-block"

			var innerDiv = document.createElement("div");
			innerDiv.className = "timeline-section " + this_content.class;
			innerDiv.innerHTML = this_content.text;

			if(this_content.id.length >= 2){
				div.setAttribute("id", this_content.id);
			}

			div.append(innerDiv)
			document.getElementById("dark-content-wrapper").appendChild(div);

			var split_p = 2
			var end_p = 4

			if(this_content.year.length===1){
				split_p = 0
				end_p = 1
			}else if(this_content.year.length===2){
				split_p = 0
				end_p = 2
			}else if(this_content.year.length===3){
				split_p = 1
				end_p = 3
			}else if(this_content.year.length===5){
				split_p = 3
				end_p = 5
			}

			//tens
			t_years.hundreds.push(this_content.year.substring(0, split_p));

			//hundreds
			t_years.tens.push(this_content.year.substring(split_p, end_p));
		}
	}
	//breaks text on the right place
	$('.content-block p').each(function(){
		var string = $(this).html();
		for (var i = 0; i < 2; i++){
			string = string.replace(/ ([^ ]*)$/,'&nbsp;$1');
		}
		$(this).html(string);
	});
	$('.emBlock p').each(function(){
		var string = $(this).html();
		for (var i = 0; i < 2; i++){
			string = string.replace(/ ([^ ]*)$/,'&nbsp;$1');
		}
		$(this).html(string);
	});

	contentLoaded = true;
	drawLoop()
}


//aligns text left/right to the shaft
function voidText(textID, left, right){
	var gap = window.innerWidth * mapArea(lightShaft.width, 1, window.innerWidth, 0.065, -0.1)
	var textMargin = (lightShaft.width+1)/2 - gap/2
	if(left){
		$(textID).css({"margin-right": textMargin+"px"})
		$(textID).css({"margin-left": -textMargin+"px"})
	}else if(right){
		$(textID).css({"margin-left": textMargin+"px"})
		$(textID).css({"margin-right": -textMargin+"px"})
	}
}

//draws the timeline
function timeline(){

	//hides timeline if it is outside the dark-conten-wrapper UPDATE Necessary
	if(windowOffset>get_boundaries('#light-content-wrapper2', 'id').top || windowOffset<get_boundaries('#light-content-wrapper', 'id').bot){
		$('#timeline').addClass("animate")
		$('#timeline').removeClass("animate-back")
	}else{
		$('#timeline').addClass("animate-back")
		$('#timeline').removeClass("animate")
	}

	var maxi

	for(var i=0; i<t_years.positions.length; i++){

		$('.t-element-t:eq('+i+')').css({"opacity": 0});
		$('.t-element-t:eq('+i+')').css({'transform' : 'translate(' + 0 +', ' + 0 + ')'});

		$('.t-element-h:eq('+i+')').css({"opacity": 0});
		$('.t-element-h:eq('+i+')').css({'transform' : 'translate(' + 0 +', ' + 0 + ')'});

		var time_position = t_years.positions[i] - windowOffset

		//case section is between middle and bottom of the screen
		if(time_position <= window.innerHeight){
			maxi = i
			}
		}

		var maxiPosition = t_years.positions[maxi]

		if((maxiPosition - windowOffset)<=window.innerHeight*0.47 && maxi >= 0){
			$('.t-element-t:eq('+maxi+')').css({"opacity": 1});
			$('.t-element-h:eq('+maxi+')').css({"opacity": 1});
		}else{

			var sec_maxi = maxi-1
			var opacitator = mapArea(maxiPosition - windowOffset, window.innerHeight, window.innerHeight*0.47,0,1)

			//TENS opacity
			$('.t-element-t:eq('+maxi+')').css({"opacity": opacitator*opacitator*opacitator});
			if(sec_maxi>=0){
			$('.t-element-t:eq('+sec_maxi+')').css({"opacity": 1-opacitator*opacitator});
			}
			//TENS transformation
			var transformer = mapArea(opacitator, 0, 1, window.innerHeight/2.4, 0)
				$('.t-element-t:eq('+maxi+')').css({'transform' : 'translate(' + 0 +', ' + transformer + 'px)'});
				if(sec_maxi>=0){
				$('.t-element-t:eq('+sec_maxi+')').css({'transform' : 'translate(' + 0 +', ' + (transformer-window.innerHeight/2.4)*0.15 + 'px)'});
			}


			if(t_years.hundreds[maxi-1] != t_years.hundreds[maxi]){
				//HUNDS opacity
				$('.t-element-h:eq('+maxi+')').css({"opacity": opacitator});
				if(sec_maxi>=0){
				$('.t-element-h:eq('+sec_maxi+')').css({"opacity": 1-opacitator});
				}

				//HUNS transformation
				var transformer = mapArea(opacitator, 0, 1, window.innerHeight/4.8, 0)
					$('.t-element-h:eq('+maxi+')').css({'transform' : 'translate(' + 0 +', ' + transformer + 'px)'});
					if(sec_maxi>=0){
					$('.t-element-h:eq('+sec_maxi+')').css({'transform' : 'translate(' + 0 +', ' + (transformer-window.innerHeight/4.8)*0.15 + 'px)'});
				}
			}else{
				//HUNDS opacity
				$('.t-element-h:eq('+maxi+')').css({"opacity": 1});
			}



		}
				}


//spots element, returns true if it is in viewport or false if not
function div_visible(divElement, space_top, space_bot){
	var top_of_element = $(divElement).offset().top;
	var bottom_of_element = $(divElement).offset().top + $(divElement).outerHeight();
	var bottom_of_screen = $(window).scrollTop() + window.innerHeight;
	var top_of_screen = $(window).scrollTop();

	if((bottom_of_screen-space_bot > top_of_element) && (top_of_screen+space_top < bottom_of_element)){
		return true
	}
	else {
		return false
	}
}

//triggers css-animation when element is reaching a specific position in the viewport (default = whole viewport)
function triggerClassAnimation(selectorClass, space_top, space_bot, enter_animation_state, leave_animation_state){
	var section = document.getElementsByClassName(selectorClass)


	for(i=0; i<section.length; i++){
		section_states[i] = div_visible(section[i], space_top, space_bot)
	}

	for(n=0; n<section_states.length; n++){
			if(section_states[n]){
				$( "."+selectorClass + ":eq("+ n +")" ).removeClass(leave_animation_state);
				$( "."+selectorClass + ":eq("+ n +")" ).addClass(enter_animation_state);
			}else if(!section_states[n]){
				$( "."+selectorClass + ":eq("+ n +")" ).removeClass(enter_animation_state);
				$( "."+selectorClass + ":eq("+ n +")" ).addClass(leave_animation_state);
		}
	}
}

//picks the nth element of a and analyses its y-position and returns in top and bot - if id input id into n
function get_boundaries(selectorClass, n){
	if(n == "id"){
		var divElement = selectorClass
	}else{
		var divElement = $( "."+selectorClass + ":eq("+ n +")")
	}
	var divPosition = {}
	divPosition.top = $(divElement).offset().top;
	divPosition.center = $(divElement).offset().top + ($(divElement).height()-window.innerHeight)/2;
	divPosition.bot = $(divElement).offset().top + $(divElement).height()-window.innerHeight;
	return divPosition
}

//everything that changes HTML or CSS Properties
function manipulateHTML(){

	//move + fill timeline
	timeline();

	//changes margin of the left and righttext (voidText: "element_id, left (boolean), right(boolean)")
	voidText("#quote2-left", true, false)
	voidText("#quote2-right", false, true)

	//triggers animation when element is reaching a specific position
	var visibility_height = 200 + window.innerHeight*0.3;
	var total_padding = window.innerHeight-visibility_height
	//--> selector, space top, space bot, EnteranimationClassName, leave_animationClassname
	triggerClassAnimation('timeline-section', total_padding*0.5, total_padding*0.5, " animate", "animate-back")
	triggerClassAnimation('author', total_padding*0.5, total_padding*0.5, "appear", "animate-back")
}

//everything triggered when input-changes are happening
function drawLoop(){
	requestAnimationFrame(drawLoop);
	if(updateCanvas && dataLoaded){
		getAnkers();
		draw();
		manipulateHTML();
		updateCanvas = false;
	}else if(!dataLoaded){
		// (minimum the anmation will last, time after the animation-layer is removed (currently 2 sec because animation lasts 1.5secs))
		pageload(2000, 2000)
	}
}

//set a timer for the function until disappears when not triggered lineWidth
function pageload(t_value, a_value) {
	setTimeout(function(){
		//executes when all content loaded
		if(contentLoaded && infoLoaded){
			//blend out animation
			$( ".loader-wrapper:eq(0)" ).addClass("blendover");
			$(document.body).css({"overflow-y": "auto"})
			setTimeout(function(){
				$(".loader-wrapper:eq(0)").remove();
				dataLoaded = true;
				resizeCanvas();
			}, a_value);
			}
	}, t_value);
}

//######################EVENTS##########################

//everything happening when scrolling
window.addEventListener('scroll', function(e){
	windowOffset = window.pageYOffset;
	updateCanvas = true;
})

// resize the canvas to fill browser window dynamically
window.addEventListener('resize', resizeCanvas, false);

//everything happening on pageload
window.onload = function(){
	lightSpot.image.onload = function(){};
	lightSpot.image.src = "assets/garden_lightShaftSpot.png";
};
