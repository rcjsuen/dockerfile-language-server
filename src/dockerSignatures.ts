/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	TextDocument, Range, Position, SignatureHelp
} from 'vscode-languageserver';
import { Dockerfile } from './parser/dockerfile';
import { Instruction } from './parser/instruction';
import { Arg } from './parser/instructions/arg';
import { Copy } from './parser/instructions/copy';
import { Healthcheck } from './parser/instructions/healthcheck';
import { Shell } from './parser/instructions/shell';
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

		let signatureHelp = this.getInstructionSignatures(document, dockerfile.getInstructions(), position);
		if (!signatureHelp) {
			signatureHelp = this.getInstructionSignatures(document, dockerfile.getOnbuildTriggers(), position);
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

	private getInstructionSignatures(document: TextDocument, instructions: Instruction[], position: Position): SignatureHelp {
		for (let instruction of instructions) {
			if (!Util.isInsideRange(position, instruction.getRange())) {
				continue;
			} else if (Util.isInsideRange(position, instruction.getInstructionRange())) {
				return null;
			}

			switch (instruction.getKeyword()) {
				case "ARG":
					let argSignatureHelp: SignatureHelp = {
						signatures: [
							{
								label: "ARG name",
								documentation: this.documentation.getDocumentation("signatureArg_Signature0"),
								parameters: [
									{
										label: "name",
										documentation: this.documentation.getDocumentation("signatureArg_Signature0_Param")
									}
								]
							},
							{
								label: "ARG name=defaultValue",
								documentation: this.documentation.getDocumentation("signatureArg_Signature1"),
								parameters: [
									{
										label: "name",
										documentation: this.documentation.getDocumentation("signatureArg_Signature1_Param0")
									},
									{
										label: "defaultValue",
										documentation: this.documentation.getDocumentation("signatureArg_Signature1_Param1")
									}
								]
							}
						],
						activeSignature: 0,
						activeParameter: 0
					};

					let content = instruction.getTextContent();
					let index = content.indexOf('=');
					if (index !== -1) {
						argSignatureHelp = {
							signatures: [
								{
									label: "ARG name=defaultValue",
									documentation: this.documentation.getDocumentation("signatureArg_Signature1"),
									parameters: [
										{
											label: "name",
											documentation: this.documentation.getDocumentation("signatureArg_Signature1_Param0")
										},
										{
											label: "defaultValue",
											documentation: this.documentation.getDocumentation("signatureArg_Signature1_Param1")
										}
									]
								}
							],
							activeSignature: 0,
							activeParameter: 0
						};

						if (document.offsetAt(position) > document.offsetAt(instruction.getRange().start) + index) {
							argSignatureHelp.activeParameter = 1;
						}
					}
					return argSignatureHelp;
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
				case "SHELL":
					let shell = instruction as Shell;
					let shellSignatureHelp: SignatureHelp = {
						signatures: [
							{
								label: "SHELL [ \"executable\", \"parameter\", ... ]",
								documentation: this.documentation.getDocumentation("signatureShell"),
								parameters: [
									{
										label: "["
									},
									{
										label: "\"executable\"",
										documentation: this.documentation.getDocumentation("signatureShell_Param1")
									},
									{
										label: "\"parameter\"",
										documentation: this.documentation.getDocumentation("signatureShell_Param2")
									},
									{
										label: "...",
										documentation: this.documentation.getDocumentation("signatureShell_Param3")
									},
									{
										label: "]"
									}
								]
							}
						],
						activeSignature: 0,
						activeParameter: null
					};

					const closingBracket = shell.getClosingBracket();
					if (closingBracket) {
						let range = closingBracket.getRange();
						if (range.end.line === position.line && range.end.character === position.character) {
							shellSignatureHelp.activeParameter = 4;
							return shellSignatureHelp;
						} else if (closingBracket.isBefore(position)) {
							return null;
						}
					}

					const parameter = shell.getParameter();
					if (parameter && parameter.isBefore(position)) {
						shellSignatureHelp.activeParameter = 3;
						return shellSignatureHelp;
					}

					const executable = shell.getExecutable();
					if (executable && executable.isBefore(position)) {
						shellSignatureHelp.activeParameter = 2;
						return shellSignatureHelp;
					}

					const openingBracket = shell.getOpeningBracket();
					if (openingBracket) {
						let range = openingBracket.getRange();
						if ((range.end.line === position.line && range.end.character === position.character) || openingBracket.isBefore(position)) {
							shellSignatureHelp.activeParameter = 1;
							return shellSignatureHelp;
						}
					}

					shellSignatureHelp.activeParameter = 0;
					return shellSignatureHelp;
				case "STOPSIGNAL":
					return {
						signatures: [
							{
								label: "STOPSIGNAL signal",
								documentation: this.documentation.getDocumentation("signatureStopsignal"),
								parameters: [
									{
										label: "signal",
										documentation: this.documentation.getDocumentation("signatureStopsignal_Param")
									}
								]
							}
						],
						activeSignature: 0,
						activeParameter: 0
					};
				case "USER":
					let userSignatureHelp = {
						signatures: [
							{
								label: "USER user",
								documentation: this.documentation.getDocumentation("signatureUser_Signature0"),
								parameters: [
									{
										label: "user",
										documentation: this.documentation.getDocumentation("signatureUser_Signature0_Param")
									}
								]
							},
							{
								label: "USER user:group",
								documentation: this.documentation.getDocumentation("signatureUser_Signature1"),
								parameters: [
									{
										label: "user",
										documentation: this.documentation.getDocumentation("signatureUser_Signature1_Param0")
									},
									{
										label: "group",
										documentation: this.documentation.getDocumentation("signatureUser_Signature1_Param1")
									}
								]
							},
							{
								label: "USER uid",
								documentation: this.documentation.getDocumentation("signatureUser_Signature2"),
								parameters: [
									{
										label: "uid",
										documentation: this.documentation.getDocumentation("signatureUser_Signature2_Param")
									}
								]
							},
							{
								label: "USER uid:gid",
								documentation: this.documentation.getDocumentation("signatureUser_Signature3"),
								parameters: [
									{
										label: "uid",
										documentation: this.documentation.getDocumentation("signatureUser_Signature3_Param0")
									},
									{
										label: "gid",
										documentation: this.documentation.getDocumentation("signatureUser_Signature3_Param1")
									}
								]
							}
						],
						activeSignature: 0,
						activeParameter: 0
					};
					let userSeparatorIndex = instruction.getTextContent().indexOf(":");
					if (userSeparatorIndex !== -1) {
						userSignatureHelp = {
							signatures: [
								{
									label: "USER user:group",
									documentation: this.documentation.getDocumentation("signatureUser_Signature1"),
									parameters: [
										{
											label: "user",
											documentation: this.documentation.getDocumentation("signatureUser_Signature1_Param0")
										},
										{
											label: "group",
											documentation: this.documentation.getDocumentation("signatureUser_Signature1_Param1")
										}
									]
								},
								{
									label: "USER uid:gid",
									documentation: this.documentation.getDocumentation("signatureUser_Signature3"),
									parameters: [
										{
											label: "uid",
											documentation: this.documentation.getDocumentation("signatureUser_Signature3_Param0")
										},
										{
											label: "gid",
											documentation: this.documentation.getDocumentation("signatureUser_Signature3_Param1")
										}
									]
								}
							],
							activeSignature: 0,
							activeParameter: 0
						};
						
						if (document.offsetAt(position) > document.offsetAt(instruction.getRange().start) + userSeparatorIndex) {
							userSignatureHelp.activeParameter = 1;
						}
					}
					return userSignatureHelp;
				case "WORKDIR":
					return {
						signatures: [
							{
								label: "WORKDIR /the/workdir/path",
								documentation: this.documentation.getDocumentation("signatureWorkdir"),
								parameters: [
									{
										label: "/the/workdir/path",
										documentation: this.documentation.getDocumentation("signatureWorkdir_Param")
									}
								]
							}
						],
						activeSignature: 0,
						activeParameter: 0
					};
			}
		}
		return null;
	}
}