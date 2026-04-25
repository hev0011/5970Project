// shared data variables
// we check the browser's local storage for existing data, or start with empty arrays if there is none
let books = JSON.parse(localStorage.getItem('books')) || [];
let goals = JSON.parse(localStorage.getItem('goals')) || [];
let toBeRead = JSON.parse(localStorage.getItem('toBeRead')) || [];

// helper function to save all our arrays back into the browser's local storage
function saveData() {
    localStorage.setItem('books', JSON.stringify(books));
    localStorage.setItem('goals', JSON.stringify(goals));
    localStorage.setItem('toBeRead', JSON.stringify(toBeRead));
}

// router setup
// this listens for the web page to finish loading before running any js
document.addEventListener('DOMContentLoaded', function () {
    // grab the name of the current html file from the url (like 'index.html' or 'stats.html')
    const path = window.location.pathname.split('/').pop();

    // a switch statement to run different setup functions depending on which page we are currently on
    switch (path) {
        case 'index.html':
        case '':
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
        case 'sign-up-page.html':
            initializeSignUpPage();
            break;
        case 'to-be-read.html':
            initializeTBRPage();
            break;
    }
});

// shared helpers used across multiple pages
// closes a native html dialog box by its id
function closeDialog(dialogId) {
    document.getElementById(dialogId)?.close();
}

// formats a standard date string into a nice readable format (like 'oct 24, 2026')
function formatDate(dateString) {
    if (!dateString) return 'unknown date';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    // adding a midday time fixes a bug where timezones shift the date back by one day
    const date = new Date(dateString + 'T12:00:00'); 
    return date.toLocaleDateString(undefined, options);
}

// generates a visual string of stars based on a number rating
function generateStars(rating) {
    let stars = '';
    // loop 5 times, adding a solid star if it is under the rating, or a hollow star if it is over
    for (let i = 0; i < 5; i++) {
        stars += i < rating ? '★' : '☆';
    }
    return stars;
}

// makes the star rating widgets clickable on the add and edit forms
function setupStarRatings() {
    // find all the star rating containers on the page
    const starContainers = document.querySelectorAll('.star-rating');

    starContainers.forEach(container => {
        const stars = container.querySelectorAll('.star');
        // find the hidden input field right next to the stars so we can save the actual number value
        const hiddenInput = container.parentElement.querySelector('input[type="hidden"]');

        if (!hiddenInput) return;

        // add a click event to every single star
        stars.forEach(star => {
            star.addEventListener('click', function () {
                // get the value of the star that was clicked (1 to 5)
                const value = parseInt(this.getAttribute('data-value'));
                // save that value into the hidden input so the form can read it later
                hiddenInput.value = value;

                // visually update all the stars in this container to reflect the new rating
                stars.forEach((s, index) => {
                    if (index + 1 <= Math.floor(value)) {
                        s.textContent = '★'; // solid star for rated
                    } else if (index < value) {
                        s.textContent = '⯪'; // half star (if we ever use decimals)
                    } else {
                        s.textContent = '☆'; // empty star for unrated
                    }
                });
            });
        });
    });
}

// home page & sign up page logic
function initializeHomePage() { 
    // nothing needed here yet since the home page just uses html links
}

function initializeSignUpPage() {
    // listen for the profile form being submitted
    document.getElementById("signupForm")?.addEventListener("submit", function(event) {
        // stop the page from refreshing when we hit submit
        event.preventDefault();

        // grab the values the user typed in
        let name = document.getElementById("name").value;
        let age = document.getElementById("age").value;
        let aboutMe = document.getElementById("aboutMe").value;

        // bundle them into an object and save it to local storage
        let userProfile = { name, age, aboutMe };
        localStorage.setItem("userProfile", JSON.stringify(userProfile));

        // show a nice bootstrap success banner on the screen
        const messageDiv = document.getElementById("message");
        messageDiv.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show mt-3" role="alert">
                profile created successfully!
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    });
}

