/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	TextDocument, TextEdit, Position, Range, FormattingOptions,
} from 'vscode-languageserver';
import { Dockerfile } from './parser/dockerfile';
import { DockerfileParser } from './parser/dockerfileParser';
import { Util } from './docker';

export class DockerFormatter {

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
		let lines = [];
		for (let i = range.start.line; i <= range.end.line; i++) {
			lines.push(i);
		}
		return this.format(document, lines, options);
	}

	public formatDocument(document: TextDocument, options?: FormattingOptions): TextEdit[] {
		let lines = [];
		for (let i = 0; i < document.lineCount; i++) {
			lines.push(i);
		}
		return this.format(document, lines, options);
	}

	/**
	 * Formats the specified lines of the given document based on the
	 * provided formatting options.
	 * 
	 * @param document the text document to format
	 * @param lines the lines to format
	 * @param options the formatting options to use to perform the format
	 * @return the text edits to apply to format the lines of the document
	 */
	private format(document: TextDocument, lines: number[], options?: FormattingOptions): TextEdit[] {
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		let content = document.getText();
		let indentation = this.getIndentation(options);
		let edits = [];
		let indentedLines = [];
		for (let i = 0; i < document.lineCount; i++) {
			indentedLines[i] = false;
		}
		for (let instruction of dockerfile.getInstructions()) {
			let range = instruction.getRange();
			indentedLines[range.start.line] = false;
			for (let i = range.start.line + 1; i <= range.end.line; i++) {
				indentedLines[i] = true;
			}
		}

		lineCheck: for (let line of lines) {
			let startOffset = document.offsetAt(Position.create(line, 0));
			for (let i = startOffset; i < content.length; i++) {
				switch (content.charAt(i)) {
					case ' ':
					case '\t':
						break;
					case '\r':
					case '\n':
						if (i !== startOffset) {
							// only whitespace on this line, trim it
							let edit = TextEdit.del({
								start: document.positionAt(startOffset),
								end: document.positionAt(i)
							});
							edits.push(edit);
						}
						// process the next line
						continue lineCheck;
					default:
						// non-whitespace encountered
						if (i !== startOffset || indentedLines[line]) {
							let edit = this.createFormattingEdit(document, startOffset, i, indentedLines[line], indentation);
							edits.push(edit);
						}
						// process the next line
						continue lineCheck;
				}
			}
			if (startOffset < content.length) {
				// only whitespace on the last line, trim it
				let edit = TextEdit.del({
					start: document.positionAt(startOffset),
					end: document.positionAt(content.length)
				});
				edits.push(edit);
			}
		}
		return edits;
	}

}
