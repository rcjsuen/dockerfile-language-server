/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	TextDocument, Position, SignatureHelp
} from 'vscode-languageserver';
import { Dockerfile } from './parser/dockerfile';
import { Instruction } from './parser/instruction';
import { Copy } from './parser/instructions/copy';
import { Healthcheck } from './parser/instructions/healthcheck';
import { PlainTextDocumentation } from './dockerPlainText';
import { DockerfileParser } from './parser/dockerfileParser';
import { Util, DIRECTIVE_ESCAPE } from './docker';
import { ValidatorSettings } from './dockerValidatorSettings';

export class DockerSignatures {

	private documentation = new PlainTextDocumentation();

	public computeSignatures(document: TextDocument, position: Position): SignatureHelp {
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		if (position.line === 0) {
			let directive = dockerfile.getDirective();
			if (directive !== null && directive.getDirective() === DIRECTIVE_ESCAPE) {
				return {
					signatures: [
						{
							label: "escape=`\\`",
							documentation: this.documentation.getDocumentation("signatureEscape"),
							parameters: [
								{
									label: "\\",
									documentation: this.documentation.getDocumentation("signatureEscape_Param")
								}
							]
						}
					],
					activeSignature: 0,
					activeParameter: 0
				}
			}
		}

		let signatureHelp = this.getInstructionSignatures(dockerfile.getInstructions(), position);
		if (!signatureHelp) {
			signatureHelp = this.getInstructionSignatures(dockerfile.getOnbuildTriggers(), position);
			if (!signatureHelp) {
				signatureHelp = {
					signatures: [],
					activeSignature: null,
					activeParameter: null
				};
			}
		}

		return signatureHelp;
	}

	private getInstructionSignatures(instructions: Instruction[], position: Position): SignatureHelp {
		for (let instruction of instructions) {
			switch (instruction.getKeyword()) {
				case "COPY":
					let flag = (instruction as Copy).getFromFlag();
					if (flag !== null) {
						let range = flag.getValueRange();
						if (range !== null && Util.isInsideRange(position, range)) {
							return {
								signatures: [
									{
										label: "--from=stage",
										documentation: this.documentation.getDocumentation("signatureCopyFlagFrom"),
										parameters: [
											{
												label: "stage",
												documentation: this.documentation.getDocumentation("signatureCopyFlagFrom_Param")
											}
										]
									}
								],
								activeSignature: 0,
								activeParameter: 0
							}
						}
					}
					break;
				case "HEALTHCHECK":
					let flags = (instruction as Healthcheck).getFlags();
					for (let flag of flags) {
						let range = flag.getValueRange();
						if (range !== null && Util.isInsideRange(position, range)) {
							switch (flag.getName()) {
								case "interval":
									return {
										signatures: [
											{
												label: "HEALTHCHECK --interval=30s ...",
												documentation: this.documentation.getDocumentation("signatureHealthcheck"),
												parameters: [
													{
														label: "30s",
														documentation: this.documentation.getDocumentation("signatureHealthcheckFlagInterval_Param")
													}
												]
											}
										],
										activeSignature: 0,
										activeParameter: 0
									}
								case "retries":
									return {
										signatures: [
											{
												label: "HEALTHCHECK --retries=3 ...",
												documentation: this.documentation.getDocumentation("signatureHealthcheck"),
												parameters: [
													{
														label: "3",
														documentation: this.documentation.getDocumentation("signatureHealthcheckFlagRetries_Param")
													}
												]
											}
										],
										activeSignature: 0,
										activeParameter: 0
									}
								case "start-period":
									return {
										signatures: [
											{
												label: "HEALTHCHECK --start-period=5s ...",
												documentation: this.documentation.getDocumentation("signatureHealthcheck"),
												parameters: [
													{
														label: "5s",
														documentation: this.documentation.getDocumentation("signatureHealthcheckFlagStartPeriod_Param")
													}
												]
											}
										],
										activeSignature: 0,
										activeParameter: 0
									}
								case "timeout":
									return {
										signatures: [
											{
												label: "HEALTHCHECK --timeout=30s ...",
												documentation: this.documentation.getDocumentation("signatureHealthcheck"),
												parameters: [
													{
														label: "30s",
														documentation: this.documentation.getDocumentation("signatureHealthcheckFlagTimeout_Param")
													}
												]
											}
										],
										activeSignature: 0,
										activeParameter: 0
									}
							}
						}
					}
					break;
			}
		}
		return null;
	}
}