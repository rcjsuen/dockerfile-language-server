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

	public static getEscapeDirective(buffer: string): string {
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
								if (directive.toLowerCase() === DIRECTIVE_ESCAPE) {
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
												if (k + 1 !== buffer.length && Util.isWhitespace(buffer.charAt(k + 1))) {
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
}