// goals page logic
function initializeGoalsPage() {
    // draw the goals onto the screen right away
    renderGoals();

    // listen for the new/edit goal form being submitted
    document.getElementById('goal-form')?.addEventListener('submit', function (e) {
        // stop the page from refreshing
        e.preventDefault();

        // grab all the values from the form inputs
        const goalId = parseInt(document.getElementById('goal-id').value);
        const goalName = document.getElementById('goal-name').value;
        const goalTarget = parseInt(document.getElementById('goal-target').value);
        const goalCurrent = parseInt(document.getElementById('goal-current').value);

        // if there is an id, it means we are editing an existing goal
        if (goalId) {
            const goalIndex = goals.findIndex(g => g.id == goalId);
            if (goalIndex !== -1) {
                // update the existing goal with the new info
                goals[goalIndex] = { ...goals[goalIndex], name: goalName, target: goalTarget, current: goalCurrent };
            }
        } else {
            // otherwise, there is no id, so we create a brand new goal object and push it to the array
            goals.push({ id: Date.now(), name: goalName, target: goalTarget, current: goalCurrent, createdAt: new Date().toISOString() });
        }

        // save to local storage, close the popup, clear the form, and redraw the list
        saveData();
        closeDialog('dialog-new-goal');
        resetGoalForm();
        renderGoals();
    });
}

// removes a goal from the array after asking the user if they are sure
function deleteGoal(goalId) {
    if (confirm('are you sure you want to delete this goal?')) {
        // filter out the goal with the matching id
        goals = goals.filter(g => g.id !== goalId);
        saveData();
        renderGoals();
    }
}

// paints the goals onto the screen in either the active or completed sections
function renderGoals() {
    const activeList = document.getElementById('active-list');
    const completedList = document.getElementById('completed-list');
    if (!activeList || !completedList) return;

    // clear the lists before we redraw them
    activeList.innerHTML = '';
    completedList.innerHTML = '';

    // loop through every goal in our array
    goals.forEach(goal => {
        // calculate how far along the goal is as a percentage
        const progress = (goal.current / goal.target) * 100;
        const isCompleted = progress >= 100;

        // create a new html element for this goal card
        const goalElement = document.createElement('div');
        goalElement.className = 'card mb-3 shadow-sm border-0';
        
        // build the inside of the card using bootstrap classes for the progress bar
        goalElement.innerHTML = `
            <div class="card-body">
                <h5 class="card-title fw-bold">${goal.name}</h5>
                <p class="card-text text-muted mb-2">${goal.current} / ${goal.target} completed</p>
                <div class="progress mb-3" style="height: 10px;">
                    <div class="progress-bar ${isCompleted ? 'bg-success' : 'bg-primary'}" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted fw-bold">${Math.round(progress)}%</small>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editGoal(${goal.id})">edit</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteGoal(${goal.id})">delete</button>
                    </div>
                </div>
            </div>
        `;

        // append the card to the correct list based on if it is finished or not
        if (isCompleted) {
            completedList.appendChild(goalElement);
        } else {
            activeList.appendChild(goalElement);
        }
    });
}

// populates the goal form with existing data when the user clicks edit
function editGoal(goalId) {
    // find the right goal in our array
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    // fill the form inputs with the goal's current details
    document.getElementById('goal-name').value = goal.name;
    document.getElementById('goal-target').value = goal.target;
    document.getElementById('goal-current').value = goal.current;
    // this hidden id tells the submit function that we are editing, not making a new one
    document.getElementById('goal-id').value = goal.id;
    
    // change the title of the dialog box to say edit instead of start
    document.getElementById('goal-dialog-title').textContent = 'edit goal';
    // open the dialog box natively
    document.getElementById('dialog-new-goal').showModal();
}

// clears out the goal form so it is fresh for the next time we add one
function resetGoalForm() {
    document.getElementById('goal-form')?.reset();
    document.getElementById('goal-id').value = '';
    document.getElementById('goal-dialog-title').textContent = 'start a new goal';
}

