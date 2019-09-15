// Flow doesn't get ripped out here: Comment only syntax for now...

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const fs = require('fs');
const files = fs.readdirSync('/Users/freik');
window.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('files');
  if (el) {
    const list /*: string*/ = files
      .filter(nm => nm.charAt(0) !== '.')
      .map(val => val.replace(/ /g, '&nbsp;'))
      .join('; ');
    el.innerHTML = list;
  }
});
