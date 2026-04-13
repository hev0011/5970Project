// -- shared data ------------------------------------------------------------------
// when the app loads, we check if there are already books or goals saved
// in the browser's memory (localStorage). if nothing is there, we start
// with empty lists so the app doesn't crash
let books = JSON.parse(localStorage.getItem('books')) || [];
let goals = JSON.parse(localStorage.getItem('goals')) || [];

// this function saves both lists to the browser's memory any time something changes
// JSON.stringify turns our javascript list into text so the browser can store it
function saveData() {
    localStorage.setItem('books', JSON.stringify(books));
    localStorage.setItem('goals', JSON.stringify(goals));
}

// -- router -----------------------------------------------------------------------
// this runs once the whole html page has finished loading
// it looks at the url to figure out which page we're on, then calls
// the right setup function for that page
document.addEventListener('DOMContentLoaded', function () {
    // grab the last part of the url, like "goals.html" or "stats.html"
    const path = window.location.pathname.split('/').pop();

    // compare the page name and run the matching setup function
    switch (path) {
        case 'index.html':
        case '': // empty string means we're at the root, same as index.html
            initializeHomePage();
            break;
        case 'goals.html':
            initializeGoalsPage();
            break;
        case 'my-books.html':
            initializeBooksPage();
            break;
        case 'add-audio.html':
            initializeAudioForm();
            break;
        case 'add-physical.html':
            initializePhysicalForm();
            break;
        case 'stats.html':
            initializeStatsPage();
            break;
    }
});

// -- shared helpers ---------------------------------------------------------------
// these are small utility functions used by multiple pages

// finds a dialog (popup) by its id and closes it
function closeDialog(dialogId) {
    document.getElementById(dialogId)?.close();
}

// takes a date string like "2024-03-15" and turns it into something
// more readable like "Mar 15, 2024"
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// builds a string of star emojis based on a number rating
// for example, a rating of 3 returns "⭐⭐⭐☆☆"
function generateStars(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
        // if this star's position is less than the rating, fill it in
        stars += i < rating ? '⭐' : '☆';
    }
    return stars;
}

// finds all the star rating widgets on the page and makes them clickable
// when a user clicks a star, it saves the value and updates the visual display
function setupStarRatings() {
    // get every star rating group on the current page
    const starContainers = document.querySelectorAll('.star-rating');

    starContainers.forEach(container => {
        const stars = container.querySelectorAll('.star');
        // the hidden input is what actually stores the number value (1-5)
        const hiddenInput = container.parentElement.querySelector('input[type="hidden"]');

        // if there's no hidden input to save to, skip this container
        if (!hiddenInput) return;

        stars.forEach(star => {
            star.addEventListener('click', function () {
                // read the data-value attribute on the clicked star (1, 2, 3, 4, or 5)
                const value = parseInt(this.getAttribute('data-value'));

                // save that number in the hidden input so forms can read it
                hiddenInput.value = value;

                // loop through all stars and update their look
                // stars up to and including the clicked one get filled in
                stars.forEach((s, index) => {
                    s.textContent = index < value ? '⭐' : '☆';
                });
            });
        });
    });
}

// -- home page --------------------------------------------------------------------
function initializeHomePage() {
    // the home page buttons link directly to other pages via href in the html
    // so there's no extra javascript setup needed here
}

