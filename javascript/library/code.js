const myLibrary = [];

function Book(id, name, author, numberOfPages, read) {
    this.id = id;
    this.name = name;
    this.author = author;
    this.numberOfPages = numberOfPages;
    this.read = read;
}

function addBookToLibrary(name, author, numberOfPages, read) {
    const newBook = new Book(crypto.randomUUID(), name, author, numberOfPages, read);
    myLibrary.push(newBook);
}

function toggleRead(bookId) {
    const book = myLibrary.find(b => b.id === bookId);
    if (book) {
        book.read = !book.read;
        displayBooks();
        updateStats();
    }
}

function deleteBook(bookId) {
    const index = myLibrary.findIndex(b => b.id === bookId);
    if (index !== -1) {
        myLibrary.splice(index, 1);
        displayBooks();
        updateStats();
    }
}

function updateStats() {
    const total = myLibrary.length;
    const totalRead = myLibrary.filter(b => b.read).length;
    const percentage = total > 0 ? Math.round((totalRead / total) * 100) : 0;

    const statsEl = document.getElementById('stats');
    if (statsEl) {
        statsEl.textContent =
            total === 0
                ? 'No books in the library yet.'
                : `${totalRead} of ${total} books read — ${percentage}%`;
    }
}

function displayBooks() {
    const container = document.getElementById('container');
    container.innerHTML = '';

    for (const book of myLibrary) {
        const card = document.createElement('article');
        card.classList.add('card', book.read ? 'read' : 'not-read');

        const title = document.createElement('p');
        title.className = 'card-title';
        title.textContent = book.name;

        const author = document.createElement('p');
        author.className = 'card-author';
        author.textContent = book.author;

        const pages = document.createElement('p');
        pages.className = 'card-pages';
        pages.textContent = `${book.numberOfPages} pages`;

        const readBtn = document.createElement('button');
        readBtn.className = `btn-read ${book.read ? 'read' : 'not-read'}`;
        readBtn.dataset.id = book.id;
        readBtn.textContent = book.read ? 'Read' : 'Not read';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.dataset.id = book.id;
        deleteBtn.textContent = 'Delete';

        const actions = document.createElement('div');
        actions.className = 'card-actions';
        actions.append(readBtn, deleteBtn);

        card.append(title, author, pages, actions);

        container.appendChild(card);
    }
}

addBookToLibrary('1984', 'George Orwell', 328, true);
addBookToLibrary('To Kill a Mockingbird', 'Harper Lee', 324, true);
addBookToLibrary('The Great Gatsby', 'F. Scott Fitzgerald', 180, true);
addBookToLibrary('Pride and Prejudice', 'Jane Austen', 279, false);
addBookToLibrary('The Catcher in the Rye', 'J.D. Salinger', 277, true);
addBookToLibrary('The Hobbit', 'J.R.R. Tolkien', 310, true);
addBookToLibrary('Dune', 'Frank Herbert', 682, false);
addBookToLibrary('Brave New World', 'Aldous Huxley', 312, false);
addBookToLibrary('The Lord of the Rings', 'J.R.R. Tolkien', 1178, true);
addBookToLibrary('Fahrenheit 451', 'Ray Bradbury', 249, true);
addBookToLibrary('The Little Prince', 'Antoine de Saint-Exupéry', 96, true);
addBookToLibrary('Alice in Wonderland', 'Lewis Carroll', 352, true);
addBookToLibrary('The Chronicles of Narnia', 'C.S. Lewis', 768, false);
addBookToLibrary('Jane Eyre', 'Charlotte Brontë', 507, true);
addBookToLibrary('Wuthering Heights', 'Emily Brontë', 323, false);
addBookToLibrary('The Picture of Dorian Gray', 'Oscar Wilde', 254, true);
addBookToLibrary('Moby Dick', 'Herman Melville', 635, false);
addBookToLibrary('Great Expectations', 'Charles Dickens', 505, true);
addBookToLibrary('The Odyssey', 'Homer', 541, false);
addBookToLibrary('Crime and Punishment', 'Fyodor Dostoevsky', 671, true);

displayBooks();
updateStats();

const modal = document.getElementById('book-modal');
const newBookBtn = document.getElementById('new-book');
const cancelBtn = document.getElementById('cancel-btn');
const bookForm = document.getElementById('book-form');

newBookBtn.addEventListener('click', () => modal.showModal());

cancelBtn.addEventListener('click', () => {
    modal.close();
    bookForm.reset();
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.close();
        bookForm.reset();
    }
});

bookForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const pages = parseInt(document.getElementById('pages').value);
    const read = document.getElementById('read').checked;

    addBookToLibrary(title, author, pages, read);
    displayBooks();
    updateStats();
    modal.close();
    bookForm.reset();
});

document.getElementById('container').addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    if (!id) return;
    if (e.target.classList.contains('btn-read')) toggleRead(id);
    if (e.target.classList.contains('btn-delete')) deleteBook(id);
});