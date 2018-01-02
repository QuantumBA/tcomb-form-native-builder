[![Build Status](https://travis-ci.org/QuantumBA/tcomb-form-native-builder.svg?branch=master)](https://travis-ci.org/QuantumBA/tcomb-form-native-builder)
[![Coverage Status](https://coveralls.io/repos/github/QuantumBA/tcomb-form-native-builder/badge.svg?branch=master)](https://coveralls.io/github/QuantumBA/tcomb-form-native-builder?branch=master)

# tcomb-form-native-builder
Forms builder library for React Native

`tcomb-form-native-builder` offer a React Native component that allow to define
a full formulary using JSON to define its fields, validations and behaviour.

## install

```sh
npm install tcomb-form-native-builder
```

## Props

In addition to [tcomb-form-native](https://github.com/gcanti/tcomb-form-native)
[Form component](https://github.com/gcanti/tcomb-form-native#form-component)
props, it accept the next ones:

- **factories**: mapping object `name:Factory` of extra
  [tcomb-form-native factories](https://github.com/gcanti/tcomb-form-native#custom-factories)
  that will be possible to use in the form.
- **formats**: mapping object `name:validator` of extra
  [tcomb-json-schema formats](https://github.com/gcanti/tcomb-json-schema#registerformatformat-string-predicateortype-x-any--boolean--type-void)
that will be valid in `string` fields.
- **onSubmit**: callback function that will be called by a
  [submit component](https://github.com/QuantumBA/tcomb-form-native-builder-components#submit)
  after the form has been sucessfully send to the server.
- **options**: explicitly define
  [tcomb-form-native rendering options](https://github.com/gcanti/tcomb-form-native#rendering-options).
  Alternatively you can also define them in the form `type` description and they
  both will be merged.
- **type**: definition of the form fields. Alternatively, you can also set it as
  the JSX tag body. It can be a JSON string, a JSON object or a `tcomb`
  description object.
- **types**: mapping object `name:type` of extra
  [tcomb-json-schema types](https://github.com/gcanti/tcomb-json-schema#registertypetypename-string-type-tcomb-supported-types-void)
  that will be possible to use to define the form fields.

## Known bugs (aka *features*)

If no form description is given (both as prop or as child node), it creates by
default a single `Textbox` (type `string`, no format validation). This is
because we are not defining a structure (just a single value), nor we are
defining its type, so a generic one is being used. This behaviour is provided by
the [tcomb-json-schema](https://github.com/gcanti/tcomb-json-schema) module.
