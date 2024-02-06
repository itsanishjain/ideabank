const siteUrl = window.location.origin;
const frame = document.body.querySelector(".frame");
let rows;

const db = async (status) => {
    const like = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "current.innerText",
            status: "like",
            image: "img",
        }),
    };

    const dislike = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "current.innerText",
            status: "dislike",
            image: "img",
        }),
    };

    if (status === "like") {
        fetch(siteUrl + "/fire", like);
    }
    else {
        fetch(siteUrl + "/fire", dislike);
    }

}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const createCard = (row) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <div class="bottom">
            <div class="title">
                <span>${row[3]}</span>  
            </div>
        </div>
    `;
    return card;
}

const moreCards = () => {
    if (!frame) return;
    for (let i = 0; i < 5; i++) {
        const values = rows[i].split("\t");
        const card = createCard(values);
        frame.appendChild(card);
        addHammer(card);
    }
}

const fetchCards = () => {
    if (!frame) return;
    const headers = [
        "",
        "Date",
        "Device Name",
        "Description",
        "Novel",
        "Author",
        "Built?",
        "By Whom?",
        "Product",
        "First Year Made",
        "Additional Details",
        "Bits or Atoms?",
        "Companies Working on This",
        "Link to Doc With Technical Details",
        "Requires Changes to Laws of Physics",
    ];
    // read from the local tsv file
    fetch("/ideabank.tsv")
        .then((response) => response.text())
        .then((data) => {
            rows = data.split("\n");
            // Randomize the rows
            rows = shuffle(rows);
            for (let i = 0; i < 5; i++) {
                const values = rows[i].split("\t");
                const card = createCard(values);
                frame.appendChild(card);
                addHammer(card);
            }
        });
};

const addHammer = (el) => {
    // Creates the object
    var hammerTime = new Hammer(el);
    // Unlocks vertical pan and pinch
    hammerTime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    hammerTime.get('pinch').set({ enable: true });

    // When user grabs the card..
    hammerTime.on("pan", function (ev) {
        // When the card start moving, the transition become "none" to avoid delay while dragging
        el.classList.add("moving");
        // If the card go 80px left/right, the "nope"/"like" stamp appears using css::after
        el.classList.toggle("nope", ev.deltaX < -80);
        el.classList.toggle("like", ev.deltaX > 80);
        el.classList.toggle("super_like", ev.deltaY < -72 & Math.abs(ev.deltaX) < 80);
        // Calculates card rotation based on offset
        var rotate = ev.deltaX * ev.deltaY * 4e-4;
        // And applies the movement
        el.style.transform = "translate(" + ev.deltaX + "px, " + ev.deltaY + "px) rotate(" + rotate + "deg)";
    });

    // When user releases the card..
    hammerTime.on("panend", function (ev) {
        // Gets the positive value of velocity and X-deslocation
        var absVel = Math.abs(ev.velocity);
        var absDelX = Math.abs(ev.deltaX);
        var x = ev.center.x
        // if x is negative, then it is a left swipe
        if (x < 0) {
            console.log("Left Swipe")
            db("dislike");
        } else {
            console.log("Right Swipe")
            db("like");
        }
        // Removes the stamps and retrieve the 300ms transition
        el.classList.remove("nope", "like", "super_like", "moving");
        if (absDelX > 80) {
            frame.removeChild(el);
            const remainingCards = frame.getElementsByClassName("card");
            if (remainingCards.length < 2) {
                moreCards();
            }
            // If the card had a "like"/"dislike" reaction
            // card fades faster if dragged faster, beetwen 400 and 150ms
            var transitionDuration = 250 / (absVel + 0.4) > 150 ? 250 / (absVel + 0.4) > 400 ? 400 : 250 / (absVel + 0.4) : 150;
            el.style.transitionDuration = transitionDuration + 'ms';
            var rotate = ev.deltaX * ev.deltaY * 4e-4;
            // And is thrown farther too
            var mult = absVel > 1.4 ? absVel : 1.4;
            el.style.transform = "translate(" + ev.deltaX * 1.4 * mult + "px, " + ev.deltaY * mult + "px) rotate(" + rotate * mult + "deg)";
            // Fade out
            el.style.opacity = 0;
        } else {
            // If the card didn't have a reaction, it goes back to the middle
            el.style.transform = '';
        }
    });

    hammerTime.on("pinch", function (ev) {
        el.style.transitionDuration = '0ms';
        el.style.transform = "scale(" + ev.scale + ")";
    });

    hammerTime.on("pinchend", function (ev) {
        el.style.transform = "scale(1)";
    });
}

(() => {
    fetchCards();
})()