// -- goals page -------------------------------------------------------------------
// sets up everything the goals page needs when it loads

   function initializeGoalsPage() {
    setupStarRatings();
    renderGoals();

    document.getElementById('goal-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const goalId = document.getElementById('goal-id').value;
        const goalName = document.getElementById('goal-name').value;
        const goalTarget = parseInt(document.getElementById('goal-target').value);
        const goalCurrent = parseInt(document.getElementById('goal-current').value);

        // Validate inputs
        if (isNaN(goalTarget) || goalTarget < 0 || goalTarget > 1000) {
            alert('Goal target must be between 0 and 1000.');
            return;
        }

        if (isNaN(goalCurrent) || goalCurrent < 0 || goalCurrent > goalTarget) {
            alert(`Current progress must be between 0 and the goal target (${goalTarget}).`);
            return;
        }

        if (goalId) {
            // Editing existing goal
            const goalIndex = goals.findIndex(g => g.id == goalId);
            if (goalIndex !== -1) {
                goals[goalIndex] = {
                    ...goals[goalIndex],
                    name: goalName,
                    target: goalTarget,
                    current: goalCurrent
                };
            }
        } else {
            // Adding new goal (goalId is empty)
            goals.push({
                id: Date.now(),
                name: goalName,
                target: goalTarget,
                current: goalCurrent,
                createdAt: new Date().toISOString()
            });
        }

        saveData();
        closeDialog('dialog-new-goal');
        resetGoalForm();
        renderGoals();
    });
}
// Delete a goal by ID
function deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal?')) {
        goals = goals.filter(g => g.id !== goalId);
        saveData();
        renderGoals();
    }
}

// draws all goals on the page, splitting them into "active" and "completed"
function renderGoals() {
    const activeList = document.getElementById('active-list');
    const completedList = document.getElementById('completed-list');

    // if these elements don't exist, we're not on the goals page -- stop here
    if (!activeList || !completedList) return;

    // clear both lists before redrawing so we don't get duplicates
    activeList.innerHTML = '';
    completedList.innerHTML = '';

    goals.forEach(goal => {
        // calculate how far along this goal is as a percentage
        const progress = (goal.current / goal.target) * 100;
        const isCompleted = progress >= 100;

        // create a new div element and fill it with the goal's info
        const goalElement = document.createElement('div');
        goalElement.className = 'goal-item';
        goalElement.innerHTML = `
            <h3>${goal.name}</h3>
            <p>${goal.current} / ${goal.target} completed</p>
            <div class="goal-progress-bar">
                <div class="goal-progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
            </div>
            <div class="goal-stats">
                <span>${Math.round(progress)}%</span>
                <button onclick="editGoal(${goal.id})">Edit</button>
                <button onclick="deleteGoal(${goal.id})">Delete</button>
            </div>
        `;

        // put completed goals in the completed section, active goals in the active section
        if (isCompleted) {
            completedList.appendChild(goalElement);
        } else {
            activeList.appendChild(goalElement);
        }
    });
}

// opens the edit dialog and fills it with the data from the goal being edited
function editGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return; // if we can't find the goal, stop

    // fill in the form fields with the existing goal data
    document.getElementById('goal-name').value = goal.name;
    document.getElementById('goal-target').value = goal.target;
    document.getElementById('goal-current').value = goal.current;
    document.getElementById('goal-id').value = goal.id; // hidden field tracks which goal we're editing

    // change the dialog title and button text so the user knows they're editing
    document.getElementById('goal-dialog-title').textContent = 'Edit Goal';
    document.getElementById('goal-submit-btn').textContent = 'Update Goal';

    document.getElementById('dialog-new-goal').showModal();
}

// clears all the goal form fields and resets the title/button text back to defaults
function resetGoalForm() {
    document.getElementById('goal-form')?.reset();
    document.getElementById('goal-id').value = '';
    document.getElementById('goal-dialog-title').textContent = 'Start a New Goal';
    document.getElementById('goal-submit-btn').textContent = 'Save Goal';
}

// -- my books page ----------------------------------------------------------------
// sets up everything the books page needs when it loads
function initializeBooksPage() {
    setupTabNavigation(); // make the "completed" / "favorites" tabs work
    setupStarRatings();
    renderBooks(); // draw any books that are already saved

    // listen for the edit book form being submitted
    document.getElementById('edit-book-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const bookId = parseInt(document.getElementById('edit-book-id').value);

        // build an updated book object with all the new values from the form
        const updatedBook = {
            id: bookId,
            title: document.getElementById('edit-title').value,
            author: document.getElementById('edit-author').value,
            length: document.getElementById('edit-length').value,
            dateFinished: document.getElementById('edit-date').value,
            rating: parseInt(document.getElementById('edit-rating-value').value),
            genre: document.getElementById('edit-genre').value,
            // keep the original book type (audio/physical) since we don't change it here
            type: books.find(b => b.id === bookId)?.type || 'physical'
        };

        // find where this book sits in the array and replace it
        const bookIndex = books.findIndex(b => b.id === bookId);
        if (bookIndex !== -1) {
            books[bookIndex] = updatedBook;
            saveData();
            closeDialog('dialog-edit-book');
            renderBooks(); // redraw the list with the updated book info
        }
    });
}

