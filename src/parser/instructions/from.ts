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

	public getImage(): string {
		return this.getRangeContent(this.getImageRange());
	}

	/**
	 * Returns the name of the image that will be used as the base image.
	 * 
	 * @return the base image's name, or null if unspecified
	 */
	public getImageName(): string | null {
		let range = this.getImageRange();
		if (range) {
			let content = this.getRangeContent(range);
			let index = content.lastIndexOf(':');
			if (index === -1) {
				index = content.lastIndexOf('@');
			}
			return index === -1 ? content : content.substring(0, index);
		}
		return null;
	}

	/**
	 * Returns the range that covers the image argument of this
	 * instruction. This includes the tag or digest of the image if
	 * it has been specified by the instruction.
	 * 
	 * @return the range of the image argument, or null if no image
	 *         has been specified
	 */
	private getImageRange(): Range | null {
		let args = this.getArguments();
		return args.length !== 0 ? args[0].getRange() : null;
	}

	/**
	 * Returns the range in the document that the tag of the base
	 * image encompasses.
	 * 
	 * @return the base image's tag's range in the document, or null
	           * if no tag has been specified
	 */
	public getImageTagRange(): Range | null {
		let range = this.getImageRange();
		if (range) {
			let content = this.getRangeContent(range);
			if (content.indexOf('@') === -1) {
				let index = content.lastIndexOf(':');
				if (index !== -1) {
					return Range.create(range.start.line, range.start.character + index + 1, range.end.line, range.end.character);
				}
			}
		}
		return null;
	}

	/**
	 * Returns the range in the document that the digest of the base
	 * image encompasses.
	 * 
	 * @return the base image's digest's range in the document, or null
	 *         if no digest has been specified
	 */
	public getImageDigestRange(): Range | null {
		let range = this.getImageRange();
		if (range) {
			let content = this.getRangeContent(range);
			let index = content.lastIndexOf('@');
			if (index !== -1) {
				return Range.create(range.start.line, range.start.character + index + 1, range.end.line, range.end.character);
			}
		}
		return null;
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
