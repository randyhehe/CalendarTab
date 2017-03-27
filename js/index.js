import './background.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js'
import '../ss/index.scss';
import './authorize.js';
import renderSchedule from './schedule.js';
import populateCalendar from './calendar.js';
import renderNotesFromStorage from './notes.js';

// Cache DOM
let $mainUI = $("#main-ui");
let $schedule = $mainUI.find("#schedule");
let $eventsList = $schedule.find("#sched-list");
let $calendar = $mainUI.find(".calendar");
let $notes = $mainUI.find("#notes");

$(document).on("authorized", initWidgets);
$(document).on("fadein", fadeInWidgets);

function initWidgets(event) {
  renderSchedule(true);
  populateCalendar();
  renderNotesFromStorage();
}

function fadeInWidgets() {
  $eventsList.fadeIn(650);
  $schedule.fadeIn(650);
  $calendar.fadeIn(650);
  $notes.fadeIn(650);
}