// makes the tab buttons switch between the "completed" and "favorites" sections
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabName = this.getAttribute('data-tab'); // e.g. "completed" or "favorites"

            // remove the active style from all tabs, then add it to the clicked one
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // hide all book sections, then show only the matching one
            document.querySelectorAll('.book-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${tabName}-books`).classList.add('active');
        });
    });
}

// calls both render functions to refresh the full books page
function renderBooks() {
    renderCompletedBooks();
    renderFavoriteBooks();
}

// draws the list of all completed books, sorted newest first
function renderCompletedBooks() {
    const container = document.getElementById('completed-books');
    if (!container) return;
    container.innerHTML = ''; // clear old content before redrawing

    // sort a copy of books by date finished, newest at the top
    const sortedBooks = [...books].sort((a, b) => new Date(b.dateFinished) - new Date(a.dateFinished));

    sortedBooks.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book-item';
        bookElement.innerHTML = `
            <h3>${book.title}</h3>
            <p>By: ${book.author}</p>
            <p>Type: ${book.type === 'audio' ? '🎧 Audio' : '📖 Physical'}</p>
            <p>Length: ${book.length}</p>
            <p>Date Finished: ${formatDate(book.dateFinished)}</p>
            <p>Genre: ${book.genre || 'Not specified'}</p>
            <div class="book-rating">${generateStars(book.rating)}</div>
            <button onclick="openEditBook(${book.id})" style="margin-top: 0.5rem;">Edit</button>
        `;
        container.appendChild(bookElement);
    });
}

// draws only the books that have a 5-star rating (user's favorites)
function renderFavoriteBooks() {
    const container = document.getElementById('favorite-books');
    if (!container) return;
    container.innerHTML = '';

    // filter to only keep 5-star books, then sort newest first

    //LOOK OVER THE FAVORITES (NOT WORKING)
    const favoriteBooks = books
        .filter(book => book.rating === 5)
        .sort((a, b) => new Date(b.dateFinished) - new Date(a.dateFinished));

    favoriteBooks.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book-item';
        bookElement.innerHTML = `
            <h3>${book.title}</h3>
            <p>By: ${book.author}</p>
            <p>Type: ${book.type === 'audio' ? '🎧 Audio' : '📖 Physical'}</p>
            <p>Length: ${book.length}</p>
            <p>Date Finished: ${formatDate(book.dateFinished)}</p>
            <p>Genre: ${book.genre || 'Not specified'}</p>
            <div class="book-rating">${generateStars(book.rating)}</div>
            <button onclick="openEditBook(${book.id})" style="margin-top: 0.5rem;">Edit</button>
        `;
        container.appendChild(bookElement);
    });
}

// opens the edit dialog and pre-fills it with the chosen book's current data
function openEditBook(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    // fill every form field with the book's saved data
    document.getElementById('edit-book-id').value = book.id;
    document.getElementById('edit-title').value = book.title;
    document.getElementById('edit-author').value = book.author;
    document.getElementById('edit-length').value = book.length;
    document.getElementById('edit-date').value = book.dateFinished;
    document.getElementById('edit-genre').value = book.genre || '';
    document.getElementById('edit-rating-value').value = book.rating;

    // update the star visuals to match the book's saved rating
    const stars = document.querySelectorAll('#edit-book-form .star');
    stars.forEach((star, index) => {
        star.textContent = index < book.rating ? '★' : '☆' | '⯪';
    });

    document.getElementById('dialog-edit-book').showModal();
}