// my books page logic
function initializeBooksPage() {
    // make sure the star rating widget works on the edit popup
    setupStarRatings();
    // draw all the books onto the screen
    renderBooks(); 

    // listen for bootstrap tab switches so we can refresh the list if needed
    document.addEventListener('shown.bs.tab', function (event) {
        if (event.target.id === 'favorites-tab') {
            renderFavoriteBooks();
        } else if (event.target.id === 'completed-tab') {
            renderCompletedBooks();
        }
    });

    // listen for the edit book form being submitted
    document.getElementById('edit-book-form')?.addEventListener('submit', function (e) {
        // stop page refresh
        e.preventDefault();
        
        // grab the id of the book we are editing
        const bookId = parseInt(document.getElementById('edit-book-id').value);
        
        // build a new book object out of the edited form fields
        const updatedBook = {
            id: bookId,
            title: document.getElementById('edit-title').value,
            author: document.getElementById('edit-author').value,
            length: document.getElementById('edit-length').value,
            dateFinished: document.getElementById('edit-date').value,
            rating: parseInt(document.getElementById('edit-rating-value').value),
            genre: document.getElementById('edit-genre').value,
            // we keep the type (audio or physical) the same as it was before
            type: books.find(b => b.id === bookId)?.type || 'physical'
        };

        // find exactly where this book lives in our main array
        const bookIndex = books.findIndex(b => b.id === bookId);
        if (bookIndex !== -1) {
            // overwrite the old book with the new updated book
            books[bookIndex] = updatedBook;
            saveData();
            closeDialog('dialog-edit-book');
            renderBooks();
        }
    });
}

// helper to draw both tabs at the same time
function renderBooks() {
    renderCompletedBooks();
    renderFavoriteBooks();
}

// paints all completed books onto the screen
function renderCompletedBooks() {
    const container = document.getElementById('completed-books-content');
    if (!container) return;
    
    // clear the container out first
    container.innerHTML = '';

    // sort the books in chronological order (oldest dates first)
    const sortedBooks = [...books].sort((a, b) => new Date(a.dateFinished) - new Date(b.dateFinished));

    // loop over every sorted book and build its html card
    sortedBooks.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book-item card mb-3 shadow-sm border-0'; 
        
        // fill the inside of the card with the book's specific data
        bookElement.innerHTML = `
            <div class="card-body">
                <h5 class="card-title fw-bold">${book.title}</h5>
                <p class="card-text text-muted small mb-2">
                    <strong>by:</strong> ${book.author}<br>
                    <strong>type:</strong> ${book.type === 'audio' ? '🎧 audio' : '📖 physical'}<br>
                    <strong>length:</strong> ${book.length}<br>
                    <strong>date finished:</strong> ${formatDate(book.dateFinished)}<br>
                    <strong>genre:</strong> ${book.genre || 'not specified'}<br>
                </p>
                <div class="mb-3 fw-bold">rating: <span class="text-warning fs-5">${generateStars(book.rating)}</span></div>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-primary btn-sm flex-grow-1 m-0 fw-bold" onclick="openEditBook(${book.id})">edit</button>
                    <button class="btn btn-outline-danger btn-sm flex-grow-1 m-0 fw-bold" onclick="deleteBook(${book.id})">delete</button>
                </div>
            </div>
        `;
        // add the completed card to the webpage
        container.appendChild(bookElement);
    });
}

