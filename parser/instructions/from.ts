/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Instruction } from '../instruction';

export class From extends Instruction {

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
	}

	public getBuildStage(): string {
		let range = this.getBuildStageRange();
		if (range === null) {
			return null;
		}
		return this.document.getText().substring(this.document.offsetAt(range.start), this.document.offsetAt(range.end));
	}

	public getBuildStageRange(): Range {
		let args = this.getArgments();
		if (args.length === 3 && args[1].getValue().toUpperCase() === "AS") {
			return args[2].getRange();
		}
		return null;
	}
}
