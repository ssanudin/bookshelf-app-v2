const books = {};
const LOCAL_KEY = "MYSHELVES_BOOKS";
const LOADBOOKS_EVENT = "books-load";
const SAVEDBOOK_EVENT = "books-saved";
const ADDEDBOOK_EVENT = "books-added";

document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener(LOADBOOKS_EVENT, function () {
    for (const bookId in books) {
      if (!isBookOnShelf(bookId)) {
        if (books[bookId].isComplete) {
          addFinishedShelf(bookId);
        } else {
          addUnfinishedShelf(bookId);
        }
      }
    }
  });

  if (isStorageExist()) {
    loadLocal();
  } else {
    const alertStorageMsg = `Browser Anda tidak mendukung local storage!<br>Buku yang Anda tambahkan tidak akan tersimpan.`;
    toastMessage(alertStorageMsg, "warning");
  }

  document.addEventListener(ADDEDBOOK_EVENT, function () {
    bookAdded();
  });

  const formAdd = document.getElementById("form-add");
  formAdd.addEventListener("submit", function (e) {
    e.preventDefault();
    addBook();
  });

  const formFilter = document.getElementById("form-filter");
  formFilter.addEventListener("submit", function (e) {
    e.preventDefault();
    filterBook();
  });
});

/**
 * Generates a unique identifier based on the current timestamp.
 * @returns {number} A unique identifier.
 */
function generateId() {
  return +new Date();
}

/**
 * Adds a new book to the collection.
 * Retrieves book details from the form and generates a unique ID for the book.
 * If any required fields are empty, displays an error message.
 */
function addBook() {
  const bookName = document.getElementById("book-name").value;
  const bookAuthor = document.getElementById("book-author").value;
  const bookYear = document.getElementById("book-year").value;
  const bookDesc = document.getElementById("book-desc").value;
  const bookImg = document.getElementById("book-img").value;

  if (!bookName) {
    toastMessage("Nama buku harus diisi", "danger");
    return;
  }
  if (!bookAuthor) {
    toastMessage("Penulis buku harus diisi", "danger");
    return;
  }
  if (!bookYear) {
    toastMessage("Tahun diterbitkan harus diisi", "danger");
    return;
  } else if (Number(bookYear) < 1900) {
    toastMessage(
      `Yakin buku ini diterbitkan di tahun <b>${bookYear}</b>`,
      "danger"
    );
    return;
  }

  const currId = generateId();
  books[currId] = {
    id: currId,
    title: bookName,
    author: bookAuthor,
    year: Number(bookYear),
    desc: bookDesc,
    img: bookImg,
    isComplete: false,
  };

  addUnfinishedShelf(currId);

  saveLocal();

  document.dispatchEvent(new Event(ADDEDBOOK_EVENT));
}

/**
 * Adds a book to the unfinished shelf.
 * @param {string} bookId - The ID of the book to be added.
 */
function addUnfinishedShelf(bookId) {
  if (books[bookId]) {
    const bookElmt = createBookElmt(books[bookId]);
    document.getElementById("unfinished").append(bookElmt);
  }
}

/**
 * Adds a book to the finished shelf.
 * @param {string} bookId - The ID of the book to be added.
 */
function addFinishedShelf(bookId) {
  if (books[bookId]) {
    const bookElmt = createBookElmt(books[bookId]);
    document.getElementById("finished").append(bookElmt);
  }
}

/**
 * Creates a DOM element for a book.
 * @param {Object} bookInfo - The information of the book to be displayed.
 * @returns {HTMLElement} The created book element.
 */
