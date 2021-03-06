import * as Joi from 'joi';

export function reach(target: object, path: string): any {
  for (const key of path.split('.')) {
    if (target && target[key] !== undefined) {
      target = target[key];
    } else {
      return;
    }
  }
  return target;
}

export function set<T extends object>(target: T, path: string, value: any): T {
  path.split('.').reduce((res, path, index, array) => {
    if (index === array.length - 1) {
      res[path] = value;
    } else {
      res[path] = typeof res[path] === 'object' ? res[path] : {};
    }
    return res[path];
  }, target);
  return target;
}

export function merge(target: object, source: object) {
  for (const key in source) {
    try {
      target[key] = typeof source[key] === 'object'
        ? { ...merge(target[key], source[key]) }
        : source[key];
    } catch (e) {
      target[key] = source[key];
    }
  }
  return target;
}

export function overrideMethodProperty(object: object, key: string, method: (superMethod: Function) => Function): void {
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  if (!descriptor) {
    throw new Error(`Cannot find property of "${key}"`);
  }

  const superMethod = descriptor.value;
  if (typeof superMethod !== 'function') {
    throw new Error(`"${key}" is not a method property!`);
  }

  Object.defineProperty(object, key, {
    ...descriptor,
    value: function overridedMethod() {
      return method.call(this, superMethod).apply(this, arguments);
    }
  });
}

export function assert(value: any, schema: Joi.Schema): void {
  const { error } = schema.validate(value);
  if (error) {
    throw new Error(error.details[0].message);
  }
}
