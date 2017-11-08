import * as Joi from 'joi';
import { reach, assert, merge, overrideMethodProperty } from './utils';

namespace Schemas {
  export const locale = Joi.string().token().allow(null).label('locale');
  export const errorDescriptor = Joi.alternatives().try([
    Joi.string().allow(null),
    Joi.func(),
    Joi.object().pattern(/.+/, Joi.lazy(() => errorDescriptor).required()),
  ]).label('descriptor');
  export const addLocaleOptions = Joi.object({
    locale: locale.required(),
    language: Joi.object({
      root: Joi.string(),
      key: Joi.string(),
      message: Joi.object({
        wrapArrays: Joi.boolean()
      })
    }).pattern(/.+/, Joi.object().pattern(/.+/, errorDescriptor.required()))
      .required()
  }).label('options');
}

const internals = {
  locales: {},
  defaultLocale: undefined
};

function addLocaleData(locale: string, language: Joi.LanguageRootOptions) {
  // assert arguments
  assert({ locale, language }, Schemas.addLocaleOptions);

  if (locale in internals.locales) {
    console.warn(`locale ${locale} is already registered! The previous data will be overrided.`)
  }

  internals.locales[locale] = language;
}

function getLocaleData(locale: string = internals.defaultLocale): Joi.LanguageRootOptions {
  return internals.locales[locale];
}

function setDefaultLocale(locale: string, supressWarning?: boolean): void {
  if (locale === null) {
    // unset default locale
    delete internals.defaultLocale;
  } else {
    // assert arguments
    assert(locale, Schemas.locale);
    if (locale in internals.locales) {
      internals.defaultLocale = locale;
    } else if (!supressWarning) {
      console.warn(`locale ${locale} is not registered! This operation will be igrnored.`)
    }
  }
}

function getDefaultLocale(): string {
  return internals.defaultLocale;
}

function injectLocale() {
  if (Joi['_locales'] === undefined) {
    // set locales data
    Joi['_locales'] = internals.locales;

    // add joi-i18n helper methods to the root Joi object
    (Joi as Partial<typeof Joi>).addLocaleData = addLocaleData;
    (Joi as Partial<typeof Joi>).setDefaultLocale = setDefaultLocale;

    // set default locales if available
    if (process !== undefined && typeof process.env.LANG === 'string') {
      Joi.setDefaultLocale.call(this, process.env.LANG.split('.', 1).shift(), true);
    }

    if (typeof process !== 'undefined' && typeof process.env.LANG === 'string') {
      Joi.setDefaultLocale.call(this, process.env.LANG.split('.', 1).shift(), true);
    } else if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
      Joi.setDefaultLocale.call(this, navigator.language);
    }

    // extract prototype of Joi.Any
    const anyPrototype = Object.getPrototypeOf(Joi.any());

    // override internal _validateWithOptions of Joi.Any
    overrideMethodProperty(anyPrototype, '_validateWithOptions', (superMethod) => {
      return function validateWrapper(this: Joi.Schema, value: any, options: Joi.ValidationOptions, callback: Function) {
        // get locale from options and remove from options
        const locale = reach(options, 'locale') || reach(this, '_settings.locale') || internals.defaultLocale;

        // override locale wrapper if exists
        if (locale && locale in internals.locales) {
          // pick language from global locale or validator._settings
          const localizations = reach(this, `_settings.language`) // use given settings first
            || reach(internals.locales, locale); // use global locale settings second

          if (typeof localizations === 'object' && Object.keys(localizations).length > 0) {
            if (options) {
              options = {
                ...options,
                language: options.language ? merge({
                  key: localizations.key,
                  root: localizations.root,
                  messages: localizations.messages
                }, options.language) : localizations
              };
            }

            // wrap error processor using Joi.error method
            const mapValidationErrorItem = (error: Joi.ValidationErrorItem & { template?: any }) => {
              // map child error item
              if (error.context && Array.isArray(error.context.reason)) {
                error.context.reason = error.context.reason.map(mapValidationErrorItem);
              }

              // get template function or string
              const template = reach(error.options, `language.${error.type}`)
                || reach(options, `language.${error.type}`)
                || reach(localizations, error.type);
              if (typeof template === 'function') {
                error.message = template(error);
              } else if (typeof template === 'string') {
                error.template = template;
              }

              // return descriptor
              return error;
            };

            // create error-handler wrapped schema
            const wrappedSchema = this.error((errors) => errors.map(mapValidationErrorItem));

            // return wrapped-schema validator result
            return superMethod.call(wrappedSchema, value, options, callback);
          }
        } else if (locale !== internals.defaultLocale) {
          console.error(`locale ${locale} is not registered! Given option will be ignored.`)
        }

        // call the original validate func
        return superMethod.call(this, value, options, callback);
      };
    });

    // override internal checkOptions of Joi.Any
    overrideMethodProperty(anyPrototype, 'checkOptions', (superMethod) => {
      return function checkOptionsWrapper({ locale, ...options }: Joi.ValidationOptions = {}) {
        // assert arguments
        assert(locale, Schemas.locale);

        // validate option using original checkOptions
        return superMethod.call(this, options);
      }
    })
  }

  // return Joi itself
  return Joi;
}

// export injected Joi
export = injectLocale();
