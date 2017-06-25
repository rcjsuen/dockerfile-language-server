/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	TextDocument, TextEdit, Position, Range, FormattingOptions,
} from 'vscode-languageserver';
import { Util } from '../src/docker';

export class DockerFormatter {

	private isWhitespace(char: string): boolean {
		return char === ' ' || char === '\t' || this.isNewline(char);
	}

	private isNewline(char: string): boolean {
		return char === '\r' || char === '\n';
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

	/**
	 * Creates a TextEdit for formatting the given document.
	 * 
	 * @param document the document being formatted
	 * @param start the start offset of the document's content to be replaced
	 * @param end the end offset of the document's content to be replaced
	 * @param indent true if this block should be replaced with an indentation, false otherwise
	 * @param indentation the string to use for an indentation
	 */
	private createFormattingEdit(document: TextDocument, start: number, end: number, indent: boolean, indentation: string): TextEdit {
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

	public formatRange(document: TextDocument, range: Range, options?: FormattingOptions): TextEdit[] {
		let indentation = this.getIndentation(options);
		let edits = [];
		let buffer = document.getText();
		let escapeChar = Util.getEscapeDirective(buffer);
		let indent = false;
		let comment = false;
		let parseStart = 0;
		if (range.start.line !== 0) {
			// walk back to see if an indentation is needed for the first line of the selected blocks
			for (let i = document.offsetAt(range.start); i >= 0; i--) {
				let char = buffer.charAt(i);
				if (char === '\r') {
					if (buffer.charAt(i - 1) === escapeChar) {
						indent = true;
					}
					parseStart = i + 1;
					break;
				} else if (char === '\n') {
					char = buffer.charAt(i - 1);
					if (char === escapeChar || (char === '\r' && buffer.charAt(i - 2) === escapeChar)) {
						indent = true;
					}
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
						if (i === 0) {
							return [];
						}
						return [ TextEdit.del(Range.create(Position.create(0, 0), Position.create(0, i))) ];
					}
				}
				// only whitespace characters?
				if (buffer.length > 0) {
					return [ TextEdit.del(Range.create(Position.create(0, 0), Position.create(0, buffer.length))) ];
				}
			} else {
				// formatting the one single line
				for (let i = parseStart; i < buffer.length; i++) {
					if (!this.isWhitespace(buffer.charAt(i))) {
						if (parseStart === i) {
							// the first char is not a whitespace, either indent or no formatting
							if (indent) {
								return [ TextEdit.insert(document.positionAt(i), indentation) ];
							}
							return [];
						}
						if (indent) {
							return [ TextEdit.replace(Range.create(Position.create(range.start.line, 0), document.positionAt(i)), indentation) ];
						}
						return [ TextEdit.del(Range.create(Position.create(range.start.line, 0), Position.create(range.start.line, i - parseStart))) ];
					}
				}
			}
		}

		// search for the end of the selection, as determined by a newline or an EOF
		let parseEnd = buffer.length;
		for (let i = document.offsetAt(range.end); i < parseEnd; i++) {
			if (this.isNewline(buffer.charAt(i))) {
				parseEnd = i;
				break;
			}
		}

		return this.format(document, buffer.substring(parseStart, parseEnd), escapeChar, indent, parseStart, options);
	}

	public formatDocument(document: TextDocument, options?: FormattingOptions): TextEdit[] {
		let buffer = document.getText();
		let escapeChar = Util.getEscapeDirective(buffer);
		return this.format(document, buffer, escapeChar, false, 0, options);
	}

	private format(document: TextDocument, buffer: string, escapeChar: string, indent: boolean, documentOffset: number, options?: FormattingOptions): TextEdit[] {
		let indentation = this.getIndentation(options);
		let edits = [];
		let comment = false;
		let lineStart = 0;
		lineCheck: for (let i = 0; i < buffer.length; i++) {
			switch (buffer.charAt(i)) {
				case ' ':
				case '\t':
					// check for last line being whitespaces
					if (i + 1 === buffer.length) {
						let edit = TextEdit.del({
							start: document.positionAt(documentOffset + lineStart),
							end: document.positionAt(documentOffset + i + 1)
						});
						edits.push(edit);
					}
					continue;
				case '\r':
				case '\n':
					// empty lines with just whitespace
					if (lineStart !== i) {
						let edit = TextEdit.del({
							start: document.positionAt(documentOffset + lineStart + documentOffset),
							end: document.positionAt(documentOffset + i)
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
						let edit = this.createFormattingEdit(document, documentOffset + lineStart, documentOffset + i, indent, indentation);
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
