import { List, Text } from '@fluentui/react';

// Gonna make a better looking list. Check to make sure you can expand it
// https://developer.microsoft.com/en-us/fluentui#/controls/web/list
export function NuAlbums(): JSX.Element {
  return (
    <div>
      <List>
        <Text>Howdy</Text>
        <Text>Howdy</Text>
        <Text>Howdy</Text>
        <Text>Howdy</Text>
        <Text>Howdy</Text>
        <Text>Howdy</Text>
      </List>
    </div>
  );
}

function foo() {
  let total = 0;
  let max = 0;
  for (let i = 0; i < 1048576; i++) {
    const c = String.fromCharCode(i);
    const n = c.charCodeAt(0);
    if (n < i) {
      max = i;
      break;
    }
    const lc = c.toLocaleLowerCase();
    const uc = c.toLocaleUpperCase();
    if (lc !== uc) {
      console.log(`${i}: ${c} -- ${lc}/${uc}`);
      total++;
    }
  }
  console.log(`${total} out of ${max}`);
}
