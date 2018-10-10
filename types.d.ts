declare module 'joi' {
  export interface ValidationOptions {
    /**
     * Use given locales provided via Joi.addLocale()
     *
     * @type {string}
     */
    locale?: string;
  }
  export function addLocaleData(locale: string, language: LanguageDescriptor): void;
  export function getLocaleData(locale?: string): LanguageDescriptor;
  export function setDefaultLocale(locale: string): void;
  export function getDefaultLocale(): string;
  export function formatErrorDetails(error: ValidationError, locale?: string): ValidationError;

  export type ErrorFormatFunction = (error: ValidationErrorItem) => string;
  export type ErrorTypeDescriptor = string | boolean | ErrorFormatFunction | {
    [key: string]: ErrorTypeDescriptor;
  };
  export type LanguageDescriptor = Partial<Record<Types, ErrorTypeDescriptor>> & {
    root?: string;
    key?: string;
    messages?: { wrapArrays?: boolean; };
    [key: string]: ErrorTypeDescriptor
  };
}

export * from 'joi';
