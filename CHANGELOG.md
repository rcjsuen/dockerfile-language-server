# Changelog
All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
  - textDocument/completion
    - suggest build stage names in a COPY instruction ([#44](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/44))
    - add '=' as a trigger character
    - include the --start-period flag in HEALTHCHECK CMD items ([#78](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/78))
    - HEALTHCHECK CMD flags ([#69](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/69))
  - textDocument/hover
    - HEALTHCHECK CMD flags ([#82](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/82))
  - textDocument/publishDiagnostics
    - check the spelling of instruction flags
      - COPY's from
      - HEALTHCHECK's interval, retries, start-period, timeout
  - created a CHANGELOG.md file to document the project's changes ([#77](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/77))

### Fixed
  - fixed a typo in completion items for WORKDIR ([#76](https://github.com/rcjsuen/dockerfile-language-server-nodejs/issues/76))

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

[Unreleased]: https://github.com/rcjsuen/dockerfile-language-server-nodejs/compare/v0.0.1...HEAD
