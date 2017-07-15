/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';

import { Argument } from './argument';
import { Util } from '../docker';

export class Property {

	private readonly nameRange: Range;
	private readonly name: string = null;
	private readonly valueRange: Range;
	private readonly value: string = null;

	constructor(document: TextDocument, escapeChar: string, arg: Argument) {
		this.nameRange = Property.getNameRange(document, arg);
		if (this.nameRange) {
			this.name = document.getText().substring(document.offsetAt(this.nameRange.start), document.offsetAt(this.nameRange.end));
		}
		this.valueRange = Property.getValueRange(document, escapeChar, arg);
		if (this.valueRange) {
			let value = document.getText().substring(document.offsetAt(this.valueRange.start), document.offsetAt(this.valueRange.end));
			this.value = Property.getValue(value, escapeChar);
		}
	}

	public getName(): string | null {
		return this.name;
	}

	public getNameRange(): Range {
		return this.nameRange;
	}

	public getValue(): string | null {
		return this.value;
	}

	public getValueRange(): Range {
		return this.valueRange;
	}

	private static getNameRange(document: TextDocument, arg: Argument): Range | null{
		let index = arg.getValue().indexOf('=');
		if (index !== -1) {
			return Range.create(arg.getRange().start, document.positionAt(document.offsetAt(arg.getRange().start) + index));
		}
		// no '=' found, just defined the ARG's name
		return arg.getRange();
	}

	private static getValueRange(document: TextDocument, escapeChar: string, arg: Argument): Range | null {
		let argValue = arg.getValue();
		let index = argValue.indexOf('=');
		if (index === -1) {
			// no value declared if no '=' found
			return null;
		}

		// trim the leading whitespace of the variable's value
		let startIndex = index < argValue.length - 1 ? Util.findLeadingNonWhitespace(argValue.substring(index + 1), escapeChar) : 0;
		return Range.create(
			document.positionAt(document.offsetAt(arg.getRange().start) + index + startIndex + 1),
			document.positionAt(document.offsetAt(arg.getRange().end))
		);
	}

	/**
	 * Returns the actual value of this ARG instruction's declared
	 * variable. The value will have its escape characters removed if
	 * applicable.
	 * 
	 * @return the value that this ARG instruction's declared
	 *         variable will resolve to, may be null if no value is
	 *         defined, may be the empty string if the value only
	 *         consists of whitespace
	 */
	private static getValue(value: string, escapeChar: string): string | null {
		let literal = false;
		let first = value.charAt(0);
		let last = value.charAt(value.length - 1);
		if ((first === '"' && last === '"') || (first === '\'' && last === '\'')) {
			literal = true;
			value = value.substring(1, value.length - 1);
		}

		let escapedValue = "";
		parseValue: for (let i = 0; i < value.length; i++) {
			let char = value.charAt(i);
			if (char === escapeChar) {
				if (i + 1 === value.length) {
					break;
				}

				char = value.charAt(i + 1);
				if (literal) {
					if (char === '\n') {
						i++;
					} else {
						if (char === escapeChar) {
							i++;
						}	
						escapedValue = escapedValue + escapeChar;
					}
					continue parseValue;
				} else if (char === escapeChar) {
					// double escape, append one and move on
					escapedValue = escapedValue + escapeChar;
					i++;
				} else if (char === '\r') {
					if (value.charAt(i + 2) === '\n') {
						i++;
					}
					i++;
				} else if (char === '\n') {
					i++;
				} else if (char === ' ' || char === '\t') {
					for (let j = i + 2; j < value.length; j++) {
						let char2 = value.charAt(j);
						if (char2 === ' ' || char2 === '\t') {
							continue;
						} else if (char2 === '\r') {
							if (value.charAt(j + 1) === '\n') {
								i = j + 1;
							} else {
								i = j;
							}
							continue parseValue;
						} else if (char2 === '\n') {
							// the expectation is that this is === '\n'
							i = j;
							continue parseValue;
						} else {
							// the expectation is that this j = i + 2 here
							escapedValue = escapedValue + char + char2;
							i = j;
							continue parseValue;
						}
					}
				} else {
					// any other escapes are simply ignored
					escapedValue = escapedValue + char;
					i++;
				}
			} else {
				escapedValue = escapedValue + char;
			}
		}
		
		return escapedValue;
	}
}
