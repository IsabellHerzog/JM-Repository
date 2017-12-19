
var webWrapper = document.querySelector("#webContentWrapper")

//window.addEventListener("DOMContentLoaded", scrollLoop, false);
var e = $('.leftRightContent');
for (var i = 0; i < 100; i++) {
  e.clone().insertAfter(e);
}



var text = '{ "employees" : [' +
'{ "firstName":"John" , "lastName":"Doe" },' +
'{ "firstName":"Anna" , "lastName":"Smith" },' +
'{ "firstName":"Peter" , "lastName":"Jones" } ]}';

var obj = JSON.parse(text);

console.log(obj.employees[1].firstName + " " + obj.employees[1].lastName);



$(window).scroll(function() {
  var minNumber = 1
  var maxNumber = document.querySelector("#webContentWrapper").scrollHeight
  var logNumber = Math.log($(this).scrollTop()/100 + 1);
  var minLogNumber = Math.log(minNumber);
  var maxlogNumber = Math.log(maxNumber);
  var webHeight = mapNumber(logNumber,minLogNumber,maxlogNumber,minNumber, maxNumber)

  //console.log("minLogNumber:" + minLogNumber);

  console.log(webHeight);
  setTranslate(0, $('#webWrapper').scrollTop() - webHeight, webWrapper)



})

function mapNumber(x, in_min, in_max, out_min, out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
function setTranslate(xPos, yPos, el){
  el.style.transform = "translate3d(" + xPos + "," + yPos + "px, 0";
}



//
// var easeOutQuad = function (x, t, b, c, d) {
//     return -c *(t/=d)*(t-2) + b;
// };




// function scrollLoop(e) {
//   YScrollPosition = window.scrollY;
//   //console.log(YScrollPosition);
//
//   setTranslate(0, YScrollPosition, webWrapper)
//   requestAnimationFrame(scrollLoop);
// }
