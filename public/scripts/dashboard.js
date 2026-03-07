document.addEventListener("DOMContentLoaded", () => {

});

function dropDown() {
  document.getElementById("myDropdown").classList.toggle("show");
}

function displayEntryBox(entryBoxID) {
  console.log(entryBoxID);
  let shown = document.getElementById(entryBoxID).style.display;
  document.getElementById(entryBoxID).style.display = "hidden";
  // document.getElementById(entryBoxID).style.display = (shown === 'show') ? "hidden" : 'show';
}

window.onclick = function(event) {
  if (!event.target.matches('.dropdownButton')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}