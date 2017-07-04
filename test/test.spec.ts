import '../src';
import * as Joi from 'joi';
import { expect } from 'chai';

describe('joi-i18n', () => {

  before(() => {
    Joi.addLocaleData('ko_KR', {
      errors: {
        number: {
          base: '은(는) 숫자 형태여야 합니다',
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

  it('schema.validate() with valid locale option', () => {
    const { error } = schema.validate({ number: 'string' }, { locale: 'ko_KR' });
    expect(error).to.exist;
    expect(error.details[0].message).to.equals(`"number" 은(는) 숫자 형태여야 합니다`);
  });

  it('schema.options() with valid locale option', () => {
    const { error } = schema.options({ locale: 'ko_KR' }).validate({ number: 'string' });
    expect(error).to.exist;
    expect(error.details[0].message).to.equals(`"number" 은(는) 숫자 형태여야 합니다`);
  });

  it('Joi.validate() with valid locale option', () => {
    const { error } = Joi.validate({ number: 'string' }, schema, { locale: 'ko_KR' });
    expect(error).to.exist;
    expect(error.details[0].message).to.equals(`"number" 은(는) 숫자 형태여야 합니다`);
  });

  it('Joi.validate() to schema.options() with valid locale option', () => {
    const { error } = Joi.validate({ number: 'string' }, schema.options({ locale: 'ko_KR' }));
    expect(error).to.exist;
    expect(error.details[0].message).to.equals(`"number" 은(는) 숫자 형태여야 합니다`);
  });

  it('Joi.validate() with custom key option', () => {
    const { error } = Joi.validate({ number: 'string' }, schema.options({ locale: 'custom_key_locale' }));
    expect(error).to.exist;
    expect(error.details[0].message).to.equals(`[number] must be a number`);
  });

  after(() => Joi.setDefaultLocale(null))
  it('Joi.validate() with Joi.setDefaultLocale()', () => {
    Joi.setDefaultLocale('ko_KR');
    const { error } = schema.validate({ number: 'string' });
    expect(error).to.exist;
    expect(error.details[0].message).to.equals(`"number" 은(는) 숫자 형태여야 합니다`);
  });
});
