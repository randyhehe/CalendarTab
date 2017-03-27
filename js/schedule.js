import storage from './storage.js';
import colors from './gCalColors.js';
import moment from 'moment';
import linkify from 'linkifyjs';
import linkifyHtml from 'linkifyjs/html';

let URL = "https://www.googleapis.com/calendar/v3/users/me/calendarList/";
let TOKEN = "";

// Cache DOM
let $schedule = $("#main-ui").find("#schedule");
let $eventsList = $schedule.find("#sched-list");
let $filterGroup = $schedule.find("#time-cal-btn-group");
let $timeDropdown = $filterGroup.find("#time-dropdown-group");
let $timeButton = $timeDropdown.find("#time-btn");
let $dayBtn = $timeDropdown.find("#day-btn");
let $weekBtn = $timeDropdown.find("#week-btn");
let $monthBtn = $timeDropdown.find("#month-btn");
let $allBtn = $timeDropdown.find("#all-btn");
let $calendarDropdown = $filterGroup.find("#cal-dropdown-group").find("#cal-dropdown-items");

// Event handlers
$dayBtn.on('click', () => {changeTimeFilter("Day")});
$weekBtn.on('click', () => {changeTimeFilter("Week")});
$monthBtn.on('click', () => {changeTimeFilter("Month")});
$allBtn.on('click', () => {changeTimeFilter("All")});

function changeTimeFilter(selectedFilter) {
  storage.setStorage("timeFilter", selectedFilter).then(function() {
    $timeButton.text(selectedFilter);
    renderSchedule(false);
  });
}

function renderSchedule(initialRender) {
  if (initialRender) {
    getToken()
    .then(function() { return getCalendars(undefined); })
    .then(function(calendarList) { return storeCalendarColors(calendarList); })
    .then(function(calendarList) { return updateDropdowns(calendarList); })
    .then(function(calendarList) { return requestEventsList(calendarList); })
    .then(function(requestList) { return getEventsList(requestList); })
    .then(function(parsedEventsList) { return renderEventsList(parsedEventsList); });
  } else {
    getToken()
      .then(function() { return getCalendars(undefined); })
      .then(function(calendarList) { return requestEventsList(calendarList); })
      .then(function(requestList) { return getEventsList(requestList); })
      .then(function(parsedEventsList) { return renderEventsList(parsedEventsList); });
  }
}

let getToken = function() {
  return new Promise(function(resolve, reject) {
    storage.getStorage().then(function(items) {
      TOKEN = items['token'];
      resolve();
    });
  });
};

let getCalendars = function(parameters) {
  return new Promise(function(resolve, reject) {
    let request = URL;
    if (parameters !== undefined) {
      for (let i = 0; i < parameters.length; i++)
        request += "?" + parameters[i]["param"] + "=" + parameters[i]["value"];
    }
    $.ajax({
      url: request,
      headers: {"Authorization": "Bearer " + TOKEN},
      success: function(calendarList) { resolve(calendarList.items); }
    });
  });
};

let storeCalendarColors = function(calendarList) {
  return new Promise(function(resolve, reject) {
    let suffix = "-color";
    let callbacksRemaining = calendarList.length;
    for (let i = 0; i < calendarList.length; i++) {
      let cal = calendarList[i];
      storage.setStorage(cal.id + suffix, cal.colorId).then(function() {
        if (--callbacksRemaining === 0) resolve(calendarList);
      });
    }
  });
};

let updateDropdowns = function(calendarList) {
  return new Promise(function(resolve, reject) {
    resolve(calendarList);
    updateTimeDropdown();
    updateCalendarDropdown(calendarList);
  });
};

let updateTimeDropdown = function() {
  storage.getStorage().then(function(items) {
    $timeButton.text(items["timeFilter"]);
  });
};

