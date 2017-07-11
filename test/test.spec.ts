import '../src';
import * as Joi from 'joi';
import { expect } from 'chai';

describe('joi-i18n', () => {
  describe('addLocaleData', () => {
    it('should throw error under invalid locale code', () => {
      expect(() => {
        Joi.addLocaleData('!!invalid_character!!', { errors: {} });
      }).to.throw('"locale" must only contain alpha-numeric and underscore characters');
    });

    it('should throw error under invalid language object', () => {
      expect(() => {
        Joi.addLocaleData('test_locale_1', { errors: null });
      }).to.throw('"errors" must be an object');
    });

    it('should throw error under invalid language error descriptor (number provided)', () => {
      expect(() => {
        Joi.addLocaleData('test_locale_2', { errors: { any: { base: 1 } } as any });
      }).to.throws(`"base" must be a string`);
    });

    it('should throw error under invalid language error descriptor (number provided for errors.key)', () => {
      expect(() => {
        Joi.addLocaleData('test_locale_3', { errors: { key: 1 } as any });
      }).to.throws(`"key" must be a string`);
    });

    it('should not throw error under valid arguments', () => {
      expect(() => {
        Joi.addLocaleData('test_locale_4', {
          errors: {
            any: {
              base: '!!Good',
              required: (error) => `It's OK to register a function`
            }
          }
        });
      }).to.not.throw();
    });
  });

  describe('validate', () => {
    before(() => {
      Joi.addLocaleData('ko_KR', {
        errors: {
          number: {
            base: (error) => `"${error.path}" 은(는) 숫자 형태여야 합니다`,
            required: '!!{{key}}가 정의되지 않았습니다.'
          }
        }
      });
      Joi.addLocaleData('custom_key_locale', {
        errors: {
          key: '[{{key}}] '
        }
      });
    })

    const schema = Joi.object({
      number: Joi.number().required(),
      string: Joi.string()
    });

    it('should format schema.validate() with valid locale option', () => {
      const { error } = schema.validate({ number: 'string' }, { locale: 'ko_KR' });
      expect(error).to.exist;
      expect(error).to.have.nested.property('details[0].message', `"number" 은(는) 숫자 형태여야 합니다`);
    });

    it('should format schema.options() with valid locale option', () => {
      const { error } = schema.options({ locale: 'ko_KR' }).validate({ number: 'string' });
      expect(error).to.exist;
      expect(error).to.have.nested.property('details[0].message', `"number" 은(는) 숫자 형태여야 합니다`);
    });

    it('should format Joi.validate() with valid locale option', () => {
      const { error } = Joi.validate({ number: 'string' }, schema, { locale: 'ko_KR' });
      expect(error).to.exist;
      expect(error).to.have.nested.property('details[0].message', `"number" 은(는) 숫자 형태여야 합니다`);
    });

    it('should format Joi.validate() to schema.options() with valid locale option', () => {
      const { error } = Joi.validate({ number: 'string' }, schema.options({ locale: 'ko_KR' }));
      expect(error).to.exist;
      expect(error).to.have.nested.property('details[0].message', `"number" 은(는) 숫자 형태여야 합니다`);
    });

    it('should format Joi.validate() with custom key option', () => {
      const { error } = Joi.validate({ number: 'string' }, schema.options({ locale: 'custom_key_locale' }));
      expect(error).to.exist;
      expect(error).to.have.nested.property('details[0].message', `[number] must be a number`);
    });

    before(() => Joi.setDefaultLocale('ko_KR'));
    after(() => Joi.setDefaultLocale(null));

    it('should format Joi.validate() over Joi.setDefaultLocale() first', () => {
      const { error } = schema.validate({ number: 'string' });
      expect(error).to.exist;
      expect(error).to.have.nested.property('details[0].message', `"number" 은(는) 숫자 형태여야 합니다`);
    });

    it('should format Joi.validate() over provided options.language object first', () => {
      const options = {
        language: {
          errors: { number: { base: '!!is it number?' } }
        }
      };
      const { error } = schema.validate({ number: 'string' }, options);
      expect(options).to.deep.equals({
        language: {
          errors: { number: { base: '!!is it number?' } }
        }
      });
      expect(error).to.exist;
      expect(error).to.have.nested.property('details[0].message', `is it number?`);
    });
  });
});
