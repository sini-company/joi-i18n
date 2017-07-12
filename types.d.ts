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
  export type ErrorTypeDescriptor = string | boolean | ErrorFormatFunction | {
    [key: string]: ErrorTypeDescriptor;
  };
  export type DefaultTypes = 'any' | 'alternatives' | 'array' | 'string' | 'number' | 'object' | 'boolean' | 'binary' | 'date' | 'function' | 'lazy';
  export type LanguageDescriptor = Partial<Record<DefaultTypes, ErrorTypeDescriptor>> & {
    root?: string;
    key?: string;
    messages?: { wrapArrays?: boolean; };
    [key: string]: ErrorTypeDescriptor
  };
}

export * from 'joi';
