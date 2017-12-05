[![Build Status](https://travis-ci.org/QuantumBA/tcomb-form-native-builder.svg?branch=master)](https://travis-ci.org/QuantumBA/tcomb-form-native-builder)
[![Coverage Status](https://coveralls.io/repos/github/QuantumBA/tcomb-form-native-builder/badge.svg?branch=master)](https://coveralls.io/github/QuantumBA/tcomb-form-native-builder?branch=master)

# tcomb-form-native-builder
Forms builder library for React Native

## Known bugs (aka *features*)

If no `type` is defined (both as property or as body), by default it creates a
single `Textbox` instead of an empty form. Seems to be a feature of
`tcomb-json-schema` or `tcomb-form-native` itself.
