/* comidacoachellavalley: the Print button on the flyer page. Waits for the fonts, then opens the print dialog. */
(function () {
  'use strict';
  var btn = document.getElementById('print');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () { window.print(); });
  });
})();
