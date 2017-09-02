/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { Range, Position } from 'vscode-languageserver';

export const KEYWORDS = [
	"ADD",
	"ARG",
	"CMD",
	"COPY",
	"ENTRYPOINT",
	"ENV",
	"EXPOSE",
	"FROM",
	"HEALTHCHECK",
	"LABEL",
	"MAINTAINER",
	"ONBUILD",
	"RUN",
	"SHELL",
	"STOPSIGNAL",
	"USER",
	"VOLUME",
	"WORKDIR"
];

export const DIRECTIVE_ESCAPE = "escape";

export class Util {
	public static isWhitespace(char: string): boolean {
		return char === ' ' || char === '\t' || Util.isNewline(char);
	}

	public static isNewline(char: string): boolean {
		return char === '\r' || char === '\n';
	}

	public static findLeadingNonWhitespace(content: string, escapeChar: string): number {
		whitespaceCheck: for (let i = 0; i < content.length; i++) {
			switch (content.charAt(i)) {
				case ' ':
				case '\t':
					continue;
				case escapeChar:
					for (let j = i + 1; j < content.length; j++) {
						switch (content.charAt(j)) {
							case ' ':
							case '\t':
								continue;
							case '\r':
								if (content.charAt(j + 1) === '\n') {
									i = j + 1;
									continue whitespaceCheck;
								}
							case '\n':
								i = j;
								continue whitespaceCheck;
							default:
								return i;
						}
					}
					return i;
				default:
					return i;
			}
		}
		// only possible if the content is the empty string
		return -1;
	}

	/**
	 * Determines if the given position is contained within the given range.
	 * 
	 * @param position the position to check
	 * @param range the range to see if the position is inside of
	 */
	public static isInsideRange(position: Position, range: Range): boolean {
		if (range === null) {
			return false;
		} else if (range.start.line === range.end.line) {
			return range.start.line === position.line
				&& range.start.character <= position.character
				&& position.character <= range.end.character;
		} else if (range.start.line === position.line) {
			return range.start.character <= position.character;
		} else if (range.end.line === position.line) {
			return position.character <= range.end.character;
		}
		return range.start.line < position.line && position.line < range.end.line;
	}

	public static rangeEquals(range: Range, range2: Range) {
		return Util.positionEquals(range.start, range2.start) && Util.positionEquals(range.end, range2.end);
	}

	public static positionEquals(position: Position, position2: Position) {
		return position.line == position2.line && position.character === position2.character;
	}

	public static positionBefore(origin: Position, other: Position) {
		if (origin.line < other.line) {
			return true;
		} else if (origin.line > other.line) {
			return false;
		}
		return origin.character < other.character;
	}
}
