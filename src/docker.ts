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

	/**
	 * Determines if the given position is contained within the given range.
	 * 
	 * @param position the position to check
	 * @param range the range to see if the position is inside of
	 */
	public static isInsideRange(position: Position, range: Range): boolean {
		return range != null &&
				range.start.line <= position.line &&
				position.line <= range.end.line &&
				range.start.character <= position.character &&
				position.character <= range.end.character;
	}
}