let updateCalendarDropdown = function(calendarList) {
  // Add found calendars into dropdown.
  for (let i = 0; i < calendarList.length; i++) {
    let calendarEntry = "<a class=\"dropdown-item\" data-value=\"" + calendarList[i].id +
      "\"><input type=\"checkbox\"/>&nbsp;" + calendarList[i].summary + "</a>"
    $calendarDropdown.append(calendarEntry);
  }
  // Remember user checked calendars.
  let $calendarDropdownItems = $calendarDropdown.find('a');
  for (let i = 0; i < calendarList.length; i++) {
    storage.getStorage().then(function(items) {
      if (items[calendarList[i].id])
        $calendarDropdownItems.eq(i).find('input').prop('checked', true);
    });
  }
  // Set up click actions.
  $calendarDropdownItems.on('click', function(event) {
    let $target = $(event.currentTarget);
    let val = $target.attr("data-value");
    let $inp = $target.find("input");

    storage.getStorage().then(function(items) {
      if (items[val]) {
        storage.removeStorage(val).then(function() { renderSchedule(false); });
        setTimeout(function() { $inp.prop('checked', false)}, 0);
      }
      else {
        storage.setStorage(val, true).then(function() { renderSchedule(false); });
        setTimeout(function() { $inp.prop('checked', true)}, 0);
      }
      $(event.target).blur();
    });
    return false;
  });
};

let requestEventsList = function(calendarList) {
  return new Promise(function(resolve, reject) {
    let requestList = [];
    let callbacksRemaining = calendarList.length;
    for (let i = 0; i < calendarList.length; i++) {
      storage.getStorage().then(function(items) {
        if (items[calendarList[i].id]) {
          let base = "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(calendarList[i].id) + "/events";
          let params = "?timeMin=" + (new Date()).toISOString() + "&showDeleted=" + false + "&singleEvents=" + true + "&orderBy=" + 'startTime';

          let timeFilter = items["timeFilter"];
          if (timeFilter === "Day") params += "&timeMax=" + moment().add(1, 'days').toISOString();
          else if (timeFilter === "Week") params += "&timeMax=" + moment().add(7, 'days').toISOString();
          else if (timeFilter === "Month") params += "&timeMax=" + moment().add(30, 'days').toISOString();

          $.ajax({
            url: base + params,
            headers: {"Authorization": "Bearer " + TOKEN},
            success: function(result) {
              requestList.push.apply(requestList, result.items);
              if (--callbacksRemaining === 0) resolve(requestList);
            }
          });
        } else {
          if (--callbacksRemaining === 0) resolve(requestList);
        }
      });
    }
  });
};

let getEventsList = function(requestList) {
  return new Promise(function(resolve, reject) {
    let parsedEventsList = [];
    if (requestList.length === 0) resolve(parsedEventsList);

    let callbacksRemaining = requestList.length;
    for (let i = 0; i < requestList.length; i++) {
      parsedEventsList.push(parseEvent(requestList[i]));
      if (--callbacksRemaining === 0) {
        parsedEventsList.sort(compareDate);
        resolve(parsedEventsList);
      }
    }
  });
};

