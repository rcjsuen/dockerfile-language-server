# Changelog
All notable changes to this project will be documented in this file.

## [0.0.10] - 2017-10-23
### Added
- textDocument/codeAction
  - create docker.command.flagToChown to convert an unknown ADD or COPY flag to a --chown ([#187](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/187))
### Fixed
- use a reasonable range for the diagnostic if an unknown flag has no name ([#186](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/186))
- specify a section name when sending a workspace/configuration request ([#182](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/182))

## [0.0.9] - 2017-10-14
### Added
- settings
  - docker.languageserver.diagnostics.emptyContinuationLine? ([#177](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/177))
    - value = ( "ignore" | "warning" | "error" )
    - toggles the diagnostic severity if empty continuation lines are found
- textDocument/publishDiagnostics
  - warn about empty continuation lines ([#177](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/177))
  - warn if ADD does not have two arguments ([#185](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/185))

### Fixed
- allow parameters to be suggested even if an ARG has no variables defined ([#184](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/184))
- do not assume that clients support workspace/applyEdit ([#183](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/183))
- fix broken socket support ([#178](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/178))

## [0.0.8] - 2017-10-05
### Added
- textDocument/codeAction
  - create commands for converting unknown HEALTHCHECK flags ([#172](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/172))
    - docker.command.flagToHealthcheckInterval
    - docker.command.flagToHealthcheckRetries
    - docker.command.flagToHealthcheckStartPeriod
    - docker.command.flagToHealthcheckTimeout
  - create docker.command.flagToCopyFrom to convert an unknown COPY flag ([#171](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/171))
- textDocument/completion
  - HEALTHCHECK's CMD and NONE arguments ([#169](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/169))
  - ADD and COPY's --chown flag ([#166](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/166))
- textDocument/publishDiagnostics
  - warn if HEALTHCHECK's argument is not CMD or NONE ([#173](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/173))
  - warn if HEALTHCHECK has a flag but no arguments ([#174](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/174))
  - validate --chown flag in ADD and COPY ([#166](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/166))
- textDocument/signatureHelp
  - update ADD's signature to support the new --chown flag ([#166](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/166))
- workspace/configuration
  - implemented support to allow validator settings to not be global ([#179](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/179))

### Fixed
- correct the documentation of HEALTHCHECK's --retries flag's completion item ([#170](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/170))
- show correct parameter in HEALTHCHECK's signature help if it has an escaped newline ([#175](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/175))
- show correct parameter in ENV and LABEL's signature help if it has an escaped newline ([#176](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/176))

## [0.0.7] - 2017-09-09
### Added
- textDocument/completion
  - COPY's --from build stage flag ([#148](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/148))
  - add '-' as a trigger character to suggest instruction flags ([#155](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/155))
  - suggest image tags in FROM instructions ([#154](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/154))
  - set source image as suggested build stage's documentation text ([#159](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/159))
  - suggest numeric build stage index if source image is unnamed ([#160](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/160))
- textDocument/hover
  - COPY's --from build stage flag ([#150](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/150))
- textDocument/publishDiagnostics
  - warn if ENV or LABEL is missing closing quote ([#143](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/143))
  - warn if FROM's build stage name is invalid ([#132](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/132))
  - warn if an invalid unit of time is used in a duration flag ([#152](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/152))
  - warn if COPY does not have two arguments ([#157](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/157))
- textDocument/signatureHelp
  - escape parser directive ([#147](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/147))
  - instruction flags ([#147](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/147))
    - COPY's --from
    - HEALTHCHECK CMD flags
  - instructions ([#162](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/162))

### Fixed
- correct handling of escaped quotes in ENV variables ([#144](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/144))
- include escape character in value of single quoted ENV variables ([#146](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/146))
- ignore whitespace that precedes an escaped newline in ENV variables ([#147](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/147))
- fix handling of escape characters in SHELL's JSON strings ([#151](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/151))
- do not suggest duplicated build stage names as completion items ([#156](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/156))
- only suggest build stages that come after the current COPY line ([#158](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/158))
- restrict operations on ARG and ENV variables to a build stage ([#163](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/163))
- make FROM variables only interact with the initial set of ARG instructions ([#153](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/153))
- skip validation of nested comments in escaped newlines of ENV and LABEL instructions ([#167](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/167))
- prevent hovers from rendering nested comments for ARG and ENV instructions ([#168](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/168))

## [0.0.6] - 2017-08-12
### Added
- textDocument/completion
  - suggest completion items even if the prefix string's case does not match ([#142](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/142))
- textDocument/publishDiagnostics
  - warn about duplicated build stage names ([#133](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/133))

### Fixed
- fix completion handling so that the escape parser directive is suggested in more cases ([#138](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/138))
- always use the first declaration of a variable for its definition ([#141](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/141))
- highlight ARG variables that get declared again ([#140](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/140))

## [0.0.5] - 2017-08-07
### Fixed
- do not show arguments if snippets are not supported ([#136](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/136))
- show only one ARG completion item if snippets are not supported ([#137](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/137))

## [0.0.4] - 2017-08-06
### Fixed
- created actual docker-langserver file instead of referencing server.js ([#134](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/134))

## [0.0.3] - 2017-08-06
### Added
- created a docker-langserver binary for launching the server ([#134](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/134))
- textDocument/codeAction
  - created docker.command.convertToLowercase for directives not written in lowercase ([#128](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/128))
- textDocument/onTypeFormatting
  - format the next line if an escape character is inserted ([#130](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/130))
- textDocument/publishDiagnostics
  - validate the syntax of LABEL instructions ([#100](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/100))
  - warn if invalid ONBUILD trigger instructions are used ([#117](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/117))
  - warn if ENV/LABEL instructions have a blank name ([#122](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/122))
  - EXPOSE
    - warn if an invalid protocol is specified ([#126](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/126))
  - SHELL
    - check that SHELL instructions are written as a JSON array ([#92](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/92))
    - warn if SHELL's JSON array is empty ([#122](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/122))
- workspace/executeCommand
  - handle docker.command.convertToLowercase and convert the string in the range to lowercase ([#128](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/128))

### Fixed
- fixed parsing of escaped whitespace values in ENV instructions ([#115](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/115))
- prevent undeclared variables from being suggested as completion items ([#118](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/118))
- prevent completion items from being suggested in multiline instructions ([#125](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/125))
- handle TCP and UDP in an EXPOSE instruction's argument ([#123](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/123))
- only search for parser directives at the top of a Dockerfile ([#129](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/129))
- fix handling of escape characters nested in an instruction ([#131](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/131))

## [0.0.2] - 2017-07-31
### Added
- settings
  - docker.languageserver.diagnostics.instructionCmdMultiple? ([#81](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/81))
    - value = ( "ignore" | "warning" | "error" )
    - toggles the diagnostic severity if multiple CMD instructions are found in the Dockerfile
  - docker.languageserver.diagnostics.instructionEntrypointMultiple? ([#90](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/90))
    - value = ( "ignore" | "warning" | "error" )
    - toggles the diagnostic severity if multiple ENTRYPOINT instructions are found in the Dockerfile
  - docker.languageserver.diagnostics.instructionHealthcheckMultiple? ([#80](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/80))
    - value = ( "ignore" | "warning" | "error" )
    - toggles the diagnostic severity if multiple HEALTHCHECK instructions are found in the Dockerfile
- textDocument/completion
  - suggest build stage names in a COPY instruction ([#44](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/44))
  - add '=' as a trigger character
  - include the --start-period flag in HEALTHCHECK CMD items ([#78](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/78))
  - HEALTHCHECK CMD flags ([#69](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/69), [#101](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/101))
  - suggest $ variables ([#93](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/93))
    - ARG and ENV variables
    - default Docker ARG variables 
    - add '$' as a trigger character 
- textDocument/hover
  - HEALTHCHECK CMD flags ([#82](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/82), [#104](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/104))
- textDocument/publishDiagnostics
  - check the spelling of instruction flags ([#75](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/75))
    - COPY's from
    - HEALTHCHECK's interval, retries, start-period, timeout
  - multiple instructions found when only one allowed
    - CMD ([#81](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/81))
    - ENTRYPOINT ([#90](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/90))
    - HEALTHCHECK ([#80](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/80))
  - check that the same flag is not used twice ([#83](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/83))
    - COPY's from
    - HEALTHCHECK's interval, retries, start-period, timeout
  - check that flags have a value defined ([#91](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/91))
    - COPY's from
    - HEALTHCHECK's interval, retries, start-period, timeout
  - HEALTHCHECK
    - warn if arguments follow a HEALTHCHECK NONE ([#84](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/84))
    - warn if the retries flag doesn't specify a number ([#85](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/85))
    - warn if the retries flag is not a positive intger ([#89](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/89))
    - warn if no arguments follow a HEALTHCHECK CMD ([#96](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/96))
    - warn if duration flags are invalid ([#87](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/87))
    - warn if duration flags do not specify a duration ([#86](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/86))
    - warn if duration flags are too short ([#97](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/97))
  - ONBUILD
    - trigger instruction not written in uppercase ([#102](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/102))
    - create diagnostics for validating trigger instructions' content ([#112](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/112))
- created a CHANGELOG.md file to document the project's changes ([#77](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/77))

### Fixed
- fixed a typo in completion items for WORKDIR ([#76](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/76))
- fixed a parsing problem with ENV variables and escaped characters ([#94](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/94))
- fixed CMD validation to not warn even if there are no arguments ([#98](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/98s))
- fixed code actions to return something if a diagnostic's code is a string and not a number  ([#99](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/99))
- fixed hovers not working for ONBUILD triggers that are not written in uppercase ([#103](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/103))

## 0.0.1 - 2017-07-16
### Added
- textDocument/didChange
  - incremental document synchronization
- textDocument/publishDiagnostics
  - instructions not written in uppercase
  - directives not written in lowercase
  - missing or incorrect number of expected of arguments to an instruction
  - invalid escape parser directive value
  - EXPOSE
    - invalid container port
  - FROM
    - no FROM instruction found
    - having a second argument not equal to the AS keyword
  - STOPSIGNAL
    - invalid stop signal definition
- textDocument/codeAction
  - convert instruction to uppercase
  - remove extra argument to instruction
  - convert invalid escape directive to backslash
  - convert invalid escape directive to backtick
  - convert second argument of FROM to AS
- textDocument/completion
  - snippets support
  - instructions
  - escaper parser directive
  - ONBUILD trigger instructions
- completionItem/resolve
  - provide documentation information
- textDocument/hover
  - instructions
  - escape parser directive
  - ONBUILD trigger instructions
  - ARG and ENV variables
- textDocument/documentHighlight
  - ARG and ENV variables
  - FROM and COPY build stages
- textDocument/rename
  - ARG and ENV variables
  - FROM and COPY build stages
- textDocument/definition
  - ARG and ENV variables
  - FROM and COPY build stages
- textDocument/documentSymbol
  - instructions
  - escape parser directive
- textDocument/formatting
- textDocument/rangeFormatting

[Unreleased]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.10...HEAD
[0.0.10]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.9...v0.0.10
[0.0.9]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.8...v0.0.9
[0.0.8]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.7...v0.0.8
[0.0.7]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.1...v0.0.2