// -- add audio form ---------------------------------------------------------------
// sets up the form for adding a new audio book
function initializeAudioForm() {
    setupStarRatings();

    document.getElementById('audio-book-form').addEventListener('submit', function (e) {
        e.preventDefault();

        // build a new book object from what the user typed
        const newBook = {
            id: Date.now(), // unique id based on the current timestamp
            title: document.getElementById('audio-title').value,
            author: document.getElementById('audio-author').value,
            length: document.getElementById('audio-length').value, // stored as "h:mm" text
            dateFinished: document.getElementById('audio-date').value,
            rating: parseInt(document.getElementById('audio-rating-value').value),
            genre: document.getElementById('audio-genre').value,
            type: 'audio' // tag this book so we know it's an audiobook later
        };

        books.push(newBook); // add it to the list
        saveData();
        window.location.href = 'my-books.html'; // send the user to their book list
    });
}

// -- add physical form ------------------------------------------------------------
// sets up the form for adding a new physical book
function initializePhysicalForm() {
    setupStarRatings();

    document.getElementById('physical-book-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const newBook = {
            id: Date.now(),
            title: document.getElementById('physical-title').value,
            author: document.getElementById('physical-author').value,
            // we add " pages" to the number so it reads nicely in the book list
            length: document.getElementById('physical-pages').value + ' pages',
            dateFinished: document.getElementById('physical-date').value,
            rating: parseInt(document.getElementById('physical-rating-value').value),
            genre: document.getElementById('physical-genre').value,
            type: 'physical'
        };

        books.push(newBook);
        saveData();
        window.location.href = 'my-books.html';
    });
}

// -- stats page -------------------------------------------------------------------
// an array of month names used to build labels for the charts and navigation
const MONTH_NAMES = ['january','february','march','april','may','june',
                     'july','august','september','october','november','december'];

// we store chart instances here so we can destroy and rebuild them when the data changes
// if we didn't destroy them first, charts would stack on top of each other
let genreChartInstance, formatChartInstance, timelineChartInstance, ratingChartInstance;

// get today's date once so we can reference it throughout the stats logic
const today = new Date();

// track which month the user is viewing in the stats page
let navYear  = today.getFullYear();
let navMonth = today.getMonth(); // 0 = january, 11 = december
let allTimeMode = true; // when true, we show stats for all books ever, not just one month

// sets up the stats page: hooks up the navigation buttons and draws everything
function initializeStatsPage() {
    // when the left arrow is clicked, go back one month
    document.getElementById('prev-month').addEventListener('click', () => {
        if (allTimeMode) {
            // if we were in "all time" mode, switch to the current month first
            allTimeMode = false;
        } else {
            navMonth--;
            // if month goes below 0 (january), wrap around to december of the previous year
            if (navMonth < 0) { navMonth = 11; navYear--; }
        }
        renderStats();
    });

    // when the right arrow is clicked, go forward one month
    document.getElementById('next-month').addEventListener('click', () => {
        if (!allTimeMode) {
            navMonth++;
            // if month goes above 11 (december), wrap around to january of the next year
            if (navMonth > 11) { navMonth = 0; navYear++; }

            // if we've gone past the current month, switch back to "all time"
            if (navYear > today.getFullYear() ||
               (navYear === today.getFullYear() && navMonth > today.getMonth())) {
                allTimeMode = true;
            }
        }
        renderStats();
    });

    renderStats(); // draw the stats right away when the page loads

    // if the user adds a book in another browser tab, re-render stats automatically
    window.addEventListener('storage', () => {
        books = JSON.parse(localStorage.getItem('books')) || [];
        renderStats();
    });
}

// returns a filtered version of the books list based on the current view mode
// if allTimeMode is true, return all books. otherwise return only books from the selected month
function getFilteredBooks() {
    if (allTimeMode) return books;

    return books.filter(b => {
        if (!b.dateFinished) return false;
        const d = new Date(b.dateFinished);
        return d.getFullYear() === navYear && d.getMonth() === navMonth;
    });
}

