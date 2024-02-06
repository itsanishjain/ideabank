const siteUrl = window.location.origin;
const frame = document.body.querySelector(".frame");
let cardUsed = 5;
let rows;

const addToLocalStorage = (key, value) => {
    localStorage.setItem(key, value);
}

const db = async (status, item) => {
    const name = item.querySelector("#name").getAttribute("name");

    const like = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: name,
            status: "like",

        }),
    };

    const dislike = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: name,
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

const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const showRanking = (key = "Steelonium") => {
    // Show ratings of the card if it is in the local storage

    if (localStorage.getItem(key)) {
        const data = JSON.parse(localStorage.getItem("Steelonium"));
        const rating = document.createElement("div");
        rating.id = key;
        rating.innerHTML = `
        <div class="flex justify-between">
        <div class="like">
            <span>👍️</span>
            <span>${data.like}</span>
        </div>
        <div class="dislike">
            <span>👎️</span>
            <span>${data.dislike}</span>
        </div>
        </div>
        `;
        return rating;
    }
}

const createCard = (row) => {
    const key = row[2].replace(/\s+/g, '_');

    // fetch ranking for the card
    fetch(siteUrl + "/rankings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: key }),
    }).then((response) => response.json()).then((data) => {
        // console.log(data)
        if (data.message != "fail") {
            addToLocalStorage(key, JSON.stringify(data.data));
        }
    })
    const card = document.createElement("div");
    const rating = showRanking(key);
    card.className = "card";
    card.innerHTML = `
    <div class="card-content">
        ${rating ? rating.outerHTML : ""}
        <div class="mt-1 card-body space-y-1">
            <div id="name" name=${key}>${row[2]}</div>
            <div>First Sight Night 👀️ ${row[1]}</div>
            <div>${row[5]} | ${row[4]}</div>
        </div>
        
        <div class="bottom">
            <div class="title">
                <span>${row[3]}</span>  
            </div>
        </div>
        <div>
        <div class="mt-2 text-lg">
            Built 🏗️: ${row[6]} ${row[7] != "N/A" ? `by ${row[7]}` :
            ""}</div>
        </div>
        <div>${row[11]}</div>
        </div>
    `;
    return card;
}

const moreCards = () => {
    if (!frame) return;
    for (let i = cardUsed; i < cardUsed + 5; i++) {
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
    // console.log(headers)
    // read from the local tsv file
    fetch("/ideabank.tsv")
        .then((response) => response.text())
        .then((data) => {
            rows = data.split("\n");
            // Randomize the rows
            rows = shuffle(rows);
            for (let i = 0; i < 5; i++) {
                const values = rows[i].split("\t");
                // console.log(values)
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
            db("dislike", el);
        } else {
            console.log("Right Swipe")
            db("like", el);
        }
        // Removes the stamps and retrieve the 300ms transition
        el.classList.remove("nope", "like", "super_like", "moving");
        if (absDelX > 80) {

            frame.removeChild(el);
            cardUsed += 1;
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