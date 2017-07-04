import * as Joi from 'joi';
import { reach, assertWithSchema, overrideMethodProperty } from './utils';

const internals = {
  locales: {},
  defaultLocale: undefined
};

const schemas = {
  locale: Joi.string().label('locale'),
  addLocaleOptions: Joi.object({
    locale: Joi.lazy(() => schemas.locale).required(),
    language: Joi.object().required()
  }),
}

function addLocaleData(locale: string, language: object) {
  // assert arguments
  assertWithSchema({ locale, language }, schemas.addLocaleOptions);

  if (locale in internals.locales) {
    console.warn(`locale ${locale} is already registered! The previous data will be overrided.`)
  }

  internals.locales[locale] = language;
}

function setDefaultLocale(locale: string, supressWarning?: boolean) {
  if (locale === null) {
    // unset default locale
    delete internals.defaultLocale;
  } else {
    // assert arguments
    assertWithSchema(locale, schemas.locale);
    if (locale in internals.locales) {
      internals.defaultLocale = locale;
    } else if (!supressWarning) {
      console.error(`locale ${locale} is not registered! This operation will be igrnored.`)
    }
  }
}

function injectLocale() {
  if (Joi['_locales'] === undefined) {
    // add joi-i18n helper methods to the root Joi object
    (Joi as Partial<typeof Joi>).addLocaleData = addLocaleData;
    (Joi as Partial<typeof Joi>).setDefaultLocale = setDefaultLocale;

    // set default locales if available
    if (process !== undefined && typeof process.env.LANG === 'string') {
      Joi.setDefaultLocale.call(this, process.env.LANG.split('.', 1).shift(), true);
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
          const language = reach(this, `_settings.language.errors`) // use given settings first
            || reach(internals.locales, `${locale}.errors`); // use global locale settings second

          if (typeof language === 'object' && Object.keys(language).length > 0) {
            if (options && !options.language) {
              options = { ...options, language };
            }

            // wrap error processor using Joi.error method
            const mapValidationErrorItem = (error: Joi.ValidationErrorItem & { template?: any }) => {
              // map child error item
              if (error.context && Array.isArray(error.context.reason)) {
                error.context.reason = error.context.reason.map(mapValidationErrorItem);
              }

              // get template function or string
              const template = reach(language, error.type);
              if (typeof template === 'function') {
                error.message = template(error);
              } else if (typeof template === 'string') {
                error.template = template;
              }

              // return descriptor
              return error;
            };

            const wrappedSchema = this.error((errors) => errors.map(mapValidationErrorItem));
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
        assertWithSchema(locale, schemas.locale);

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
