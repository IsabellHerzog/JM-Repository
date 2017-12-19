document.addEventListener('mousemove', (event) => {
    const relativeMousePosition = {
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight
    };

    moveBalken(relativeMousePosition);
    moveTextBlocks(relativeMousePosition);
});

function moveBalken(relativeMousePosition) {
    const angle = relativeMousePosition.x*120-60;
    const balken = document.getElementsByClassName('balken')[0];
    balken.style.transform = `translate(-50%, ${-500 * relativeMousePosition.y}%)`;

    const lane = document.getElementsByClassName('lane')[0];
    lane.style.transform = `translate(0, -50%) rotate(${angle}deg)`;
}

function moveTextBlocks(relativeMousePosition) {
    const textBlocks = document.getElementsByClassName('text');
    textBlocks[0].style.transform = `translateX(${-150 * relativeMousePosition.y}%)`;
    textBlocks[1].style.transform = `translateX(${150 * relativeMousePosition.y}%)`;
}


function findWord(parentElt, x, y) {
    if (parentElt.nodeName !== '#text') {
        return null;
    }
    const range = document.createRange();
    const words = parentElt.textContent.split(' ');
    let start = 0;
    let end = 0;
    for (let index = 0; index < words.length; index++) {
        let word = words[index];
        end = start + word.length;
        range.setStart(parentElt, start);
        range.setEnd(parentElt, end);

        const rects = range.getClientRects();
        const clickedRect = isClickInRects(rects);
        if (clickedRect) {
            return [word, start, clickedRect];
        }
        start = end + 1;
    }

    function isClickInRects(rects) {
        console.log(rects);
        for (var index = 0; index < rects.length; ++index) {
            var rect = rects[index]
            if (rect.left < x && rect.right > x && rect.top < y && rect.bottom > y) {
                return rect;
            }
        }
        return false;
    }
    return null;
}

function onClick(e) {
    const element = document.getElementById('info');
    const clicked = findWord(e.target.childNodes[0], e.clientX, e.clientY);
    element.innerHTML = 'Isnt’t a text element';
    if (clicked) {
        const word = clicked[0];
        const rect = clicked[2];
        element.innerHTML = `The word: ${word} starts/ends at: ${rect.left}, ${rect.right}`;

        const indicator = document.getElementById('indicator');
        indicator.style.left = `${rect.right}px`;
    }
}

document.addEventListener('click', onClick);
