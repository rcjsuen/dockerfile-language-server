/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	TextDocument, TextEdit, Position, Range, FormattingOptions,
} from 'vscode-languageserver';
import { DockerfileParser } from './parser/dockerfileParser';

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
		let buffer = document.getText();
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		let escapeChar = dockerfile.getEscapeCharacter();
		let indent = false;
		let parseStart = 0;
		if (range.start.line !== 0) {
			parseStart = document.offsetAt(Position.create(range.start.line, 0));
			for (let instruction of dockerfile.getInstructions()) {
				let instructionRange = instruction.getRange();
				if (instructionRange.start.line === range.start.line) {
					break;
				} else if (instructionRange.start.line !== instructionRange.end.line && range.start.line <= instructionRange.end.line) {
					indent = true;
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
				// only whitespace characters
				return [ TextEdit.del(Range.create(Position.create(0, 0), Position.create(0, buffer.length))) ];
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
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		let escapeChar = dockerfile.getEscapeCharacter();
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
								// only try to escape if we're not in a comment
								if (!comment) {
									// see if we're actually escaping a newline or not
									for (let k = j + 1; j < buffer.length; k++) {
										escapeCheck: switch (buffer.charAt(k)) {
											case ' ':
											case '\t':
												// whitespace can come after the escape character
												continue;
											case '\r':
												if (buffer.charAt(k + 1) === '\n') {
													lineStart = k + 2;
												} else {
													lineStart = k + 1;
												}
												i = lineStart - 1;
												indent = true;
												comment = false;
												continue lineCheck;
											case '\n':
												lineStart = k + 1;
												i = k;
												indent = true;
												comment = false;
												continue lineCheck;
											default:
												// encountered non-whitespace, ignore this escape character
												j = k;
												break escapeCheck;
										}
									}
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