// paints only the 5-star books onto the favorites tab
function renderFavoriteBooks() {
    const container = document.getElementById('favorite-books-content');
    if (!container) return;
    
    container.innerHTML = '';

    // filter the main books array to only keep books that have exactly 5 as their rating
    const favoriteBooks = books.filter(book => parseInt(book.rating) === 5);

    // if there are no 5-star books, show a friendly empty message
    if (favoriteBooks.length === 0) {
        container.innerHTML = '<div class="alert alert-info text-center mt-3">no 5-star rated books yet.</div>';
        return;
    }

    // sort the favorite books chronologically
    const sortedFavorites = [...favoriteBooks].sort((a, b) => new Date(a.dateFinished) - new Date(b.dateFinished));

    // loop over them and build the html cards just like we did for the completed list
    sortedFavorites.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book-item card mb-3 shadow-sm border-0'; 
        bookElement.innerHTML = `
            <div class="card-body">
                <h5 class="card-title fw-bold">${book.title}</h5>
                <p class="card-text text-muted small mb-2">
                    <strong>by:</strong> ${book.author}<br>
                    <strong>type:</strong> ${book.type === 'audio' ? '🎧 audio' : '📖 physical'}<br>
                    <strong>length:</strong> ${book.length}<br>
                    <strong>date finished:</strong> ${formatDate(book.dateFinished)}<br>
                    <strong>genre:</strong> ${book.genre || 'not specified'}<br>
                </p>
                <div class="mb-3 fw-bold">rating: <span class="text-warning fs-5">${generateStars(book.rating)}</span></div>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-primary btn-sm flex-grow-1 m-0 fw-bold" onclick="openEditBook(${book.id})">edit</button>
                </div>
            </div>
        `;
        container.appendChild(bookElement);
    });
}

// removes a book entirely from the tracker
function deleteBook(bookId) {
    if(confirm("are you sure you want to delete this book?")) {
        // filter out the deleted book by its id
        books = books.filter(b => b.id !== bookId);
        saveData();
        renderBooks();
    }
}

// populates and opens the edit book popup dialog
function openEditBook(bookId) {
    // search the array for the book we want to edit
    const book = books.find(b => b.id === bookId);
    if(!book) return;

    // plug the book's details into the input fields
    document.getElementById('edit-book-id').value = book.id;
    document.getElementById('edit-title').value = book.title;
    document.getElementById('edit-author').value = book.author;
    document.getElementById('edit-length').value = book.length;
    document.getElementById('edit-date').value = book.dateFinished;
    document.getElementById('edit-genre').value = book.genre || '';
    document.getElementById('edit-rating-value').value = book.rating;

    // visually update the star rating widget to match the book's current rating
    const stars = document.querySelectorAll('#edit-book-form .star');
    stars.forEach((star, index) => {
        star.textContent = index < book.rating ? '★' : '☆';
    });

    // open the popup dialog natively
    document.getElementById('dialog-edit-book').showModal();
}

// add physical and audio book logic
function initializePhysicalForm() {
    setupStarRatings();
    
    // listen for the physical book form submission
    document.getElementById('physical-book-form')?.addEventListener('submit', function (e) {
        e.preventDefault();
        
        // build a new physical book object and push it into the main array
        books.push({
            id: Date.now(),
            title: document.getElementById('physical-title').value,
            author: document.getElementById('physical-author').value,
            length: document.getElementById('physical-pages').value + ' pages',
            dateFinished: document.getElementById('physical-date').value,
            rating: parseInt(document.getElementById('physical-rating-value').value),
            genre: document.getElementById('physical-genre').value,
            type: 'physical'
        });
        
        // save the array and redirect the user to the my books page
        saveData();
        window.location.href = 'my-books.html';
    });
}

function initializeAudioForm() {
    setupStarRatings();
    
    // listen for the audio book form submission
    document.getElementById('audio-book-form')?.addEventListener('submit', function (e) {
        e.preventDefault();
        
        // build a new audio book object and push it into the main array
        books.push({
            id: Date.now(),
            title: document.getElementById('audio-title').value,
            author: document.getElementById('audio-author').value,
            length: document.getElementById('audio-length').value,
            dateFinished: document.getElementById('audio-date').value,
            rating: parseInt(document.getElementById('audio-rating-value').value),
            genre: document.getElementById('audio-genre').value,
            type: 'audio'
        });
        
        // save the array and redirect the user to the my books page
        saveData();
        window.location.href = 'my-books.html';
    });
}