function createBookElmt(bookInfo) {
  const bookName = document.createElement("h3");
  bookName.classList.add("book-info_name");
  bookName.innerText = bookInfo.title;

  const bookAuthor = document.createElement("h4");
  bookAuthor.classList.add("book-info_author");
  bookAuthor.innerText = bookInfo.author;

  const bookYear = document.createElement("h4");
  bookYear.classList.add("book-info_year");
  bookYear.innerText = bookInfo.year;

  const bookInfoMainContainer = document.createElement("div");
  bookInfoMainContainer.classList.add("book-info_main");
  bookInfoMainContainer.append(bookName, bookAuthor, bookYear);

  const urlImg = bookInfo.img ? bookInfo.img : "images/default-cover.svg";
  const bookImg = document.createElement("img");
  bookImg.setAttribute("src", urlImg);
  bookImg.setAttribute("alt", "Book Cover Image");

  const bookInfoImgContainer = document.createElement("div");
  bookInfoImgContainer.classList.add("book-info_img");
  bookInfoImgContainer.append(bookImg);

  const bookInfoFirstContainer = document.createElement("div");
  bookInfoFirstContainer.classList.add("book-info_first");
  bookInfoFirstContainer.append(bookInfoImgContainer, bookInfoMainContainer);

  const bookDesc = document.createElement("p");
  bookDesc.innerText = bookInfo.desc;

  const bookInfoSecondContainer = document.createElement("div");
  bookInfoSecondContainer.classList.add("book-info_second", "book-info_desc");
  bookInfoSecondContainer.append(bookDesc);

  const bookInfoContainer = document.createElement("div");
  bookInfoContainer.classList.add("book-info");
  bookInfoContainer.append(bookInfoFirstContainer, bookInfoSecondContainer);

  const deleteButton = document.createElement("button");
  deleteButton.setAttribute("type", "button");
  deleteButton.setAttribute("title", "Hapus Buku");
  deleteButton.classList.add("btn-icon", "btn-trash");
  deleteButton.addEventListener("click", function () {
    deleteBook(bookInfo.id);
  });

  const finishButton = document.createElement("button");
  finishButton.setAttribute("type", "button");

  if (bookInfo.isComplete) {
    finishButton.setAttribute("title", 'Pindah ke "Belum selesai dibaca"');
    finishButton.classList.add("btn-icon", "btn-unfinished");
    finishButton.addEventListener("click", function () {
      moveBook(bookInfo.id);
    });
  } else {
    finishButton.setAttribute("title", 'Pindah ke "Selesai dibaca"');
    finishButton.classList.add("btn-icon", "btn-finished");
    finishButton.addEventListener("click", function () {
      moveBook(bookInfo.id);
    });
  }

  const bookAction = document.createElement("div");
  bookAction.classList.add("action");
  bookAction.append(deleteButton, finishButton);

  const bookContainer = document.createElement("div");
  bookContainer.setAttribute("id", `book_${bookInfo.id}`);
  bookContainer.classList.add("book");
  bookContainer.append(bookInfoContainer, bookAction);

  return bookContainer;
}

/**
 * Moves a book between the unfinished and finished shelves.
 * Toggles the completion status of the book.
 * @param {string} bookId - The ID of the book to be moved.
 */
function moveBook(bookId) {
  const bookOnShelf = isBookOnShelf(bookId);

  if (bookOnShelf && books[bookId]) {
    books[bookId].isComplete = !books[bookId].isComplete;
    saveLocal();

    const btnMoveTo = bookOnShelf.children[1].children[1];
    const moveTo = btnMoveTo.classList.contains("btn-unfinished")
      ? "unfinished"
      : "finished";

    if (moveTo === "unfinished") {
      btnMoveTo.setAttribute("title", 'Pindah ke "Selesai dibaca"');
      btnMoveTo.classList.remove("btn-unfinished");
      btnMoveTo.classList.add("btn-finished");
    } else {
      btnMoveTo.setAttribute("title", 'Pindah ke "Belum selesai dibaca"');
      btnMoveTo.classList.remove("btn-finished");
      btnMoveTo.classList.add("btn-unfinished");
    }

    document.getElementById(moveTo).append(bookOnShelf);

    const shelfType =
      moveTo === "finished" ? "Selesai dibaca" : "Belum selesai dibaca";
    toastMessage(
      `Buku berhasil dipindahkan ke <b>"${shelfType}"</b>`,
      "success"
    );
  } else {
    toastMessage("Buku tidak berhasil dipindahkan", "danger");
  }
}

/**
 * Deletes a book from the collection.
 * Confirms with the user before deletion.
 * @param {string} bookId - The ID of the book to be deleted.
 */
