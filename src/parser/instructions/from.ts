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

	public getBuildStage(): string | null {
		let range = this.getBuildStageRange();
		return range === null ? null : this.getRangeContent(range);
	}

	public getBuildStageRange(): Range | null {
		let args = this.getArguments();
		if (args.length === 3 && args[1].getValue().toUpperCase() === "AS") {
			return args[2].getRange();
		}
		return null;
	}
}