// to be read (tbr) page logic
function initializeTBRPage() {
    // draw the existing tbr books onto the screen
    renderTBRBooks();

    // listen for someone adding a new book to their tbr list
    document.getElementById('add-tbr-form')?.addEventListener('submit', function (e) {
        e.preventDefault();
        
        // push a simplified object into the toberead array
        toBeRead.push({
            id: Date.now(),
            title: document.getElementById('add-tbr-title').value,
            author: document.getElementById('add-tbr-author').value,
            dateAdded: new Date().toISOString()
        });
        
        // save, clean up the form, close the popup, and redraw the screen
        saveData(); 
        document.getElementById('add-tbr-form').reset();
        document.getElementById('dialog-add-tbr').close();
        renderTBRBooks(); 
    });

    // listen for someone editing a tbr book
    document.getElementById('edit-tbr-form')?.addEventListener('submit', function (e) {
        e.preventDefault();
        
        // grab the id of the book being edited
        const tbrId = parseInt(document.getElementById('edit-tbr-id').value);
        const tbrIndex = toBeRead.findIndex(b => b.id === tbrId);

        // if we found it, overwrite the title and author
        if (tbrIndex !== -1) {
            toBeRead[tbrIndex].title = document.getElementById('edit-tbr-title').value;
            toBeRead[tbrIndex].author = document.getElementById('edit-tbr-author').value;
            
            saveData();
            document.getElementById('dialog-edit-tbr').close();
            renderTBRBooks(); 
        }
    });
}

// paints the to be read cards onto the webpage
function renderTBRBooks() {
    const container = document.getElementById('tbr-list-container');
    if (!container) return;
    
    // clear the container first
    container.innerHTML = '';

    // show an empty state message if there are no books on the list
    if (toBeRead.length === 0) {
        container.innerHTML = '<div class="alert alert-info text-center mt-3">your tbr list is empty. add some books!</div>';
        return;
    }

    // sort the tbr list so newest additions are at the top
    const sortedTBR = [...toBeRead].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

    // build the html cards for the tbr list, using the same style as my books
    sortedTBR.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'card mb-3 shadow-sm border-0'; 
        bookElement.innerHTML = `
            <div class="card-body">
                <h5 class="card-title fw-bold">${book.title}</h5>
                <p class="card-text text-muted mb-3">
                    <strong>by:</strong> ${book.author}
                </p>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-primary btn-sm flex-grow-1 m-0 fw-bold" onclick="openEditTBR(${book.id})">edit</button>
                    <button class="btn btn-outline-danger btn-sm flex-grow-1 m-0 fw-bold" onclick="deleteTBR(${book.id})">delete</button>
                </div>
            </div>
        `;
        container.appendChild(bookElement);
    });
}

// removes a book from the tbr array
function deleteTBR(tbrId) {
    if (confirm("are you sure you want to remove this from your tbr list?")) {
        // filter it out based on the id that was passed in
        toBeRead = toBeRead.filter(b => b.id !== tbrId);
        saveData();
        renderTBRBooks();
    }
}

// populates the edit form for a tbr book and opens the dialog
function openEditTBR(tbrId) {
    const book = toBeRead.find(b => b.id === tbrId);
    if (!book) return;

    // plug the book's data into the inputs
    document.getElementById('edit-tbr-id').value = book.id;
    document.getElementById('edit-tbr-title').value = book.title;
    document.getElementById('edit-tbr-author').value = book.author;
    
    // open the dialog natively
    document.getElementById('dialog-edit-tbr').showModal();
}

// stats page logic
// constants and setup for the charts and the month navigation
const MONTH_NAMES = ['january','february','march','april','may','june','july','august','september','october','november','december'];
let genreChartInstance, formatChartInstance, timelineChartInstance, ratingChartInstance;
const today = new Date();
let navYear = today.getFullYear();
let navMonth = today.getMonth();
let allTimeMode = true;

