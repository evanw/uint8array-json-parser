# JSON.parse() on Uint8Array

V8's maximum string size prevents using JSON.parse() for large JSON files.
This module exposes JSON_parse() that should behave similarly to JSON.parse() except it expects a Uint8Array instead of a String.
Using a Uint8Array lets it scale to much larger JSON files than the native JSON.parse().
It appears to be roughly 4x slower than the native implementation.

## Usage

```js
var JSON_parse = require('uint8array-json-parser').JSON_parse;
var fs = require('fs');

var bigFile = fs.readFileSync('./big-file.json');
var json = JSON_parse(bigFile);
console.log(json);
```

## Disclaimer

I wrote this one night because I needed it.
It works fine for my use case and should be reasonably well-built (e.g. it doesn't use recursion to avoid stack overflow).
But it doesn't have test coverage, and may not do what you need it to.
