let $backgroundImage = $("#bg-image");

$(window).on("load", () => {
  $backgroundImage.css('display', 'block');
  setTimeout(function() {
    $backgroundImage.css('opacity', '1');
  }, 50);
});
