# joi-i18n

An i18n support mixins for [Joi](https://github.com/hapijs/joi) object validator.

[![Build Status](https://travis-ci.org/sini-company/joi-i18n.svg?branch=master)](https://travis-ci.org/sini-company/joi-i18n) [![Current Version](https://img.shields.io/npm/v/joi-i18n.svg?style=flat)](https://www.npmjs.com/package/joi-i18n)

## Usage
```js
import 'joi-i18n';
import * as Joi from 'joi';

// or just use this module as Joi
// import * as Joi from 'joi-i18n';

// or use require()
// const Joi = require('joi-i18n');

// add locale data
Joi.addLocaleData('en_US', {
  any: {
    // using joi's template syntax
    required: `!!oh no, "{{key}}" is required!!!`
  },
  object: {
    // using it's own joi error item formatter
    allowUnknown: (error) => `"${error.context.key}" is not allowed here!!`
  }
})

// prepare schema
const schema = Joi
  .object({ required: Joi.any().required() })
  .options({ abortEarly: false });

// validate object
const value = { unknown: 'unknown', required: undefined };
const { error } = schema.validate(value, { locale: 'en_US' });

// error.details:
// [
//   {
//     message: 'oh no, "required" is required!!!',
//     path: ['required'],
//     type: 'any.required',
//     context: { key: 'required' }
//   },
//   {
//     message: '"unknown" is not allowed here!!',
//     path: ['value'],
//     type: 'object.allowUnknown',
//     context: { child: 'unknown', key: 'value' }
//   }
// ]

```

## Methods

### `Joi.validate(value, schema, [options, [callback])`

Same with original [Joi.validate](
https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options-callback) except:
- `options` an optional object with same signature of original with an additional key:
  - `locale` a registered locale via [Joi#addLocaleData()](#joiaddlocaledatalocale-data)

### `Joi.addLocaleData(locale, language)`

Registers a new locale data where:

- `locale` a string represents a locale for given data
- `language` language configuration object that gets passed to the Joi's validate options.
(See [Joi#validate](https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options-callback) or [joi/lib/language.js](https://github.com/hapijs/joi/blob/master/lib/language.js) for more information.
  - it supports two type for descriptor value:
    - string that uses Joi's template syntax
    - formatter function that receives Joi's ValidationError item

### `Joi.getLocaleData([locale])`

Returns a registered locale data where:

- `[locale]` an optional string represents a locale to retrieve

### `Joi.setDefaultLocale(locale)`

A static method that will set default locale for every validate options where:

- `locale` a registered locale via [Joi#addLocaleData()](#joiaddlocaledatalocale-data)

### `Joi.getDefaultLocale()`

Returns a string represents registered default locale

### `Joi.formatErrorDetails(error, [locale])`

Returns a joi validation error item with locale formatted details where:

- `error` a Joi validation error object
- `[locale]` an optional string represents a locale to format

## Description

It overrides two internal methods of Joi's `Any` class prototype which are:

[`_valiateWithOptions(value, options, callback)`](https://github.com/hapijs/joi/blob/v10.6.0/lib/types/any/index.js#L643): the original **validate()** implementation with followings modifications:
- set [`options.language`](https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options-callback) property with provided locale via `Joi.addLocale(locale, language)`
- set [`schema.error(err)`](https://github.com/hapijs/joi/blob/master/API.md#anyerrorerr) handler to **format each single error items** before return result.

[`checkOptions(options)`](https://github.com/hapijs/joi/blob/v10.6.0/lib/types/any/index.js#L84): the original options argument validator
- Overrides internal validator to allow additional `{ locale: string }` property

**NOTE**
Since above two functions are designed for internal use, they might be changed.
So be careful to match joi's version with this module.

