import '../src';
import * as Joi from 'joi';
import { expect } from 'chai';

describe('joi-i18n', () => {
  describe('addLocaleData', () => {
    it('should throw error under invalid locale code', () => {
      expect(() => {
        Joi.addLocaleData('!!invalid_character!!', { any: {} });
      }).to.throw('"locale" must only contain alpha-numeric and underscore characters');
    });

    it('should throw error under invalid language object', () => {
      expect(() => {
        Joi.addLocaleData('test_locale_1', { any: null });
      }).to.throw('"any" must be an object');
    });

    it('should throw error under invalid language error descriptor (number provided)', () => {
      expect(() => {
        Joi.addLocaleData('test_locale_2', { any: { base: 1 } as any });
      }).to.throws(`"base" must be a string`);
    });

    it('should throw error under invalid language error descriptor (number provided for errors.key)', () => {
      expect(() => {
        Joi.addLocaleData('test_locale_3', { key: 1 } as any);
      }).to.throws(`"key" must be a string`);
    });

    it('should not throw error under valid arguments', () => {
      expect(() => {
        Joi.addLocaleData('test_locale_4', {
          any: {
            base: '!!Good',
            required: (error) => `It's OK to register a function`
          }
        });
      }).to.not.throw();
    });
  });

  describe('validate', () => {
    before(() => {
      Joi.addLocaleData('ko_KR', {
        number: {
          base: (error) => `"${error.path}" 은(는) 숫자 형태여야 합니다`,
          required: '!!{{key}}가 정의되지 않았습니다.'
        },
        boolean: {
          base: '!!{{key}}는 boolean 형태로 제공해 주세요.'
        }
      });
      Joi.addLocaleData('custom_key_locale', {
        key: '[{{key}}] '
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

    it('should format Joi.validate() over provided options.language object first', () => {
      const options = {
        language: {
          number: { base: '!!is it number?' }
        }
      };
      const { error } = schema.validate({ number: 'string' }, options);
      expect(error).to.exist;
      expect(error).to.have.nested.property('details[0].message', `is it number?`);
    });

    it('should format Joi.validate() over child schema\'s options first', () => {
      const schema1 = Joi.object({
        boolean: Joi.boolean()
      });
      const { error: error1 } = schema1.validate({ boolean: 'string' });
      expect(error1).to.exist;
      expect(error1).to.have.nested.property('details[0].message')
        .that.equals(`"boolean" must be a boolean`)
        .and.not.equals(`is it boolean?`);

      const schema2 = Joi.object({
        boolean: Joi.boolean().options({
          language: {
            boolean: { base: '!!is it boolean?' }
          }
        })
      });
      const { error: error2 } = schema2.validate({ boolean: 'string' });
      expect(error2).to.exist;
      expect(error2).to.have.nested.property('details[0].message')
        .that.equals(`is it boolean?`)
        .and.not.equals(`"boolean" must be a boolean`);
    });

    it('should not mutate provided options object', () => {
      const options = {
        language: {
          number: { base: '!!is it number?' }
        }
      };
      schema.validate({}, options);
      expect(options).to.deep.equals({
        language: {
          number: { base: '!!is it number?' }
        }
      });
    });

    describe('setDefaultLocale', () => {
      before(() => Joi.setDefaultLocale('ko_KR'));
      after(() => Joi.setDefaultLocale(null));

      it('should throw error under invalid locale string', () => {
        expect(() => {
          Joi.setDefaultLocale('!@$%$')
        }).to.throw('"locale" must only contain alpha-numeric and underscore characters');
      });

      it('should format Joi.validate() over Joi.setDefaultLocale() first', () => {
        const { error } = schema.validate({ number: 'string' });
        expect(error).to.exist;
        expect(error).to.have.nested.property('details[0].message', `"number" 은(는) 숫자 형태여야 합니다`);
      });
    });
  });
});