// the main stats render function -- calculates all the numbers and redraws every section
function renderStats() {
    // always reload fresh from storage in case anything was added recently
    books = JSON.parse(localStorage.getItem('books')) || [];

    // update the heading that shows "all time" or the current month name
    document.getElementById('month-label').textContent =
        allTimeMode ? 'All Time' : `${MONTH_NAMES[navMonth]} ${navYear}`;

    const filtered = getFilteredBooks();

    // set up counters to tally up the stats
    let totalPages = 0;
    let totalMinutes = 0; // we'll convert this to hours at the end
    let totalRating = 0;
    let ratedCount = 0;   // tracks how many books actually have a rating (to calc average)
    let physCount = 0;    // tracks how many physical books (for average page length)

    filtered.forEach(b => {
        // add this book's rating to our running total
        if (b.rating && b.rating > 0) {
            totalRating += b.rating;
            ratedCount++;
        }

        if (b.type === 'physical' && b.length) {
            // pull the number out of a string like "350 pages"
            const p = parseInt((b.length.match(/\d+/) || [])[0] || 0);
            if (!isNaN(p)) {
                totalPages += p;
                physCount++;
            }
        } else if (b.type === 'audio' && b.length) {
            // audio length is stored as "h:mm", so we split and convert to minutes
            if (b.length.includes(':')) {
                const [h, m] = b.length.split(':').map(Number);
                totalMinutes += (h || 0) * 60 + (m || 0);
            } else if (!isNaN(parseFloat(b.length))) {
                // fallback: if it's just a plain number, treat it as hours
                totalMinutes += parseFloat(b.length) * 60;
            }
        }
    });

    // do the final calculations
    const avgRating  = ratedCount > 0 ? (totalRating / ratedCount).toFixed(2) : '—';
    const totalHours = (totalMinutes / 60).toFixed(1);
    const avgLength  = physCount > 0 ? Math.round(totalPages / physCount) + ' pages' : '—';

    // put the calculated numbers into the html elements on the page
    document.getElementById('total-books').textContent = filtered.length;
    document.getElementById('total-pages').textContent = totalPages.toLocaleString(); // adds commas e.g. 1,234
    document.getElementById('total-hours').textContent = totalHours;
    document.getElementById('avg-rating').textContent  = avgRating;
    document.getElementById('avg-length').textContent  = avgLength;
    document.getElementById('avg-time').textContent    = '—'; // needs start-date tracking to calculate

    // -- top rated books ----------------------------------------------------------
    const topEl = document.getElementById('top-rated-books');
    topEl.innerHTML = '';

    // get up to 5 books with the highest rating
    const top = [...filtered]
        .filter(b => b.rating > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);

    if (top.length === 0) {
        topEl.innerHTML = '<p class="no-books-msg">No rated books yet.</p>';
    } else {
        // each book gets a different color class for its spine
        const colorClasses = ['book-1','book-2','book-3','book-4','book-5'];

        top.forEach((book, i) => {
            // trim long titles so they fit on the book spine
            const shortTitle = book.title.length > 20 ? book.title.substring(0, 18) + '…' : book.title;

            const div = document.createElement('div');
            div.className = 'book-container';
            div.innerHTML = `
                <div class="book-shape ${colorClasses[i]}">${shortTitle}</div>
                <div class="book-rating-badge">${book.rating}.0 ⭐</div>
            `;
            topEl.appendChild(div);
        });
    }

    // redraw all four charts with the fresh data
    renderGenreChart(filtered);
    renderFormatChart(filtered);
    renderTimelineChart();  // timeline always shows all 12 months regardless of filter
    renderRatingChart(filtered);
}

