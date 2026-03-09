document.addEventListener("DOMContentLoaded", () => {

});

function dropDown() {
  document.getElementById("myDropdown").classList.toggle("show");
}

function displayEntryBox(entryBoxID) {
  var dropdownItem = document.getElementById(entryBoxID);
  dropdownItem.style.display = (dropdownItem.style.display !== 'none') ? "none" : 'flex';
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