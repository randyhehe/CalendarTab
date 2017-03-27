import moment from 'moment';
import storage from './storage.js';
import 'font-awesome-webpack';

let CURR_DATE;

// Cache DOM
let $calendar = $("#main-ui").find(".calendar");
let $calendarBody = $calendar.find("#table-body");

function populateCalendar() {
  CURR_DATE = new Date();
  storage.getStorage().then(function(items) {
    let firstDay = updateFirstDay(items);
    renderCalendarHeader(firstDay);
    renderCalendarUI(firstDay);
  });
}

function updateFirstDay(items) {
  let date;
  if (items["setCalMonth"] === undefined) {
    let currDate = new Date();
    date = new Date(currDate.getFullYear(), currDate.getMonth(), 1);
    storage.setStorage("setCalMonth", +date);
  } else {
    date = new Date(parseInt(items["setCalMonth"]));
    let currDate = new Date();
    if (moment(currDate).isAfter(date, 'month')) {
      date = new Date(currDate.getFullYear(), currDate.getMonth(), 1);
      storage.setStorage("setCalMonth", +date);
    }
  }
  return date;
}

function renderCalendarHeader(firstDay) {
  // update header
  $calendar.find('#month-header').html(
    "<i class=\"fa fa-angle-left\" aria-hidden=\"true\"></i>&nbsp;" +
    moment(firstDay).format('MMMM YYYY') +
    "&nbsp;<i class=\"fa fa-angle-right\" aria-hidden=\"true\"></i>"
  );
  changeCalendarMonthListener($(".fa-angle-left"), -1);
  changeCalendarMonthListener($(".fa-angle-right"), 1);
}

function changeCalendarMonthListener(element, amount) {
  element.on('click', function() {
    storage.getStorage().then(function(items) {
      let newDate = new Date(parseInt(items["setCalMonth"]));
      newDate = new Date(newDate.getFullYear(), newDate.getMonth() + amount, 1);

      storage.setStorage("setCalMonth", +newDate);
      renderCalendarHeader(newDate);
      renderCalendarUI(newDate);
    });
  });
}

function renderCalendarUI(firstDay) {
  let numSlots = 42;
  let lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);
  let numDays = moment(lastDay).format('D');

  $calendar = $("#main-ui").find(".calendar");
  $calendarBody = $calendar.find("#table-body");

  let row = 0;
  let col = 0;
  let dayOfWeek = moment(firstDay).format('dddd');
  switch (dayOfWeek) {
    case "Sunday": col = 0; break;
    case "Monday": col = 1; break;
    case "Tuesday": col = 2; break;
    case "Wednesday": col = 3; break;
    case "Thursday": col = 4; break;
    case "Friday": col = 5; break;
    case "Saturday": col = 6; break;
  }

  // previous month
  let prevMonth = moment(firstDay).subtract(1, 'days').format('D');
  let numPrev = (col - 1 >= 0) ? col : 0;
  for (let i = col - 1; i >= 0; i--) {
    let stringIden = "#row-" + 0 + " .col-" + i;
    let elem = $calendarBody.find(stringIden);

    elem.addClass("prev-month");
    elem.removeClass("next-month");
    elem.removeClass("current-day");
    elem.html(prevMonth--);
  }

  // current month
  for (let i = 1; i <= numDays; i++) {
    let stringIden = "#row-" + row + " .col-" + col;
    let elem = $calendarBody.find(stringIden);

    elem.removeClass("prev-month");
    elem.removeClass("next-month");
    elem.removeClass("current-day");
    if (moment(firstDay).isSame(moment(CURR_DATE), 'month') && i == moment(CURR_DATE).format('D')) elem.addClass("current-day");
    elem.html(i);

    if (++col > 6) {
      col = 0; row++;
    }
  }

  // next month
  for (let i = 1; i <= numSlots - numDays - numPrev; i++) {
    let stringIden = "#row-" + row + " .col-" + col;
    let elem = $calendarBody.find(stringIden);

    elem.addClass("next-month");
    elem.removeClass("prev-month");
    elem.removeClass("current-day");
    elem.html(i);

    if (++col > 6) {
      col = 0; row++;
    }
  }
}

module.exports = populateCalendar;
