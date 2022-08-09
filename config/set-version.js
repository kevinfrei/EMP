const { write } = require('jimp');
const path = require('path');
const fsp = require('fs').promises;
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => {
    readline.question(query, resolve);
  });
}

// Creates a {major, minor, patch} triad from a properly formatted string
function getSemVer(str) {
  const rgx = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/;
  const res = rgx.exec(str);
  if (!res || res.length !== 4) {
    throw Error(`Unsupported version format:"${str}"`);
  }
  return {
    major: Number.parseInt(res[1]),
    minor: Number.parseInt(res[2]),
    patch: Number.parseInt(res[3]),
  };
}

// User Input: are we bumping the patch, minor, or major version number?
async function whichVer() {
  const which = await question(
    'Major, minor, or patch version bump? (Default is patch) ',
  );
  switch (which.toLowerCase()) {
    case '':
    case 'patch':
    case 'path':
      return 'patch';
    case 'major':
    case 'maj':
      return 'major';
    case 'min':
    case 'minor':
      return 'minor';
    default:
      throw new Error(`I don't understand ${which} - Sorry!`);
  }
}

// Reads the version number from the about.html file
// Returns a {version, contents, index} object
async function getAboutVersion(filePath) {
  const about = await fsp.readFile(filePath, 'utf-8');
  const trimmed = about.split('\n').map((val) => val.trim());
  let which = -1;
  const versLines = trimmed.filter((val, idx) => {
    if (
      val.startsWith('<div id="version">Version ') &&
      val.endsWith('</div>')
    ) {
      which = idx;
      return true;
    }
    return false;
  });
  if (versLines.length !== 1 || which === -1) {
    throw Error(
      `Invalid version line in About file: ${
        versLine ? versLine.length : 'not found'
      }`,
    );
  }
  return {
    version: versLines[0].substring(26, versLines[0].length - 6),
    contents: trimmed,
    index: which,
  };
}

async function readJSONFile(filename) {
  const text = await fsp.readFile(filename);
  return JSON.parse(text);
}

async function writeJSONFile(filename, json) {
  const data = JSON.stringify(json, null, '  ');
  await fsp.writeFile(filename, data, 'utf-8');
}

async function writeHTMLFile(filename, html) {
  const data = html.join('\n');
  await fsp.writeFile(filename, data, 'utf-8');
}

function bumpVer(which, ver) {
  switch (which) {
    case 'major':
      return { major: ver.major + 1, minor: 0, patch: 0 };
    case 'minor':
      return { major: ver.major, minor: ver.minor + 1, patch: 0 };
    case 'patch':
      return { major: ver.major, minor: ver.minor, patch: ver.patch + 1 };
    default:
      throw Error(
        'Program failure: Invalid result from function whichVer():' + which,
      );
  }
}

async function main() {
  const curDir = process.cwd();
  const pkgPath = path.join(curDir, 'package.json');
  const pkg = await readJSONFile(pkgPath);
  const aboutPath = path.join(curDir, 'public', 'about.html');
  const about = await getAboutVersion(aboutPath);
  const aboutVer = about.version;
  const packageVer = pkg.version;
  if (aboutVer === packageVer) {
    console.log(`Current version: ${aboutVer}`);
  } else {
    throw Error(
      'Mismatched versions:\n  About version: ' +
        aboutVer +
        '\n  Package version: ' +
        packageVer,
    );
  }
  const which = await whichVer();
  const ver = getSemVer(aboutVer);
  const nuVer = bumpVer(which, ver);
  const verStr = `${nuVer.major}.${nuVer.minor}.${nuVer.patch}`;
  console.log(`Bumping to new version ${verStr}`);
  pkg.version = verStr;
  about.version = verStr;
  await writeJSONFile(pkgPath, pkg);
  about.contents[about.index] = `<div id="version">Version ${verStr}</div>`;
  await writeHTMLFile(
    aboutPath,
    // This makes HTML comments format into a nice place
    about.contents.map((val) => '      ' + val),
  );
}

main()
  .then(() => {
    console.log('Completed successfully');
    process.exit(0);
  })
  .catch((reason) => {
    console.error(reason);
    process.exit(-1);
  });
