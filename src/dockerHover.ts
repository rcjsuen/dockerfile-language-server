/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	TextDocument, TextDocumentPositionParams, Hover
} from 'vscode-languageserver';
import { KEYWORDS, DIRECTIVE_ESCAPE } from './docker';
import { MarkdownDocumentation } from './dockerMarkdown';

export class DockerHover {

	private markdown: MarkdownDocumentation;

	constructor(markdown: MarkdownDocumentation) {
		this.markdown = markdown;
	}

	onHover(document: TextDocument, textDocumentPosition: TextDocumentPositionParams): Hover {
		let buffer = document.getText();
		let tokenStart = 0;
		let tokenEnd = buffer.length;
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

		let offset = document.offsetAt(textDocumentPosition.position);

		startCheck: for (let i = offset; i >= 0; i--) {
			switch (buffer.charAt(i)) {
				case '\r':
				case '\n':
					tokenStart = i + 1;
					break startCheck;
				case '\t':
				case ' ':
					for (let j = i; j >= 0; j--) {
						switch (buffer.charAt(j)) {
							case '\r':
							case '\n':
								tokenStart = i + 1;
								break startCheck;
							case '\t':
							case ' ':
								continue;
							default:
								return null;
						}
					}
					tokenStart = i + 1;
					break startCheck;
			}
		}

		endCheck: for (let i = offset; i <= buffer.length; i++) {
			switch (buffer.charAt(i)) {
				case '\r':
				case '\n':
				case '\t':
				case ' ':
					tokenEnd = i;
					break endCheck;
			}
		}

		let target = buffer.substring(tokenStart, tokenEnd).toUpperCase();
		let markdown = this.markdown.getMarkdown(target);
		if (markdown) {
			markdown.range = {
				start: document.positionAt(tokenStart),
				end: document.positionAt(tokenEnd),
			};
		}
		return markdown;
	}
}
