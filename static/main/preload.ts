// @flow

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
// This is invoked before everything else for the windows, thanks to electron
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text: string) => {
    const element = document.getElementById(selector);
    if (element) {
      element.innerText = text;
    }
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});
