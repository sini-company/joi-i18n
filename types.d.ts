declare module 'joi' {
  export interface ValidationOptions {
    /**
     * Use given locales provided via Joi.addLocale()
     *
     * @type {string}
     */
    locale?: string;
  }
  export function addLocaleData(locale: string, language: LanguageDescriptor);
  export function setDefaultLocale(locale: string);

  export type ErrorFormatFunction = (error: ValidationErrorItem) => string;
  export type ErrorTypeDescriptor = string | ErrorFormatFunction | {
    [key: string]: ErrorTypeDescriptor;
  };
  export type DefaultTypes = 'any' | 'alternatives' | 'array' | 'string' | 'number' | 'object' | 'boolean' | 'binary' | 'date' | 'function' | 'lazy';
  export type LanguageErrorsDescriptor = Partial<Record<DefaultTypes, ErrorTypeDescriptor>> & {
    [key: string]: ErrorTypeDescriptor
  };
  export type LanguageDescriptor = {
    errors?: LanguageErrorsDescriptor & {
      root?: string;
      key?: string;
      messages?: { wrapArrays?: boolean };
    };
    [key: string]: any;
  }
}

export * from 'joi';
