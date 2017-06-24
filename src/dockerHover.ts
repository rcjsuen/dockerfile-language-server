/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	TextDocument, TextDocumentPositionParams, Hover
} from 'vscode-languageserver';
import { Util, KEYWORDS, DIRECTIVE_ESCAPE } from './docker';
import { MarkdownDocumentation } from './dockerMarkdown';

export class DockerHover {

	private markdown: MarkdownDocumentation;

	constructor(markdown: MarkdownDocumentation) {
		this.markdown = markdown;
	}

	onHover(document: TextDocument, textDocumentPosition: TextDocumentPositionParams): Hover {
		let buffer = document.getText();
		let wordStart = 0;
		let wordEnd = buffer.length;
		if (textDocumentPosition.position.line === 0) {
			// might be hovering over the 'escape' directive
			directiveCheck: for (let i = 0; i < buffer.length; i++) {
				switch (buffer.charAt(i)) {
					case '#':
						let directive = "";
						for (let j = i + 1; j < buffer.length; j++) {
							let char = buffer.charAt(j);
							switch (char) {
								case ' ':
								case '\t':
									continue;
								case '\r':
								case '\n':
									break directiveCheck;
								default:
									if (char === '=') {
										if (directive === DIRECTIVE_ESCAPE) {
											return this.markdown.getMarkdown(DIRECTIVE_ESCAPE);
										}
									} else {
										directive = directive + char.toLowerCase();
									}
									break;
							}
						}
						break;
					case ' ':
					case '\t':
						continue;
					default:
						break directiveCheck;
				}
			}
		}

		let escapeChar = Util.getEscapeDirective(buffer);
		let offset = document.offsetAt(textDocumentPosition.position);
		let word = "";

		startCheck: for (let i = offset; i >= 0; i--) {
			let char = buffer.charAt(i);
			switch (char) {
				case '\r':
					if (buffer.charAt(i - 1) === escapeChar) {
						i--;
						continue;
					} else {
						wordStart = i + 1;
						break startCheck;
					}
				case '\n':
					char = buffer.charAt(i - 1);
					if (char === escapeChar) {
						i--;
						continue;
					} else if (char === '\r' && buffer.charAt(i - 2) === escapeChar) {
						i = i - 2;
						continue;
					} else {
						wordStart = i + 1;
						break startCheck;
					}
				case '\t':
				case ' ':
					let previousWord = "";
					for (let j = i; j >= 0; j--) {
						char = buffer.charAt(j);
						switch (char) {
							case '\r':
							case '\n':
								if (previousWord !== "" && previousWord !== "ONBUILD") {
									return null;
								}
								wordStart = i + 1;
								break startCheck;
							case '\t':
							case ' ':
								if (previousWord !== "" && previousWord !== "ONBUILD") {
									return null;
								}
								continue;
							default:
								previousWord = char.toUpperCase() + previousWord;
								continue;
						}
					}
					wordStart = i + 1;
					break startCheck;
				default:
					word = char + word;
					break;
			}
		}

		endCheck: for (let i = offset + 1; i <= buffer.length; i++) {
			let char = buffer.charAt(i);
			switch (char) {
				case escapeChar:
					char = buffer.charAt(i + 1);
					if (char === '\r') {
						i = buffer.charAt(i + 2) === '\n' ? i + 2 : i + 1;
					} else if (char === '\n') {
						i = i + 1;
					}
					break;
				case '\r':
				case '\n':
				case '\t':
				case ' ':
					wordEnd = i;
					break endCheck;
				default:
					word = word + char;
					break;
			}
		}

		let target = word.toUpperCase();
		let markdown = this.markdown.getMarkdown(target);
		if (markdown) {
			markdown.range = {
				start: document.positionAt(wordStart),
				end: document.positionAt(wordEnd),
			};
		}
		return markdown;
	}
}
