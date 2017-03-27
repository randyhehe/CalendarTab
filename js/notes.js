import storage from './storage.js'
import 'jquery-ui/ui/widgets/sortable';

// Cache DOM
let $notes = $("#main-ui").find("#notes");
let $notesAddBtn = $notes.find("#add-note-btn");
let $notesList = $notes.find("#notes-list");
let $notesEntry = $notesList.find(".notes-item");

// Event
$notesAddBtn.on('click', function() {
  $notesList.animate({scrollTop: 1E10}, 50);
  storage.getStorage().then(function(items) {
    let noteId;
    for (let i = 0;; i++) {
      if (items["notes-item-" + i] === undefined) {
        noteId = "notes-item-" + i;
        storage.setStorage(noteId, "&nbsp;");
        break;
      }
    }
    renderNote(noteId, "&nbsp;", false);
  });
});

$notesList.sortable({
  cancel: ':input,button,.contenteditable,.editing',
    stop: function(event, ui) {
      cleanNotes();
    }
});


function renderNotesFromStorage() {
  storage.getStorage().then(function(items) {
    let sortable = [];
    for (let noteId in items) {
      if (items.hasOwnProperty(noteId) && noteId.indexOf("notes-item") !== -1) {
        sortable.push([noteId.substring(11), items[noteId]]);
      }
    }
    sortable.sort(function(a, b) {
      return a[0] - b[0];
    });
    for (let i = 0; i < sortable.length; i++) {
      renderNote("notes-item-" + sortable[i][0], sortable[i][1], true);
    }
  });
}

function renderNote(noteId, text, isStorage) {
  let newNote =
  "<li id=\"" + noteId + "\" class=\"notes-item\" draggable=\"true\">" +
    "<div class=\"notes-view\">" +
      "<i class=\"fa fa-ellipsis-v fa-fw move-note-icon\" aria-hidden=\"true\"></i>" +
      "<i class=\"fa fa-times fa-fw delete-note-icon\" aria-hidden=\"true\"></i>" +
      "<span contenteditable=\"false\" class=\"notes-title contenteditable\">" + text + "</span>" +
    "</div>" +
  "</li>";
  $notesList.append(newNote);
  let $notesItem = $notesList.find(".notes-item").find(".notes-view");
  if (!isStorage) focusText($notesItem.last());

  $notesItem.find(".delete-note-icon").last().on('click', function() {
    let currId = $(this).parent().parent().attr('id');
    storage.removeStorage(currId);
    $(this).parent().parent().remove();
  });
  $notesItem.last().on('dblclick', function() { focusText($(this)) });
  $notesItem.find('.contenteditable').last().keypress(function(e) {
    if (e.which === 13) {
      if ($(this).html === "") $(this).html("&nbsp;");

      let currId = $(this).parent().parent().attr('id');
      let currElem = $(this);

      storage.setStorage(currId, currElem.html());
      $(this).attr('contenteditable', false);
      $(this).parent().removeClass('editing');
    }
    return e.which !== 13;
  });

  $notesItem.find('.contenteditable').last().on('focusout', function() {
    $(this).attr('contenteditable', false);
    $(this).parent().removeClass('editing');

    let currId = $(this).parent().parent().attr('id');
    let currElem = $(this);
    storage.getStorage().then(function(items) {
      currElem.html(items[currId]);
    });
  });
}

function cleanNotes() {
  let numEntries = $notesList.children().length;

  let notes = {};
  let oldNotes = [];
  for (let i = 0; i < numEntries; i++) {
    let noteId = "notes-item-" + i;
    let $notesEntry = $notesList.find(".notes-item:eq(" + i + ")");
    notes[noteId] = $notesEntry.find(".notes-view").find(".contenteditable").html();
    oldNotes.push($notesEntry.attr('id'));
  }
  for (let i = 0; i < oldNotes.length; i++) storage.removeStorage(oldNotes[i]);

  let i = 0;
  for (let noteId in notes) {
    if (notes.hasOwnProperty(noteId)) {
      storage.setStorage(noteId, notes[noteId]);
      let $notesEntry = $notesList.find(".notes-item:eq(" + i + ")");
      $notesEntry.attr('id', noteId);
      i++;
    }
  }
}

function focusText(elem) {
    elem.find(".contenteditable").attr("contenteditable", true);
    elem.find(".contenteditable").focus();
    elem.addClass('editing');
}

module.exports = renderNotesFromStorage;