// draws a horizontal bar chart showing how many books belong to each genre
function renderGenreChart(filtered) {
    // count how many books have each genre
    const counts = {};
    filtered.forEach(b => {
        const g = (b.genre && b.genre.trim()) ? b.genre.trim() : 'Unspecified';
        counts[g] = (counts[g] || 0) + 1;
    });

    // sort genres by count (most popular first) and take the top 7
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const labels = sorted.map(e => e[0]);
    const data   = sorted.map(e => e[1]);
    const COLORS = ['#748ffc','#3b5bdb','#4ade80','#f59e0b','#ec4899','#06b6d4','#a78bfa'];

    // destroy the old chart first so we can draw a fresh one
    if (genreChartInstance) genreChartInstance.destroy();

    const ctx = document.getElementById('genre-chart').getContext('2d');
    genreChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: COLORS.slice(0, data.length),
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: 'y', // makes the bars go horizontally instead of vertically
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { stepSize: 1, precision: 0 } },
                y: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
        }
    });
}

// draws a doughnut chart showing the split between physical and audio books
function renderFormatChart(filtered) {
    const physical = filtered.filter(b => b.type === 'physical').length;
    const audio    = filtered.filter(b => b.type === 'audio').length;
    const total    = physical + audio;

    // helper to calculate a percentage, avoids dividing by zero
    const pct = n => total > 0 ? Math.round(n / total * 100) : 0;

    if (formatChartInstance) formatChartInstance.destroy();

    const ctx = document.getElementById('format-chart').getContext('2d');
    formatChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [`📖 Physical (${pct(physical)}%)`, `🎧 Audio (${pct(audio)}%)`],
            datasets: [{
                // we use 0.001 instead of 0 so the chart doesn't break when a segment is empty
                data: [physical || 0.001, audio || 0.001],
                backgroundColor: ['#3b5bdb','#f59e0b'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            cutout: '60%', // controls the size of the hole in the middle
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 8 } }
            }
        }
    });
}

// draws a line chart showing how many books were finished each month for the last 12 months
// this chart always uses all books (not the month filter) so the full trend is always visible
function renderTimelineChart() {
    // build an array of the last 12 months, going from oldest to newest
    const months = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
            label: MONTH_NAMES[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear(),
            year: d.getFullYear(),
            month: d.getMonth()
        });
    }

    // for each month, count how many books were finished during it
    const counts = months.map(m =>
        books.filter(b => {
            if (!b.dateFinished) return false;
            const d = new Date(b.dateFinished);
            return d.getFullYear() === m.year && d.getMonth() === m.month;
        }).length
    );

    if (timelineChartInstance) timelineChartInstance.destroy();

    const ctx = document.getElementById('timeline-chart').getContext('2d');
    timelineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(m => m.label),
            datasets: [{
                label: 'books finished',
                data: counts,
                borderColor: '#3b5bdb',
                backgroundColor: 'rgba(116,143,252,0.15)', // light fill under the line
                pointBackgroundColor: '#3b5bdb',
                pointRadius: 4,
                tension: 0.35, // makes the line slightly curved instead of jagged
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45 } },
                y: { grid: { color: '#f1f5f9' }, ticks: { stepSize: 1, precision: 0 } }
            }
        }
    });
}

// draws a bar chart showing how many books received each star rating (1 through 5)
function renderRatingChart(filtered) {
    // dist is an array of 5 zeroes -- index 0 = 1-star books, index 4 = 5-star books
    const dist = [0, 0, 0, 0, 0];
    filtered.forEach(b => {
        if (b.rating >= 1 && b.rating <= 5) {
            dist[b.rating - 1]++; // subtract 1 because arrays start at index 0
        }
    });

    if (ratingChartInstance) ratingChartInstance.destroy();

    const ctx = document.getElementById('rating-chart').getContext('2d');
    ratingChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['⭐','⭐⭐','⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐'],
            datasets: [{
                data: dist,
                // colors go from red (low rating) to blue (high rating)
                backgroundColor: ['#f87171','#fb923c','#fbbf24','#4ade80','#3b5bdb'],
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: '#f1f5f9' }, ticks: { stepSize: 1, precision: 0 } }
            }
        }
    });
}