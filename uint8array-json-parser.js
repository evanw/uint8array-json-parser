!function (exports) {
    var fromCharCode = String.fromCharCode;
    function throwSyntaxError(bytes, index, message) {
        var c = bytes[index];
        var line = 1;
        var column = 0;
        for (var i = 0; i < index; i++) {
            if (bytes[i] === 10 /* Newline */) {
                line++;
                column = 0;
            }
            else {
                column++;
            }
        }
        throw new SyntaxError(message ? message :
            index === bytes.length ? 'Unexpected end of input while parsing JSON' :
                c >= 0x20 && c <= 0x7E ? "Unexpected character " + fromCharCode(c) + " in JSON at position " + index + " (line " + line + ", column " + column + ")" :
                    "Unexpected byte 0x" + c.toString(16) + " in JSON at position " + index + " (line " + line + ", column " + column + ")");
    }
    exports.JSON_parse = function (bytes) {
        if (!(bytes instanceof Uint8Array)) {
            throw new Error("JSON input must be a Uint8Array");
        }
        var propertyStack = [];
        var objectStack = [];
        var stateStack = [];
        var length = bytes.length;
        var property = null;
        var state = 0 /* TopLevel */;
        var object;
        var i = 0;
        while (i < length) {
            var c = bytes[i++];
            // Skip whitespace
            if (c <= 32 /* Space */) {
                continue;
            }
            var value = void 0;
            // Validate state inside objects
            if (state === 2 /* Object */ && property === null && c !== 34 /* Quote */ && c !== 125 /* CloseBrace */) {
                throwSyntaxError(bytes, --i);
            }
            switch (c) {
                // True
                case 116 /* LowerT */: {
                    if (bytes[i++] !== 114 /* LowerR */ || bytes[i++] !== 117 /* LowerU */ || bytes[i++] !== 101 /* LowerE */) {
                        throwSyntaxError(bytes, --i);
                    }
                    value = true;
                    break;
                }
                // False
                case 102 /* LowerF */: {
                    if (bytes[i++] !== 97 /* LowerA */ || bytes[i++] !== 108 /* LowerL */ || bytes[i++] !== 115 /* LowerS */ || bytes[i++] !== 101 /* LowerE */) {
                        throwSyntaxError(bytes, --i);
                    }
                    value = false;
                    break;
                }
                // Null
                case 110 /* LowerN */: {
                    if (bytes[i++] !== 117 /* LowerU */ || bytes[i++] !== 108 /* LowerL */ || bytes[i++] !== 108 /* LowerL */) {
                        throwSyntaxError(bytes, --i);
                    }
                    value = null;
                    break;
                }
                // Number begin
                case 45 /* Minus */:
                case 46 /* Dot */:
                case 48 /* Digit0 */:
                case 49 /* Digit1 */:
                case 50 /* Digit2 */:
                case 51 /* Digit3 */:
                case 52 /* Digit4 */:
                case 53 /* Digit5 */:
                case 54 /* Digit6 */:
                case 55 /* Digit7 */:
                case 56 /* Digit8 */:
                case 57 /* Digit9 */: {
                    var index = i;
                    value = fromCharCode(c);
                    c = bytes[i];
                    // Scan over the rest of the number
                    while (true) {
                        switch (c) {
                            case 43 /* Plus */:
                            case 45 /* Minus */:
                            case 46 /* Dot */:
                            case 48 /* Digit0 */:
                            case 49 /* Digit1 */:
                            case 50 /* Digit2 */:
                            case 51 /* Digit3 */:
                            case 52 /* Digit4 */:
                            case 53 /* Digit5 */:
                            case 54 /* Digit6 */:
                            case 55 /* Digit7 */:
                            case 56 /* Digit8 */:
                            case 57 /* Digit9 */:
                            case 101 /* LowerE */:
                            case 69 /* UpperE */: {
                                value += fromCharCode(c);
                                c = bytes[++i];
                                continue;
                            }
                        }
                        // Number end
                        break;
                    }
                    // Convert the string to a number
                    value = +value;
                    // Validate the number
                    if (isNaN(value)) {
                        throwSyntaxError(bytes, --index, 'Invalid number');
                    }
                    break;
                }
                // String begin
                case 34 /* Quote */: {
                    value = '';
                    while (true) {
                        if (i >= length) {
                            throwSyntaxError(bytes, length);
                        }
                        c = bytes[i++];
                        // String end
                        if (c === 34 /* Quote */) {
                            break;
                        }
                        else if (c === 92 /* Backslash */) {
                            switch (bytes[i++]) {
                                // Normal escape sequence
                                case 34 /* Quote */:
                                    value += '\"';
                                    break;
                                case 47 /* Slash */:
                                    value += '\/';
                                    break;
                                case 92 /* Backslash */:
                                    value += '\\';
                                    break;
                                case 98 /* LowerB */:
                                    value += '\b';
                                    break;
                                case 102 /* LowerF */:
                                    value += '\f';
                                    break;
                                case 110 /* LowerN */:
                                    value += '\n';
                                    break;
                                case 114 /* LowerR */:
                                    value += '\r';
                                    break;
                                case 116 /* LowerT */:
                                    value += '\t';
                                    break;
                                // Unicode escape sequence
                                case 117 /* LowerU */: {
                                    var code = 0;
                                    for (var j = 0; j < 4; j++) {
                                        c = bytes[i++];
                                        code <<= 4;
                                        if (c >= 48 /* Digit0 */ && c <= 57 /* Digit9 */)
                                            code |= c - 48 /* Digit0 */;
                                        else if (c >= 97 /* LowerA */ && c <= 102 /* LowerF */)
                                            code |= c + (10 - 97 /* LowerA */);
                                        else if (c >= 65 /* UpperA */ && c <= 70 /* UpperF */)
                                            code |= c + (10 - 65 /* UpperA */);
                                        else
                                            throwSyntaxError(bytes, --i);
                                    }
                                    value += fromCharCode(code);
                                    break;
                                }
                                // Invalid escape sequence
                                default:
                                    throwSyntaxError(bytes, --i);
                                    break;
                            }
                        }
                        else if (c <= 0x7F) {
                            value += fromCharCode(c);
                        }
                        else if ((c & 0xE0) === 0xC0) {
                            value += fromCharCode(((c & 0x1F) << 6) | (bytes[i++] & 0x3F));
                        }
                        else if ((c & 0xF0) === 0xE0) {
                            value += fromCharCode(((c & 0x0F) << 12) | ((bytes[i++] & 0x3F) << 6) | (bytes[i++] & 0x3F));
                        }
                        else if ((c & 0xF8) == 0xF0) {
                            var codePoint = ((c & 0x07) << 18) | ((bytes[i++] & 0x3F) << 12) | ((bytes[i++] & 0x3F) << 6) | (bytes[i++] & 0x3F);
                            if (codePoint > 0xFFFF) {
                                codePoint -= 0x10000;
                                value += fromCharCode(((codePoint >> 10) & 0x3FF) | 0xD800);
                                codePoint = 0xDC00 | (codePoint & 0x3FF);
                            }
                            value += fromCharCode(codePoint);
                        }
                    }
                    // Force V8's rope representation to be flattened to compact the string and avoid running out of memory
                    value[0];
                    break;
                }
                // Array begin
                case 91 /* OpenBracket */: {
                    value = [];
                    // Push the stack
                    propertyStack.push(property);
                    objectStack.push(object);
                    stateStack.push(state);
                    // Enter the array
                    property = null;
                    object = value;
                    state = 1 /* Array */;
                    continue;
                }
                // Object begin
                case 123 /* OpenBrace */: {
                    value = {};
                    // Push the stack
                    propertyStack.push(property);
                    objectStack.push(object);
                    stateStack.push(state);
                    // Enter the object
                    property = null;
                    object = value;
                    state = 2 /* Object */;
                    continue;
                }
                // Array end
                case 93 /* CloseBracket */: {
                    if (state !== 1 /* Array */) {
                        throwSyntaxError(bytes, --i);
                    }
                    // Leave the array
                    value = object;
                    // Pop the stack
                    property = propertyStack.pop();
                    object = objectStack.pop();
                    state = stateStack.pop();
                    break;
                }
                // Object end
                case 125 /* CloseBrace */: {
                    if (state !== 2 /* Object */) {
                        throwSyntaxError(bytes, --i);
                    }
                    // Leave the object
                    value = object;
                    // Pop the stack
                    property = propertyStack.pop();
                    object = objectStack.pop();
                    state = stateStack.pop();
                    break;
                }
                default: {
                    throwSyntaxError(bytes, --i);
                }
            }
            c = bytes[i];
            // Skip whitespace
            while (c <= 32 /* Space */) {
                c = bytes[++i];
            }
            switch (state) {
                case 0 /* TopLevel */: {
                    // Expect the end of the input
                    if (i === length) {
                        return value;
                    }
                    break;
                }
                case 1 /* Array */: {
                    object.push(value);
                    // Check for more values
                    if (c === 44 /* Comma */) {
                        i++;
                        continue;
                    }
                    // Expect the end of the array
                    if (c === 93 /* CloseBracket */) {
                        continue;
                    }
                    break;
                }
                case 2 /* Object */: {
                    // Property
                    if (property === null) {
                        property = value;
                        // Expect a colon
                        if (c === 58 /* Colon */) {
                            i++;
                            continue;
                        }
                    }
                    else {
                        object[property] = value;
                        property = null;
                        // Check for more values
                        if (c === 44 /* Comma */) {
                            i++;
                            continue;
                        }
                        // Expect the end of the object
                        if (c === 125 /* CloseBrace */) {
                            continue;
                        }
                    }
                    break;
                }
            }
            // It's an error if we get here
            break;
        }
        throwSyntaxError(bytes, i);
    };
}(typeof exports !== 'undefined' ? exports : this);