function initializeStatsPage() {
    // left arrow button goes back one month
    document.getElementById('prev-month')?.addEventListener('click', () => {
        if (allTimeMode) {
            allTimeMode = false; // exit all-time view and start on current month
        } else {
            navMonth--;
            // if we roll past january, go back a year to december
            if (navMonth < 0) { navMonth = 11; navYear--; }
        }
        // redraw all stats based on the new date
        renderStats();
    });

    // right arrow button goes forward one month
    document.getElementById('next-month')?.addEventListener('click', () => {
        if (!allTimeMode) {
            navMonth++;
            // if we roll past december, go forward a year to january
            if (navMonth > 11) { navMonth = 0; navYear++; }
            
            // if we try to go into the future, force it back into 'all time' mode instead
            if (navYear > today.getFullYear() || (navYear === today.getFullYear() && navMonth > today.getMonth())) {
                allTimeMode = true;
            }
        }
        // redraw all stats
        renderStats();
    });

    // draw the stats initially when the page loads
    renderStats();
    
    // listen for changes to local storage in case they added a book in another tab
    window.addEventListener('storage', () => {
        books = JSON.parse(localStorage.getItem('books')) || [];
        renderStats();
    });
}

// helper function that either returns all books, or filters them down to the month we are looking at
function getFilteredBooks() {
    if (allTimeMode) return books;
    
    return books.filter(b => {
        if (!b.dateFinished) return false;
        const d = new Date(b.dateFinished + 'T12:00:00');
        return d.getFullYear() === navYear && d.getMonth() === navMonth;
    });
}

// recalculates the numbers and repaints the stat blocks
function renderStats() {
    // grab fresh books
    books = JSON.parse(localStorage.getItem('books')) || [];
    
    const monthLabel = document.getElementById('month-label');
    if (!monthLabel) return;
    
    // update the text that says either 'all time' or 'october 2026'
    monthLabel.textContent = allTimeMode ? 'all time' : `${MONTH_NAMES[navMonth]} ${navYear}`;
    
    // get the books relevant to the current view
    const filtered = getFilteredBooks();

    // set up variables to keep track of our running totals
    let totalPages = 0, totalMinutes = 0, totalRating = 0, ratedCount = 0, physCount = 0, audCount = 0;

    // loop over every relevant book and add to our totals
    filtered.forEach(b => {
        if (b.rating && b.rating > 0) { totalRating += b.rating; ratedCount++; }
        
        if (b.type === 'physical' && b.length) {
            // grab only the numbers from strings like '350 pages'
            const p = parseInt((b.length.match(/\d+/) || [])[0] || 0);
            if (!isNaN(p)) { totalPages += p; physCount++; }
            
        } else if (b.type === 'audio' && b.length) {
            // handle audio lengths formatted like '12:30' (hours:mins)
            if (b.length.includes(':')) {
                const [h, m] = b.length.split(':').map(Number);
                totalMinutes += (h || 0) * 60 + (m || 0);
            // handle plain decimals like '12.5'
            } else if (!isNaN(parseFloat(b.length))) {
                totalMinutes += parseFloat(b.length) * 60;
            }
            audCount++;
        }
    });

    // inject all calculated totals into the dom
    document.getElementById('total-books').textContent = filtered.length;
    document.getElementById('total-pages').textContent = totalPages.toLocaleString();
    document.getElementById('total-hours').textContent = (totalMinutes / 60).toFixed(1);
    document.getElementById('avg-rating').textContent = ratedCount > 0 ? (totalRating / ratedCount).toFixed(2) : '—';
    document.getElementById('avg-length').textContent = physCount > 0 ? Math.round(totalPages / physCount) + ' pages' : '—';
    document.getElementById('avg-time').textContent = audCount > 0 ? ((totalMinutes / 60) / audCount).toFixed(1) : '-';

    // render the 'highest rated' section
    const topEl = document.getElementById('top-rated-books');
    topEl.innerHTML = '';
    
    // filter to rated books, sort highest to lowest, take the top 5
    const top = [...filtered].filter(b => b.rating > 0).sort((a, b) => b.rating - a.rating).slice(0, 5);

    if (top.length === 0) {
        topEl.innerHTML = '<p class="no-books-msg text-muted">no rated books yet.</p>';
    } else {
        // array of classes that give the book shapes different colors
        const colorClasses = ['book-1','book-2','book-3','book-4','book-5'];
        
        top.forEach((book, i) => {
            // cut the title short if it is too long to fit on the spine
            const shortTitle = book.title.length > 20 ? book.title.substring(0, 18) + '…' : book.title;
            const div = document.createElement('div');
            div.className = 'book-container';
            div.innerHTML = `<div class="book-shape ${colorClasses[i]}">${shortTitle}</div><div class="book-rating-badge shadow-sm">${book.rating}.0 ⭐</div>`;
            topEl.appendChild(div);
        });
    }

    // trigger the function to redraw all of the chart.js graphs
    renderCharts(filtered);
}

