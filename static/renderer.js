// @flow

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const fs = require('fs');
const { ipcRenderer } = require('electron');

// This is where we start getting stuff from the main process without asking
ipcRenderer.on('asynchronous-message', (event, message) => {
  console.log('Async message from main:');
  console.log(event);
  console.log(`Message: '${message}'`);
});

//const files = fs.readdirSync('/Users/freik');
// An example of us starting communication with the main process
ipcRenderer.on('asynchronous-reply', (event, ...args) => {
  console.log('Async reply:');
  console.log(event);
  console.log('args:');
  console.log(args);
});
ipcRenderer.send('asynchronous-message', 'ping');

const doSomething = () => {
  const el = document.getElementById('files');
  if (el) el.innerText = 'I DID SOMETHING!';
};

window.addEventListener('DOMContentLoaded', doSomething);
