function fmtTime(d) {
  var x = (d instanceof Date && !isNaN(d.getTime())) ? d : new Date();
  function pad(n) { return n < 10 ? "0" + n : n; }
  return (x.getMonth() + 1) + "-" + pad(x.getDate()) + " " + pad(x.getHours()) + ":" + pad(x.getMinutes());
}