let renderEventsList = function(listEvents) {
  return new Promise(function(resolve, reject) {
    let listEntry = "";
    $eventsList.fadeOut(0);
    $eventsList.html("");

    let ongoingEvent = true;
    let ongoingList = {};
    for (let i = 0; i < listEvents.length; i++) {
      if (i === 0 || (listEvents[i].startDate !== listEvents[i - 1].startDate)) {
        listEntry += "<li id=\"list-" + i + "\"class=\"list-entry list-group-item\">" +
          "<div><h3>" + listEvents[i].startDate + "</h3></div>";

        // Keep checking for ongoing event and fill ongoingList until we encounter an event that isn't.
        if (ongoingEvent) {
          let currentlyOngoing = (moment().isAfter(moment(listEvents[i].timeStart)) && moment().isBefore(moment(listEvents[i].timeEnd)));
          if (currentlyOngoing) ongoingList["#list-" + i] = true;
          else ongoingEvent = false;
        }
      }

      listEntry +=
        "<div class=\"list-entry-body\">" +
          "<div id=\"cal-color-entry-" + i + "\" class=\"cal-color\"></div>" +
          "<h4 class=\"list-entry-text\">" + listEvents[i].summary + "</h3>" +
          "<p class=\"list-entry-text\">" + listEvents[i].timeAndDate + listEvents[i].location + "</p>" +
          "<p class=\"list-entry-text\">" + listEvents[i].description + "</p>" +
        "</div>";

      storage.getStorage().then(function(items) {
        $eventsList.find("#cal-color-entry-" + i).css({ "backgroundColor": colors[items[listEvents[i].emailID + "-color"]] });
      });

      // Wait until current event is either the last element or does not have the same startDate as the previous element
      if ((i < listEvents.length - 1) && (listEvents[i].startDate === listEvents[i + 1].startDate)) continue;

      listEntry += "</li>";
      $eventsList.append(listEntry);
      listEntry = "";
    }

    // Extract values from ongoingList and highlight them.
    for (let key in ongoingList) {
      if (!ongoingList.hasOwnProperty(key)) continue;
      $eventsList.find(key).css({ "backgroundColor": "rgba(54,54,82, 0.8)" });
    }

    // If empty
    if ($eventsList.html() === "") {
      let emptyEntry = "<li id=\"no-events-msg\" class=\"text-xs-center\"><h4>There Are No Events to Show</h4></li>";
      $eventsList.append(emptyEntry);
    }

    $eventsList.html(linkifyHtml($eventsList.html()));
    $(document).trigger("fadein");
  });
};

function parseEvent(event) {
  // Assign event's start and end date/time
  let timeStart = event.start.dateTime;
  if (!timeStart) timeStart = event.start.date; // event.*.dateTime does not exist for an all day event. Assign to a timeless date.
  let timeEnd = event.end.dateTime;
  if (!timeEnd) timeEnd = event.end.date;

  // Check if the event is an all day event.
  let allDayEvent = false;
  if (moment(timeStart).format("h:mm a") == "12:00 am" &&
    moment(timeEnd).format("h:mm a") == "12:00 am") {
    allDayEvent = true;
  }

  // Check if the event passes to the next day.
  let ongoingEvent = false;
  if (moment(timeStart).format("MMMM Do") != moment(timeEnd).format("MMMM Do")) {
    ongoingEvent = true;
  }

  // Configure time and date displayed to the user.
  let timeAndDate;
  if (!allDayEvent) {
    timeAndDate = moment(timeStart).format("h:mm a") + " - " + moment(timeEnd).format("h:mm a");
  } else {
    timeAndDate = "ALL DAY";
  }

  // Dont add 'until' if it is an ongoing event that lasts only a single day.
  let singleAllDayEvent = allDayEvent && moment(timeStart).add(1, 'day').format("MMMM Do") == moment(timeEnd).format("MMMM Do");
  if (ongoingEvent && !singleAllDayEvent) {
    if (allDayEvent) timeAndDate += " until " + moment(timeEnd).format("MMMM Do");
    else timeAndDate = moment(timeStart).format("h:mm a") + " until " + moment(timeEnd).format("MMMM Do") + " " + moment(timeEnd).format("h:mm a");
  }

  // Configure location and description displayed to user.
  // Location and description is undefined if not set by user.
  let location = (event.location != undefined) ? " | " + event.location : "";
  let description = (event.description != undefined) ? event.description : "";
  let startDate = moment(timeStart).format("MMM Do YYYY");

  let eventEntry = {
    'timeStart': timeStart,
    'timeEnd': timeEnd,
    'timeAndDate': timeAndDate,
    'location': location,
    'description': description,
    'startDate': startDate,
    'summary': event.summary,
    'emailID': event.organizer.email
  }
  return eventEntry;
}

function compareDate(a, b) {
    if (moment(a.timeStart).isBefore(moment(b.timeStart))) return -1;
    else if (moment(a.timeStart).isAfter(moment(b.timeStart))) return 1;
    else return 0;
}

module.exports = renderSchedule;
