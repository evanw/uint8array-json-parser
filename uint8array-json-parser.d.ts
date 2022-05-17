export function JSON_parse(array: Uint8Array): any;

// It might seem weird to have a declaration file here given that the project is
// written in TypeScript, but it seems like uint8array-json-parser.ts was
// written in a way to minimize the minified size of the code. Unfortunately,
// the tricks it uses to do that make the TypeScript typechecker real unhappy
// when this module is imported, so we direct it to ignore that file.
