# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]

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

[Unreleased]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.1...v0.0.2
