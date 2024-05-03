const nav = document.getElementById("nav");
const notesButton = document.querySelector(".notes");
const archiveButton = document.querySelector(".archive");
const trashButton = document.querySelector(".trash");
window.onload = typeFunction();

function typeFunction() {
  if (localStorage.getItem("type") === "all") {
    document.getElementById("add-note-container").style.display = "block";
    notesButton.style.textDecoration = "underline";
  } else if(localStorage.getItem("type")){
    document.getElementById("add-note-container").style.display = "none";
    if(localStorage.getItem("type") === "archived"){
      archiveButton.style.textDecoration = "underline";
    }
    else{
      trashButton.style.textDecoration = "underline";
    }
  }
  if (localStorage.getItem("type")) {
    displayNotes(localStorage.getItem("type"));
  } else {
    localStorage.setItem("type", "all");
    notesButton.style.textDecoration = "underline";
    displayNotes(localStorage.getItem("type"));
  }
}

function displayNotes(type) {
  //   console.log("In display Notes");
  axios
    .get("/read-notes")
    .then((res) => {
      if (res.data.status !== 200) {
        alert(res.data.message);
        return;
      }
      const notes = res.data.data;

      if (type === "all") {
        document.getElementById("notes-list").insertAdjacentHTML(
          "beforeend",
          notes
            .map((item) => {
              if (item.isDeleted || item.archived) return;
              let color;
              if (item.color === "#000000") {
                color = "white";
              } else {
                color = "black";
              }
              return `<div class="note-container" style="background-color: ${item.color}; color: ${color}">
        <h3> ${item.title}</h3>
        <p> ${item.content} </p>
        <input type="color" id="color" value=${item.color}/>
        <button data-id="${item._id}" class="change-color-btn">Apply color</button>
        <button data-id="${item._id}" class="archive-btn">Archive</button>
        <button data-id="${item._id}" class="delete-btn">Delete</button>
        </div>`;
            })
            .join("")
        );
      } else if (type === "archived") {
        document.getElementById("notes-list").insertAdjacentHTML(
          "beforeend",
          notes
            .map((item) => {
              if (!item.archived || item.isDeleted) return;
              if (item.color === "#000000") {
                color = "white";
              } else {
                color = "black";
              }
              return `<div class="note-container" style="background-color: ${item.color}; color: ${color}">
        <h3> ${item.title}</h3>
        <p> ${item.content} </p>
        <input type="color" value=${item.color}/>
        <button data-id="${item._id}" class="archive-btn">Unarchive</button>
        <button data-id="${item._id}" class="delete-btn">Delete</button>
        </div>`;
            })
            .join("")
        );
      } else if (type === "deleted") {
        document.getElementById("notes-list").insertAdjacentHTML(
          "beforeend",
          notes
            .map((item) => {
              if (!item.isDeleted) return;
              if (item.color === "#000000") {
                color = "white";
              } else {
                color = "black";
              }
              return `<div class="note-container" style="background-color: ${item.color}; color: ${color}">
        <h3> ${item.title}</h3>
        <p> ${item.content} </p>
        <input type="color" value=${item.color}/>
        <button data-id="${item._id}" class="delete-forever-btn">Delete Forever</button>
        <button data-id="${item._id}" class="delete-btn">Restore</button>
        </div>`;
            })
            .join("")
        );
      }
    })
    .catch((err) => {
      console.log(err);
      alert(err.message);
    });
}

