/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { TextDocument, Range } from 'vscode-languageserver';
import { Comment } from './comment';
import { Directive } from './directive';
import { Instruction } from './instruction';
import { Line } from './line';
import { Onbuild } from './instructions/onbuild';
import { Dockerfile } from './dockerfile';
import { Util, DIRECTIVE_ESCAPE } from '../src/docker';

export class DockerfileParser {

	private escapeChar: string;

	private createInstruction(document: TextDocument, lineRange: Range, instruction: string, instructionRange: Range) {
		if (instruction.toUpperCase() === "ONBUILD") {
			return new Onbuild(document, this.escapeChar, lineRange, instruction, instructionRange);
		}
		return new Instruction(document, lineRange, instruction, instructionRange);
	}

	private getDirectiveSymbol(document: TextDocument, buffer: string, textDocumentURI: string): Line {
		let line = null;
		// reset the escape directive in between runs
		this.escapeChar = '';
		directiveCheck: for (let i = 0; i < buffer.length; i++) {
			switch (buffer.charAt(i)) {
				case ' ':
				case '\t':
				case '\r':
				case '\n':
					break;
				case '#':
					let commentStart = i;
					let directiveStart = -1;
					let directiveEnd = -1;
					for (let j = i + 1; j < buffer.length; j++) {
						let char = buffer.charAt(j);
						switch (char) {
							case ' ':
							case '\t':
								if (directiveStart !== -1 && directiveEnd === -1) {
									directiveEnd = j;
								}
								break;
							case '\r':
							case '\n':
								return new Comment(document, Range.create(document.positionAt(commentStart), document.positionAt(j)));
							case '=':
								let valueStart = -1;
								let valueEnd = -1;
								if (directiveEnd === -1) {
									directiveEnd = j;
								}
								directiveValue: for (let k = j + 1; k < buffer.length; k++) {
									char = buffer.charAt(k);
									switch (char) {
										case '\r':
										case '\n':
											if (valueStart !== -1 && valueEnd === -1) {
												valueEnd = k;
											}
											break directiveValue;
										case '\t':
										case ' ':
											if (valueStart !== -1 && valueEnd === -1) {
												valueEnd = k;
											}
											continue;
										default:
											if (valueStart === -1) {
												valueStart = k;
											}
											break;
									}
								}

								let value = null;
								if (valueStart !== -1) {
									if (valueEnd === -1) {
										// reached EOF
										valueEnd = valueStart + 1;
									}
								}

								let lineRange = Range.create(document.positionAt(commentStart), document.positionAt(valueEnd));
								if (directiveStart === -1) {
									return new Comment(document, lineRange);
								}

								let nameRange = Range.create(document.positionAt(directiveStart), document.positionAt(directiveEnd));
								let valueRange = null;
								if (valueStart !== -1) {
									valueRange = Range.create(document.positionAt(valueStart), document.positionAt(valueEnd));
								}
								return new Directive(document, lineRange, nameRange, valueRange);
							default:
								if (directiveStart === -1) {
									directiveStart = j;
								}
								break;
						}
					}
					break;
				default:
					break directiveCheck;
			}
		}
		return null;
	}

	public parse(document: TextDocument): Dockerfile {
		let buffer = document.getText();
		let dockerfile = new Dockerfile();
		let line: any = this.getDirectiveSymbol(document, buffer, document.uri);
		let offset = 0;
		this.escapeChar = '\\';
		if (line instanceof Directive) {
			let directive = line as Directive;
			dockerfile.setDirective(directive);
			if (DIRECTIVE_ESCAPE === directive.getDirective()) {
				let value = directive.getValue();
				if (value === '`' || value === '\\') {
					this.escapeChar = value;
				}
			}
			offset = document.offsetAt(line.getRange().end);
		}

		lineCheck: for (let i = offset; i < buffer.length; i++) {
			let char = buffer.charAt(i);
			switch (char) {
				case this.escapeChar:
					char = buffer.charAt(i + 1);
					if (char === '\r') {
						if (buffer.charAt(i + 2) === '\n') {
							i++;
						}
						i++;
					} else if (char === '\n') {
						i++;
					}
					break;
				case ' ':
				case '\t':
				case '\r':
				case '\n':
					break;
				case '#':
					for (let j = i + 1; j < buffer.length; j++) {
						char = buffer.charAt(j);
						switch (char) {
							case '\r':
								if (buffer.charAt(j + 1) === '\n') {
									j++;
								}
							case '\n':
								i = j;
								let range = Range.create(document.positionAt(i), document.positionAt(j));
								dockerfile.addComment(new Comment(document, range));
								continue lineCheck;
						}
					}
					// reached EOF
					let range = Range.create(document.positionAt(i), document.positionAt(buffer.length));
					dockerfile.addComment(new Comment(document, range));
					break lineCheck;
				default:
					let instruction = char;
					let instructionStart = i;
					let instructionEnd = -1;
					let lineRange = null;
					let instructionRange = null;
					for (let j = i + 1; j < buffer.length; j++) {
						char = buffer.charAt(j);
						switch (char) {
							case this.escapeChar:
								char = buffer.charAt(j + 1);
								if (char === '\r') {
									if (buffer.charAt(j + 2) === '\n') {
										j++;
									}
									j++;
								} else if (char === '\n') {
									j++;
								} else {
									instruction = instruction + this.escapeChar;
								}
								break;
							case ' ':
							case '\t':
								if (instructionEnd === -1) {
									instructionEnd = j;
								}

								for (let k = j + 1; k < buffer.length; k++) {
									switch (buffer.charAt(k)) {
										case '\r':
										case '\n':
											i = k;
											lineRange = Range.create(document.positionAt(instructionStart), document.positionAt(k));
											instructionRange = Range.create(document.positionAt(instructionStart), document.positionAt(instructionEnd));
											dockerfile.addInstruction(this.createInstruction(document, lineRange, instruction, instructionRange));
											continue lineCheck;
										case this.escapeChar:
											if (buffer.charAt(k + 1) === '\n') {
												k++;
											} else if (buffer.charAt(k + 1) === '\r') {
												if (buffer.charAt(k + 2) === '\n') {
													k = k + 2;
												} else {
													k++;
												}
											}
											continue;
									}
								}
								// reached EOF
								lineRange = Range.create(document.positionAt(instructionStart), document.positionAt(buffer.length));
								instructionRange = Range.create(document.positionAt(instructionStart), document.positionAt(instructionEnd));
								dockerfile.addInstruction(this.createInstruction(document, lineRange, instruction, instructionRange));
								break lineCheck;
							case '\r':
								if (buffer.charAt(j + 1) === '\n') {
									j++;
								}
							case '\n':
								lineRange = Range.create(document.positionAt(instructionStart), document.positionAt(j));
								dockerfile.addInstruction(new Instruction(document, lineRange, instruction, lineRange));
								i = j;
								continue lineCheck;
							default:
								instruction = instruction + char;
								break;
						}
					}
					// reached EOF
					lineRange = Range.create(document.positionAt(instructionStart), document.positionAt(buffer.length));
					dockerfile.addInstruction(this.createInstruction(document, lineRange, instruction, lineRange));
					break lineCheck;
			}
		}

		return dockerfile;
	}

}