// draws the four visual charts using chart.js
function renderCharts(filtered) {
    // exit if the chart.js library failed to load
    if(!window.Chart) return; 
    
    // 1. genre chart
    const counts = {};
    // tally up all the genres
    filtered.forEach(b => { const g = (b.genre && b.genre.trim()) ? b.genre.trim() : 'unspecified'; counts[g] = (counts[g] || 0) + 1; });
    // sort them from highest to lowest and take the top 7
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7);
    
    if (genreChartInstance) genreChartInstance.destroy(); // destroy old chart before drawing new one
    genreChartInstance = new Chart(document.getElementById('genre-chart').getContext('2d'), {
        type: 'bar', data: { labels: sorted.map(e => e[0]), datasets: [{ data: sorted.map(e => e[1]), backgroundColor: ['#748ffc','#3b5bdb','#4ade80','#f59e0b','#ec4899','#06b6d4','#a78bfa'], borderRadius: 6 }] },
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { display: false } } }
    });

    // 2. format chart (doughnut)
    const phys = filtered.filter(b => b.type === 'physical').length, aud = filtered.filter(b => b.type === 'audio').length;
    if (formatChartInstance) formatChartInstance.destroy();
    formatChartInstance = new Chart(document.getElementById('format-chart').getContext('2d'), {
        type: 'doughnut', data: { labels: ['📖 physical', '🎧 audio'], datasets: [{ data: [phys || 0.001, aud || 0.001], backgroundColor: ['#3b5bdb','#f59e0b'], borderWidth: 0 }] },
        options: { responsive: true, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } } }
    });

    // 3. timeline chart (line graph)
    const months = [];
    // generate an array of the last 12 months going backwards from today
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({ label: MONTH_NAMES[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear(), y: d.getFullYear(), m: d.getMonth() });
    }
    // count how many books were finished in each of those specific months
    const timelineData = months.map(m => books.filter(b => { if (!b.dateFinished) return false; const d = new Date(b.dateFinished + 'T12:00:00'); return d.getFullYear() === m.y && d.getMonth() === m.m; }).length);
    
    if (timelineChartInstance) timelineChartInstance.destroy();
    timelineChartInstance = new Chart(document.getElementById('timeline-chart').getContext('2d'), {
        type: 'line', data: { labels: months.map(m => m.label), datasets: [{ data: timelineData, borderColor: '#3b5bdb', backgroundColor: 'rgba(59,91,219,0.1)', fill: true, tension: 0.3 }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { stepSize: 1 } } } }
    });

    // 4. rating distribution chart (bar graph)
    const dist = [0, 0, 0, 0, 0];
    // tally up how many 1 star, 2 star, etc. books there are
    filtered.forEach(b => { if (b.rating >= 1 && b.rating <= 5) dist[b.rating - 1]++; });
    
    if (ratingChartInstance) ratingChartInstance.destroy();
    ratingChartInstance = new Chart(document.getElementById('rating-chart').getContext('2d'), {
        type: 'bar', data: { labels: ['★','★★','★★★','★★★★','★★★★★'], datasets: [{ data: dist, backgroundColor: ['#f87171','#fb923c','#fbbf24','#4ade80','#3b5bdb'], borderRadius: 6 }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { stepSize: 1 } } } }
    });
}