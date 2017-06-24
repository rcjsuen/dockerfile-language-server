/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	TextDocument, TextEdit, Position, Range, FormattingOptions,
} from 'vscode-languageserver';

export class DockerFormatter {

	private isWhitespace(char: string): boolean {
		return char === ' ' || char === '\t' || this.isNewline(char);
	}

	private isNewline(char: string): boolean {
		return char === '\r' || char === '\n';
	}

	private getEscapeDirective(buffer: string): string {
		directiveCheck: for (let i = 0; i < buffer.length; i++) {
			switch (buffer.charAt(i)) {
				case ' ':
				case '\t':
				case '\r':
				case '\n':
					break;
				case '#':
					let directiveStart = -1;
					let directive = "";
					for (let j = i + 1; j < buffer.length; j++) {
						let char = buffer.charAt(j);
						switch (char) {
							case ' ':
							case '\t':
								break;
							case '\r':
							case '\n':
								break directiveCheck;
							case '=':
								if (directive.toLowerCase() === "escape") {
									directiveValue: for (let k = j + 1; k < buffer.length; k++) {
										char = buffer.charAt(k);
										switch (char) {
											case '\r':
											case '\n':
												break directiveValue;
											case '\t':
											case ' ':
												continue;
											default:
												if (k + 1 !== buffer.length && this.isWhitespace(buffer.charAt(k + 1))) {
													return char;
												}
												break;
										}
									}
								}
								break directiveCheck;
							default:
								if (directiveStart === -1) {
									directiveStart = j;
								}
								directive = directive + char;
								break;
						}
					}
					break;
				default:
					break directiveCheck;
			}
		}
		return '\\';
	}

	private getIndentation(formattingOptions?: FormattingOptions): string {
		let indentation = "\t";
		if (formattingOptions && formattingOptions.insertSpaces) {
			indentation = "";
			for (let i = 0; i < formattingOptions.tabSize; i++) {
				indentation = indentation + " ";
			}
		}
		return indentation;
	}

	private createFormattingEdit(document: TextDocument, start, end, indent: boolean, indentation: string) {
		if (indent) {
			return TextEdit.replace({
				start: document.positionAt(start),
				end: document.positionAt(end)
			}, indentation);
		} else {
			return TextEdit.del({
				start: document.positionAt(start),
				end: document.positionAt(end)
			});
		}
	}

	public formatRange(document: TextDocument, range: Range, formattingOptions?: FormattingOptions): TextEdit[] {
		let indentation = this.getIndentation(formattingOptions);
		let edits = [];
		let buffer = document.getText();
		let escapeChar = this.getEscapeDirective(buffer);
		let indent = false;
		let comment = false;
		let parseStart = 0;
		if (range.start.line !== 0) {
			for (let i = document.offsetAt(range.start); i >= 0; i--) {
				if (this.isNewline(buffer.charAt(i))) {
					parseStart = i + 1;
					break;
				}
			}
		}
		if (range.start.line === range.end.line) {
			if (document.lineCount === 1) {
				// formatting the one single line
				for (let i = 0; i < buffer.length; i++) {
					if (!this.isWhitespace(buffer.charAt(i))) {
						return [ TextEdit.del(Range.create(Position.create(0, 0), Position.create(0, i))) ];
					}
				}
				if (buffer.trim().length === 0) {
					return [ TextEdit.del(Range.create(Position.create(0, 0), Position.create(0, buffer.length))) ];
				}
			} else {
				// formatting the one single line
				for (let i = parseStart; i < buffer.length; i++) {
					if (!this.isWhitespace(buffer.charAt(i))) {
						if (parseStart === i) {
							return [];
						}
						return [ TextEdit.del(Range.create(Position.create(range.start.line, 0), Position.create(range.start.line, i - parseStart))) ];
					}
				}
			}
		}

		return edits;
	}

	public formatDocument(document: TextDocument, formattingOptions?: FormattingOptions): TextEdit[] {
		let indentation = this.getIndentation(formattingOptions);
		let edits = [];
		let buffer = document.getText();
		let escapeChar = this.getEscapeDirective(buffer);
		let indent = false;
		let comment = false;
		let lineStart = 0;
		lineCheck: for (let i = 0; i < buffer.length; i++) {
			switch (buffer.charAt(i)) {
				case ' ':
				case '\t':
					// check for last line being whitespaces
					if (i + 1 === buffer.length) {
						let edit = TextEdit.del({
							start: document.positionAt(lineStart),
							end: document.positionAt(i + 1)
						});
						edits.push(edit);
					}
					continue;
				case '\r':
				case '\n':
					// empty lines with just whitespace
					if (lineStart !== i) {
						let edit = TextEdit.del({
							start: document.positionAt(lineStart),
							end: document.positionAt(i)
						});
						edits.push(edit);
					}
					lineStart = i + 1;
					comment = false;
					break;
				case '#':
					comment = true;
				default:
					if (lineStart !== i || indent) {
						let edit = this.createFormattingEdit(document, lineStart, i, indent, indentation);
						edits.push(edit);
						indent = false;
					}

					// skip the rest
					for (let j = i + 1; j < buffer.length; j++) {
						switch (buffer.charAt(j)) {
							case escapeChar:
								// only try to escape if we're in a comment
								if (!comment && (buffer.charAt(j + 1) === '\r' || buffer.charAt(j + 1) === '\n')) {
									indent = true;
									if (buffer.charAt(j + 2) === '\n') {
										lineStart = j + 3;
									} else {
										lineStart = j + 2;
									}
									i = lineStart - 1;
									comment = false;
									continue lineCheck;
								}
								break;
							case '\r':
								if (buffer.charAt(j + 1) === '\n') {
									lineStart = j + 2;
								} else {
									lineStart = j + 1;
								}
								comment = false;
								i = lineStart - 1;
								continue lineCheck;
							case '\n':
								lineStart = j + 1;
								i = j;
								comment = false;
								continue lineCheck;
						}
					}
					// reached EOF
					break lineCheck;
			}
		}
		return edits;
	}

}
