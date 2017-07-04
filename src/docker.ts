/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

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
}
