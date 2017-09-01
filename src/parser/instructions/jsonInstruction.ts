/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Argument } from '../argument';
import { Instruction } from '../instruction';

export class JSONInstruction extends Instruction {

	private readonly openingBracket: Argument;
	private readonly closingBracket: Argument;
	private readonly jsonStrings = [];

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);

		const argsContent = this.getArgumentsContent();
		if (argsContent === null) {
			return;
		}

		const args = this.getArguments();
		if (args.length === 1 && args[0].getValue() === "[]") {
			let argRange = args[0].getRange();
			this.openingBracket = new Argument("[", Range.create(argRange.start.line, argRange.start.character, argRange.start.line, argRange.start.character + 1));
			this.closingBracket = new Argument("]", Range.create(argRange.start.line, argRange.start.character + 1, argRange.end.line, argRange.end.character));
			return;
		} else if (args.length === 2 && args[0].getValue() === '[' && args[1].getValue() === ']') {
			this.openingBracket = args[0];
			this.closingBracket = args[1];
			return;
		}

		let fullStart = -1;
		let rangeStart = -1;
		let rangeEnd = -1;
		let argsRange = this.getArgumentsRange();
		const argsOffset = document.offsetAt(argsRange.start);
		let last = "";
		let quoted = false;
		argsCheck: for (let i = 0; i < argsContent.length; i++) {
			switch (argsContent.charAt(i)) {
				case '[':
					if (last === "") {
						this.openingBracket = new Argument(
							"[", Range.create(document.positionAt(argsOffset + i), document.positionAt(argsOffset + i + 1))
						);
						last = '[';
						fullStart = i + 1;
					} else if (!quoted) {
						break argsCheck;
					}
					break;
				case '"':
					if (last === '[' || last === ',') {
						quoted = true;
						last = '"';
						continue;
					} else if (last === '"') {
						if (quoted) {
							rangeEnd = i + 1;
							// quoted string done
							quoted = false;
						} else {
							// should be a , or a ]
							break argsCheck;
						}
					} else {
						break argsCheck;
					}
					break;
				case ',':
					if (!quoted) {
						this.jsonStrings.push(new Argument(
							argsContent.substring(fullStart, i),
							Range.create(document.positionAt(argsOffset + fullStart), document.positionAt(argsOffset + i))
						));
						fullStart = i + 1;
						if (last === '"') {
							last = ','
						} else {
							break argsCheck;
						}
					}
					break;
				case ']':
					if (!quoted && last !== "") {
						this.jsonStrings.push(new Argument(
							argsContent.substring(fullStart, i),
							Range.create(document.positionAt(argsOffset + fullStart), document.positionAt(argsOffset + i))
						));
						this.closingBracket = new Argument(
							"]", Range.create(document.positionAt(argsOffset + i), document.positionAt(argsOffset + i + 1))
						);
						break argsCheck;
					}
					break;
				case ' ':
				case '\t':
					break;
				case '\\':
					if (quoted) {
						switch (argsContent.charAt(i + 1)) {
							case '"':
							case '\\':
								i++;
								continue;
							case ' ':
							case '\t':
								for (let j = i + 2; j < argsContent.length; j++) {
									switch (argsContent.charAt(j)) {
										case '\r':
											if (argsContent.charAt(j + 1) === '\n') {
												j++;
											}
										case '\n':
											i = j;
											continue argsCheck;
										case ' ':
										case '\t':
											break;
										default:
											break argsCheck;
									}
								}
								break;
							default:
								i++;
								continue;
						}
					} else {
						for (let j = i + 1; j < argsContent.length; j++) {
							switch (argsContent.charAt(j)) {
								case '\r':
									if (argsContent.charAt(j + 1) === '\n') {
										j++;
									}
								case '\n':
									i = j;
									continue argsCheck;
								case ' ':
								case '\t':
									break;
								default:
									break argsCheck;
							}
						}
					}
					break;
				default:
					if (!quoted) {
						break argsCheck;
					}
					break;
			}
		}
	}

	public getOpeningBracket(): Argument | null {
		return this.openingBracket;
	}

	public getJSONStrings(): Argument[] {
		return this.jsonStrings;
	}

	public getClosingBracket(): Argument | null {
		return this.closingBracket;
	}
}
