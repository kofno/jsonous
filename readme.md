# jsonous

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

If you're building a web application, you're eventually going to need a reliable
way to convert JSON into type that you can use. `JSON.parse` will only get you
so far.

A better solution allows you to verify the structure of the source data while
converting it into the types you need to work with. It handles variations in
content structure. In a typed environment, it preserves your types so you don't
have to pass `any` types around. Errors are handled gracefully using a Result
type.

This library, heavily inspired by Elm's [JSON Decoder](http://package.elm-lang.org/packages/elm-lang/core/latest/Json-Decode), is just
such a solution.

# install

> npm install --save jsonous

> yarn add jsonous

# usage

## primitives

There are several decoders for handling JSON primitives; strings, numbers,
booleans, and arrays (more on objects later)

```typescript
string.decodeJson('"foo"'); // --> Ok("foo")
string.decodeJson('42'); // --> Err("42 is not a string")

number.decodeJson('42'); // --> Ok(42)
number.decodeJson('"foo"'); // --> Err("foo is not a number")

boolean.decodeJson('true'); // --> Ok(true)
boolean.decodeJson('"foo"'); // --> Err("foo is not a boolean")
```

## arrays

The array primitive applies another decoder to an array of values.

```typescript
array(string).decodeJson('["foo", "bar"]'); // --> Ok(["foo", "bar"])
array(string).decodeJson('["foo", 42]'); // --> Err("42 is not a string")
```

## objects

The `field` and `at` decoders are used to extract values from objects.

```typescript
field('bar', string).decodeAny({ bar: 'baz' }); // --> Ok('baz')
at(['foo', 0, 'bar'], number).decodeAny({ foo: [{ bar: 42 }] }); // --> Ok(42)
```

Object decoders can be chained together to build more complex data structures.

```typescript
// prettier-ignore
field('userId', number).andThen(id =>
field('emailAddress', string).andThen(email =>
succeed({ id, email })))
.decodeAny({ userId: 213, emailAddress: 'foo@example.com' })
// --> Ok({ id: 213, email: 'foo@example.com'})
```

Of course, your code editor may try to reformat this code.

```typescript
field('userId', number)
  .andThen((id) =>
    field('emailAddress', string).andThen((email) => succeed({ id, email }))
  )
  .decodeAny({ userId: 213, emailAddress: 'foo@example.com' });
// --> Ok({ id: 213, email: 'foo@example.com'})
```

For an object of any moderate complexity, this nesting is indistinguishable from
callback hell.

To combat this, decoders have a method named `assign`. It enacapsulates this
pattern of building objects such that objects can be built incrementally, without
nesting and without losing type safety.

The previous example would look like this using `assign`:

```typescript
succeed({})
  .assign('id', field('userId', number))
  .assign('email', field('emailAddress', string))
  .decodeAny({ userId: 213, emailAddress: 'foo@example.com' });
// --> Ok({ id: 213, email: 'foo@example.com' })
```

The best strategy for handling object construction with decoders
is to compose complex decoders from smaller, simpler decoders.

```typescript
succeed({})
  .assign('user', field('user', userDecoder))
  .assign('courses', at(['student', 'courses'], array(courseDecoder)))
  .decodeJson('... some json ... ')

const userDecoder = //...
const courseDecoder = //...
```

# docs

[API](https://kofno.github.io/jsonous)
