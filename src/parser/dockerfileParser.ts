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
import { Arg } from './instructions/arg';
import { Cmd } from './instructions/cmd';
import { Copy } from './instructions/copy';
import { Env } from './instructions/env';
import { Entrypoint } from './instructions/entrypoint';
import { From } from './instructions/from';
import { Healthcheck } from './instructions/healthcheck';
import { Onbuild } from './instructions/onbuild';
import { StopSignal } from './instructions/stopSignal';
import { Workdir } from './instructions/workdir';
import { User } from './instructions/user';
import { Dockerfile } from './dockerfile';
import { DIRECTIVE_ESCAPE } from '../docker';

export class DockerfileParser {

	private escapeChar: string;

	private createInstruction(document: TextDocument, lineRange: Range, instruction: string, instructionRange: Range) {
		switch (instruction.toUpperCase()) {
			case "ARG":
				return new Arg(document, lineRange, this.escapeChar, instruction, instructionRange);
			case "CMD":
				return new Cmd(document, lineRange, this.escapeChar, instruction, instructionRange);
			case "COPY":
				return new Copy(document, lineRange, this.escapeChar, instruction, instructionRange);
			case "ENTRYPOINT":
				return new Entrypoint(document, lineRange, this.escapeChar, instruction, instructionRange);
			case "ENV":
				return new Env(document, lineRange, this.escapeChar, instruction, instructionRange);
			case "FROM":
				return new From(document, lineRange, this.escapeChar, instruction, instructionRange);
			case "HEALTHCHECK":
				return new Healthcheck(document, lineRange, this.escapeChar, instruction, instructionRange);
			case "ONBUILD":
				return new Onbuild(document, lineRange, this.escapeChar, instruction, instructionRange);
			case "STOPSIGNAL":
				return new StopSignal(document, lineRange, this.escapeChar, instruction, instructionRange);
			case "WORKDIR":
				return new Workdir(document, lineRange, this.escapeChar, instruction, instructionRange);
			case "USER":
				return new User(document, lineRange, this.escapeChar, instruction, instructionRange);
		}
		return new Instruction(document, lineRange, this.escapeChar, instruction, instructionRange);
	}

	private getDirectiveSymbol(document: TextDocument, buffer: string): Line | null {
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
								// assume the line ends with the file
								let lineEnd = buffer.length;
								directiveValue: for (let k = j + 1; k < buffer.length; k++) {
									char = buffer.charAt(k);
									switch (char) {
										case '\r':
										case '\n':
											if (valueStart !== -1 && valueEnd === -1) {
												valueEnd = k;
											}
											// line break found, reset
											lineEnd = k;
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

								let lineRange = Range.create(document.positionAt(commentStart), document.positionAt(lineEnd));
								if (directiveStart === -1) {
									// no directive, it's a regular comment
									return new Comment(document, lineRange);
								}

								if (valueStart === -1) {
									// no non-whitespace characters found, highlight all the characters then
									valueStart = j + 1;
									valueEnd = lineEnd;
								} else if (valueEnd === -1) {
									// reached EOF
									valueEnd = buffer.length;
								}

								let nameRange = Range.create(document.positionAt(directiveStart), document.positionAt(directiveEnd));
								let valueRange = Range.create(document.positionAt(valueStart), document.positionAt(valueEnd));
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
		let line: any = this.getDirectiveSymbol(document, buffer);
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
								} else if (char === ' ' || char === '\t') {
									escapeCheck: for (let k = j + 2; k < buffer.length; k++) {
										switch (buffer.charAt(k)) {
											case ' ':
											case '\t':
												break;
											case '\r':
												if (buffer.charAt(k + 1) === '\n') {
													j = k + 1;
													break escapeCheck;
												}
											case '\n':
												j = k;
												break escapeCheck;
											default:
												j = k;
												break escapeCheck;
										}
									}
								} else {
									instruction = instruction + this.escapeChar;
								}
								break;
							case ' ':
							case '\t':
								if (instructionEnd === -1) {
									instructionEnd = j;
								}

								let escaped = false;
								for (let k = j + 1; k < buffer.length; k++) {
									switch (buffer.charAt(k)) {
										case '\r':
										case '\n':
											if (escaped) {
												continue;
											}
											i = k;
											lineRange = Range.create(document.positionAt(instructionStart), document.positionAt(k));
											instructionRange = Range.create(document.positionAt(instructionStart), document.positionAt(instructionEnd));
											dockerfile.addInstruction(this.createInstruction(document, lineRange, instruction, instructionRange));
											continue lineCheck;
										case this.escapeChar:
											let next = buffer.charAt(k + 1);
											if (next === '\n') {
												escaped = true;
												k++;
											} else if (next === '\r') {
												escaped = true;
												if (buffer.charAt(k + 2) === '\n') {
													k = k + 2;
												} else {
													k++;
												}
											} else if (next === ' ' || next === '\t') {
												escapeCheck: for (let l = k + 2; l < buffer.length; l++) {
													switch (buffer.charAt(l)) {
														case ' ':
														case '\t':
															break;
														case '\r':
															escaped = true;
															if (buffer.charAt(l + 1) === '\n') {
																k = l + 1;
																break escapeCheck;
															}
														case '\n':
															escaped = true;
															k = l;
															break escapeCheck;
														default:
															k = l;
															break escapeCheck;
													}
												}
											}
											continue;
										case '#':
											if (escaped) {
												escapeCheck: for (let l = k + 1; l < buffer.length; l++) {
													switch (buffer.charAt(l)) {
														case '\r':
															if (buffer.charAt(l + 1) === '\n') {
																k = l + 1;
																break escapeCheck;
															}
														case '\n':
															k = l;
															break escapeCheck;
													}
												}
											}
											break;
										case ' ':
										case '\t':
											break;
										default:
											if (escaped) {
												escaped = false;
											}
											break;
									}
								}
								// reached EOF
								lineRange = Range.create(document.positionAt(instructionStart), document.positionAt(buffer.length));
								instructionRange = Range.create(document.positionAt(instructionStart), document.positionAt(instructionEnd));
								dockerfile.addInstruction(this.createInstruction(document, lineRange, instruction, instructionRange));
								break lineCheck;
							case '\r':
								if (instructionEnd === -1) {
									instructionEnd = j;
								}
								if (buffer.charAt(j + 1) === '\n') {
									j++;
								}
							case '\n':
								if (instructionEnd === -1) {
									instructionEnd = j;
								}
								lineRange = Range.create(document.positionAt(instructionStart), document.positionAt(instructionEnd));
								dockerfile.addInstruction(this.createInstruction(document, lineRange, instruction, lineRange));
								i = j;
								continue lineCheck;
							default:
								instructionEnd = j + 1;
								instruction = instruction + char;
								break;
						}
					}
					// reached EOF
					if (instructionEnd === -1) {
						instructionEnd = buffer.length;
					}
					lineRange = Range.create(document.positionAt(instructionStart), document.positionAt(instructionEnd));
					dockerfile.addInstruction(this.createInstruction(document, lineRange, instruction, lineRange));
					break lineCheck;
			}
		}

		return dockerfile;
	}

}