document.addEventListener("click", function (event) {
  // Add
  if (event.target.classList.contains("add-btn")) {
    console.log("Add clicked");
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const tags = document.getElementById("tags").value.split(",");
    const color = document.getElementById("color").value;
    const archived = document.getElementById("archived").checked;
    // console.log(title, content, tags, color, archived);

    if (tags.length > 9) {
      alert("Maximum 9 tags are allowed");
      return;
    }

    axios
      .post("/create-note", { title, content, tags, color, archived })
      .then((res) => {
        if (res.data.status !== 201) {
          alert(res.data.message);
          return;
        }
        //   document.getElementById("create_field").value = "";
        //   document.getElementById("title").value = "";
        //   document.getElementById("content").value = "";
        //   document.getElementById("tags").value = "";
        //   document.getElementById("color").value = "#000000";
        //   document.getElementById("archived").checked = false;
        location.reload();
      })
      .catch((err) => {
        console.log(err);
        alert(err.response.data);
      });
  }
  // Delete
  else if (event.target.classList.contains("delete-btn")) {
    // console.log("Delete Clicked");
    const noteId = event.target.getAttribute("data-id");
    // console.log(noteId);
    // console.log(event.target.parentElement);

    axios
      .post("/delete-note", { noteId })
      .then((res) => {
        if (res.data.status !== 200) {
          alert(res.data.message);
          return;
        }
        // console.log(res);
        event.target.parentElement.remove();
        return;
      })
      .catch((err) => {
        console.log(err);
      });
  }
  // Archive
  else if (event.target.classList.contains("archive-btn")) {
    // console.log("Archive Clicked");
    const noteId = event.target.getAttribute("data-id");
    // console.log(noteId);
    // console.log(event.target.parentElement);

    axios
      .post("/archive-note", { noteId })
      .then((res) => {
        if (res.data.status !== 200) {
          alert(res.data.message);
          return;
        }
        // console.log(res);
        event.target.parentElement.remove();
        return;
      })
      .catch((err) => {
        console.log(err);
      });
  }
  // Change background color
  else if (event.target.classList.contains("change-color-btn")) {
    const noteId = event.target.getAttribute("data-id");
    const color = event.target.parentElement.querySelector("#color").value;
    // console.log(noteId);
    // console.log(event.target.parentElement.querySelector("#color").value);

    axios
      .post("/update-color", { noteId, color })
      .then((res) => {
        if (res.data.status !== 200) {
          alert(res.data.message);
          return;
        }
        // console.log(res);
        // location.reload();
        event.target.parentElement.style.backgroundColor = color;
        if (color === "#000000") {
          event.target.parentElement.style.color = "white";
        } else {
          event.target.parentElement.style.color = "black";
        }
        return;
      })
      .catch((err) => {
        console.log(err);
      });
  }
  // Delete forever
  else if (event.target.classList.contains("delete-forever-btn")) {
    // console.log("Delete forever Clicked");
    const noteId = event.target.getAttribute("data-id");
    // console.log(noteId);
    // console.log(event.target.parentElement);

    axios
      .post("/delete-note-forever", { noteId })
      .then((res) => {
        if (res.data.status !== 200) {
          alert(res.data.message);
          return;
        }
        // console.log(res);
        event.target.parentElement.remove();
        return;
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

nav.addEventListener("click", function(event){
  if (event.target.classList.contains("notes")){
    localStorage.setItem("type", "all");
    notesButton.style.textDecoration = "underline";
    archiveButton.style.textDecoration = "none";
    trashButton.style.textDecoration = "none";
    location.reload();
  }
  else if (event.target.classList.contains("archive")){
    localStorage.setItem("type", "archived");
    notesButton.style.textDecoration = "none";
    archiveButton.style.textDecoration = "underline";
    trashButton.style.textDecoration = "none";
    location.reload();
  }
  else if (event.target.classList.contains("trash")){
    localStorage.setItem("type", "deleted");
    notesButton.style.textDecoration = "none";
    archiveButton.style.textDecoration = "none";
    trashButton.style.textDecoration = "underline";
    location.reload();
  }
})

// Searching 

const searchButton = document.getElementById("search-btn");
const clearButton = document.getElementById("clear-btn");

searchButton.addEventListener("click", (event) =>{
  event.preventDefault();
  document.getElementById("notes-list").innerHTML = "";
  const text = document.getElementById("search-text").value;
  // console.log(text);
  if(text.trim() === ""){
    displayNotes(localStorage.getItem("type"));
    return;
  }
  axios
    .get("/read-notes")
    .then((res) => {
      if (res.data.status !== 200) {
        alert(res.data.message);
        return;
      }
      const notes = res.data.data;
      let type = localStorage.getItem("type");

      if (type === "all") {
        document.getElementById("notes-list").insertAdjacentHTML(
          "beforeend",
          notes
            .map((item) => {
              if (item.isDeleted || item.archived) return;
              if(!item.title.toLowerCase().includes(text.toLowerCase()) && !item.content.toLowerCase().includes(text.toLowerCase())) return;
              let color;
              if (item.color === "#000000") {
                color = "white";
              } else {
                color = "black";
              }
              return `<div class="note-container" style="background-color: ${item.color}; color: ${color}">
        <h3> ${item.title}</h3>
        <p> ${item.content} </p>
        <input type="color" id="color" value=${item.color}/>
        <button data-id="${item._id}" class="change-color-btn">Apply color</button>
        <button data-id="${item._id}" class="archive-btn">Archive</button>
        <button data-id="${item._id}" class="delete-btn">Delete</button>
        </div>`;
            })
            .join("")
        );
      } else if (type === "archived") {
        document.getElementById("notes-list").insertAdjacentHTML(
          "beforeend",
          notes
            .map((item) => {
              if (!item.archived || item.isDeleted) return;
              if(!item.title.toLowerCase().includes(text.toLowerCase()) && !item.content.toLowerCase().includes(text.toLowerCase())) return;
              if (item.color === "#000000") {
                color = "white";
              } else {
                color = "black";
              }
              return `<div class="note-container" style="background-color: ${item.color}; color: ${color}">
        <h3> ${item.title}</h3>
        <p> ${item.content} </p>
        <input type="color" value=${item.color}/>
        <button data-id="${item._id}" class="archive-btn">Unarchive</button>
        <button data-id="${item._id}" class="delete-btn">Delete</button>
        </div>`;
            })
            .join("")
        );
      } else if (type === "deleted") {
        document.getElementById("notes-list").insertAdjacentHTML(
          "beforeend",
          notes
            .map((item) => {
              if (!item.isDeleted) return;
              if(!item.title.toLowerCase().includes(text.toLowerCase()) && !item.content.toLowerCase().includes(text.toLowerCase())) return;
              if (item.color === "#000000") {
                color = "white";
              } else {
                color = "black";
              }
              return `<div class="note-container" style="background-color: ${item.color}; color: ${color}">
        <h3> ${item.title}</h3>
        <p> ${item.content} </p>
        <input type="color" value=${item.color}/>
        <button data-id="${item._id}" class="delete-forever-btn">Delete Forever</button>
        <button data-id="${item._id}" class="delete-btn">Restore</button>
        </div>`;
            })
            .join("")
        );
      }
    })
    .catch((err) => {
      console.log(err);
      alert(err.message);
    });
  // document.getElementById("search-text").value = "";
})

clearButton.addEventListener("click", () =>{
  document.getElementById("search-text").value = "";
  searchButton.click();
})