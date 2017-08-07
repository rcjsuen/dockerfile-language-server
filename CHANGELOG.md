# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]
### Fixed
- fix completion handling so that the escape parser directive is suggested in more cases ([#138](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/138))
- always use the first declaration of a variable for its definition ([#141](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/141))

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

[Unreleased]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.5...HEAD
[0.0.5]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.1...v0.0.2