function deleteBook(bookId) {
  if (confirm("Anda yakin ingin menghapus buku ini?")) {
    const bookOnShelf = isBookOnShelf(bookId);

    if (bookOnShelf) {
      bookOnShelf.remove();

      if (books[bookId]) {
        delete books[bookId];
        saveLocal();
      }

      toastMessage("Buku berhasil dihapus", "success");
    } else {
      toastMessage("Buku tidak berhasil dihapus", "danger");
    }
  }
}

/**
 * Filters the displayed books based on the search input.
 * Hides books that do not match the search criteria.
 */
function filterBook() {
  const bookFilter = document.getElementById("book-filter");
  const search = bookFilter.value.toLowerCase();

  const booksElmt = document.querySelectorAll(".book");
  for (const bookElmt of booksElmt) {
    if (search) {
      const bookInfoMain = bookElmt.children[0].children[0].children[1];
      const onShelfBookName =
        bookInfoMain.children[0].textContent.toLowerCase();
      const onShelfBookAuthor =
        bookInfoMain.children[1].textContent.toLowerCase();
      const onShelfBookYear =
        bookInfoMain.children[2].textContent.toLowerCase();

      if (
        onShelfBookName.search(search) >= 0 ||
        onShelfBookAuthor.search(search) >= 0 ||
        onShelfBookYear.search(search) >= 0
      ) {
        bookElmt.classList.remove("hide");
      } else {
        bookElmt.classList.add("hide");
      }

      toastMessage("Rak Buku telah difilter", "success");
    } else {
      bookElmt.classList.remove("hide");
    }
  }

  bookFilter.value = "";
}

/**
 * Resets the book input fields after a book has been added.
 * Displays a success message.
 */
function bookAdded() {
  document.getElementById("book-name").value = "";
  document.getElementById("book-author").value = "";
  document.getElementById("book-year").value = "";
  document.getElementById("book-desc").value = "";
  document.getElementById("book-img").value = "";

  toastMessage("Buku berhasil ditambahkan", "success");
}

/**
 * Checks if a book is currently on the shelf.
 * @param {string} bookId - The ID of the book to check.
 * @returns {HTMLElement|boolean} The book element if found, otherwise false.
 */
function isBookOnShelf(bookId) {
  const isBookOnShelf = document.getElementById(`book_${bookId}`);

  return !isBookOnShelf ? false : isBookOnShelf;
}

/**
 * Checks if the browser supports local storage.
 * @returns {boolean} True if local storage is supported, otherwise false.
 */
function isStorageExist() {
  if (typeof Storage === "undefined") {
    return false;
  }
  return true;
}

/**
 * Saves the current books collection to local storage.
 * Triggers an event after saving.
 */
function saveLocal() {
  if (isStorageExist()) {
    const booksData = JSON.stringify(books);
    localStorage.setItem(LOCAL_KEY, booksData);

    document.dispatchEvent(new Event(SAVEDBOOK_EVENT));
  }
}

/**
 * Loads the books collection from local storage.
 * Adds any previously saved books to the current collection.
 */
function loadLocal() {
  const booksLocalData = localStorage.getItem(LOCAL_KEY);
  const booksData = JSON.parse(booksLocalData);

  if (booksData) {
    for (const bookId in booksData) {
      if (!books[bookId]) {
        books[bookId] = booksData[bookId];
      }
    }
  }

  document.dispatchEvent(new Event(LOADBOOKS_EVENT));
}

/**
 * Displays a toast message to the user.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message (e.g., success, danger).
 */
function toastMessage(message, type) {
  const toast = document.getElementById("toast");
  const toastHeader = document.querySelector(".toast-header");
  toastHeader.innerHTML = ucFirst(type) + "!!!";
  toastHeader.classList.add(`toast-${type}`);
  document.querySelector(".toast-body").innerHTML = message;
  toast.classList.remove("hide");

  setTimeout(() => toast.classList.add("hide"), 3000);
}

/**
 * Capitalizes the first letter of a word.
 * @param {string} word - The word to capitalize.
 * @returns {string} The capitalized word.
 */
function ucFirst(word) {
  const [first, ...wordRest] = word.split("");

  return first.toUpperCase() + wordRest.join("").toLowerCase();
}
