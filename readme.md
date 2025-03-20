# Jsonous: Type-Safe JSON Decoding for JavaScript and TypeScript

Jsonous is a powerful library designed to bring type safety and robustness to JSON decoding in JavaScript and TypeScript applications. Inspired by Elm's renowned JSON decoders, Jsonous provides a declarative and composable way to parse and validate JSON data, ensuring that it conforms to your application's expected structure and types.

## The Problem: Untrusted JSON Data

When working with JSON data from external sources (APIs, user input, etc.), you're often dealing with untrusted data. `JSON.parse` alone is insufficient because it only checks for valid JSON syntax, not the structure or types of the data within. This can lead to runtime errors, unexpected behavior, and security vulnerabilities.

## The Jsonous Solution: Declarative and Type-Safe Decoding

Jsonous solves these problems by providing:

- **Type Safety:** Define decoders that enforce the expected types of your data, preventing type-related errors.
- **Structure Validation:** Ensure that the JSON data conforms to the expected structure, including nested objects and arrays.
- **Error Handling:** Gracefully handle decoding failures with detailed error messages, making debugging easier.
- **Composability:** Build complex decoders from simpler ones, creating a modular and maintainable decoding system.
- **Declarative Approach:** Define _what_ you expect from the data, not _how_ to parse it.

## Installation

```bash
npm install --save jsonous
# or
yarn add jsonous
```

## Core Concepts

1. Decoders
   At the heart of Jsonous are decoders. A decoder is a function that takes a value (typically from parsed JSON) and attempts to convert it into a specific type. If the value conforms to the expected type and structure, the decoder succeeds and returns the value. Otherwise, it fails and returns an error message.

2. Result Type
   Jsonous uses the Result type (from the resulty library) to represent the outcome of a decoding operation. A Result can be either:

Ok(value): Indicates successful decoding, containing the decoded value.
Err(message): Indicates a decoding failure, containing an error message. 3. Composable Decoders
Jsonous provides a rich set of primitive decoders and powerful combinators that allow you to build complex decoders from simpler ones. This composability is key to handling real-world JSON structures.

## Usage Examples

### Primitive Decoders

Jsonous provides decoders for common JSON primitives:

```typescript
import { string, number, boolean, stringLiteral, succeed, fail } from 'jsonous';
import { Result } from 'resulty';

// Decoding strings
const stringResult: Result<string, string> = string.decodeJson('"foo"'); // Ok("foo")
const stringError: Result<string, string> = string.decodeJson('42'); // Err("I expected to find a string but instead I found 42")

// Decoding numbers
const numberResult: Result<string, number> = number.decodeJson('42'); // Ok(42)
const numberError: Result<string, number> = number.decodeJson('"foo"'); // Err("I expected to find a number but instead I found \"foo\"")

// Decoding booleans
const booleanResult: Result<string, boolean> = boolean.decodeJson('true'); // Ok(true)
const booleanError: Result<string, boolean> = boolean.decodeJson('"foo"'); // Err("I expected to find a boolean but instead found \"foo\"")

// Decoding string literals
const helloResult: Result<string, 'hello'> = stringLiteral('hello').decodeJson('"hello"'); // Ok("hello")
const helloError: Result<string, 'hello'> = stringLiteral('hello').decodeJson('"world"'); // Err("Expected hello but got \"world\"")

// Succeed and fail
const succeedResult: Result<string, number> = succeed(42).decodeAny('anything'); // Ok(42)
const failResult: Result<string, number> = fail('oops').decodeAny('anything'); // Err("oops")
```

### Array Decoder

The array decoder applies another decoder to each element of a JSON array:

```typescript
import { array, string } from 'jsonous';
import { Result } from 'resulty';

const stringArrayResult: Result<string, string[]> =
  array(string).decodeJson('["foo", "bar", "baz"]'); // Ok(["foo", "bar", "baz"])
const stringArrayError: Result<string, string[]> = array(string).decodeJson('["foo", 42, "baz"]'); // Err("I expected to find a string but instead I found 42:\nerror found in an array at [1]")
```

### Object Decoders: field and at

The field and at decoders are used to extract values from JSON objects:

```typescript
import { field, at, string, number } from 'jsonous';
import { Result } from 'resulty';

const nameDecoder = field('name', string);
const nameResult: Result<string, string> = nameDecoder.decodeAny({ name: 'John Doe' }); // Ok("John Doe")
const nameError: Result<string, string> = nameDecoder.decodeAny({ age: 30 }); // Err("I expected to find an object with key 'name' but instead I found {\"age\":30}")

const cityDecoder = at(['address', 'city'], string);
const cityResult: Result<string, string> = cityDecoder.decodeAny({ address: { city: 'New York' } }); // Ok("New York")
const cityError: Result<string, string> = cityDecoder.decodeAny({ address: {} }); // Err("I found an error in the 'at' path. I could not find path '[\"address\",\"city\"]' in {\"address\":{}}")
```

### Building Complex Objects with assign

The assign method is a powerful tool for building complex objects from JSON data. It allows you to chain decoders together, extracting values from different parts of the JSON and combining them into a single object:

```typescript
import { succeed, field, number, string } from 'jsonous';
import { Result } from 'resulty';

interface User {
  id: number;
  email: string;
}

const userDecoder = succeed<Partial<User>>({})
  .assign('id', field('userId', number))
  .assign('email', field('emailAddress', string));

const userResult: Result<string, User> = userDecoder.decodeAny({
  userId: 213,
  emailAddress: 'foo@example.com',
}); // Ok({ id: 213, email: "foo@example.com" })
const userError: Result<string, User> = userDecoder.decodeAny({ userId: 213 }); // Err("I expected to find an object with key 'emailAddress' but instead I found {\"userId\":213}")
```

### Union Types with oneOf

The oneOf decoder allows you to handle JSON data that can have different structures. It tries a list of decoders in order and succeeds if any of them succeed:

```typescript
import { oneOf, createDecoderFromStructure, string, number, array, stringLiteral } from 'jsonous';
import { Result } from 'resulty';

interface User {
  type: 'user';
  name: string;
  age: number;
}

interface Admin {
  type: 'admin';
  name: string;
  permissions: string[];
}

type Person = User | Admin;

const userDecoder = createDecoderFromStructure({
  name: stringLiteral('user'),
  age: number,
});

const adminDecoder = createDecoderFromStructure({
  name: stringLiteral('admin'),
  permissions: array(string),
});

const personDecoder = oneOf<Person>([userDecoder, adminDecoder]);

const userResult: Result<string, Person> = personDecoder.decodeAny({ name: 'John Doe', age: 30 }); // Ok({ name: "John Doe", age: 30, type: "user" })
const adminResult: Result<string, Person> = personDecoder.decodeAny({
  name: 'Jane Doe',
  permissions: ['read', 'write'],
}); // Ok({ name: "Jane Doe", permissions: ["read", "write"], type: "admin" })
const personError: Result<string, Person> = personDecoder.decodeAny({ name: 'Bob' }); // Err("I found the following problems:\nI expected to find a number but instead I found undefined\nI expected an array but instead I found undefined")
```

### Handling Optional and Nullable Values

Jsonous provides maybe and nullable decoders for handling optional and nullable values:

```typescript
import { maybe, nullable, string } from 'jsonous';
import { just, nothing } from 'maybeasy';
import { Result } from 'resulty';

const maybeStringResult: Result<string, Maybe<string>> = maybe(string).decodeAny('hello'); // Ok(Just("hello"))
const maybeNothingResult: Result<string, Maybe<string>> = maybe(string).decodeAny(null); // Ok(Nothing)
const maybeNothingError: Result<string, Maybe<string>> = maybe(string).decodeAny(123); // Ok(Nothing)

const nullableStringResult: Result<string, Maybe<string>> = nullable(string).decodeAny('hello'); // Ok(Just("hello"))
const nullableNothingResult: Result<string, Maybe<string>> = nullable(string).decodeAny(null); // Ok(Nothing)
const nullableError: Result<string, Maybe<string>> = nullable(string).decodeAny(123); // Err("I expected to find a string but instead I found 123")
```

### Working with Dates

Jsonous provides decoders for working with dates:

```typescript
import { date, dateISO, dateJSON } from 'jsonous';
import { Result } from 'resulty';

const dateResult: Result<string, Date> = date.decodeAny('2023-10-27'); // Ok(Date)
const dateError: Result<string, Date> = date.decodeAny('not a date'); // Err("I expected a date but instead I found \"not a date\"")

const dateISOResult: Result<string, Date> = dateISO.decodeAny('2023-10-27T10:00:00Z'); // Ok(Date)
const dateISOError: Result<string, Date> = dateISO.decodeAny('not a date'); // Err("I expected an ISO date but instead I found \"not a date\"")

const dateJSONResult: Result<string, Date> = dateJSON.decodeAny('2023-10-27T10:00:00.123Z'); // Ok(Date)
const dateJSONError: Result<string, Date> = dateJSON.decodeAny('not a date'); // Err("I expected an JSON date but instead I found \"not a date\"")
```

### Working with Objects

Jsonous provides decoders for working with objects:

```typescript
import { dict, keyValuePairs, number } from 'jsonous';
import { Result } from 'resulty';

const keyValuePairsResult: Result<string, [string, number][]> = keyValuePairs(number).decodeAny({
  a: 1,
  b: 2,
  c: 3,
}); // Ok([["a", 1], ["b", 2], ["c", 3]])
const keyValuePairsError: Result<string, [string, number][]> = keyValuePairs(number).decodeAny({
  a: 1,
  b: 'hello',
  c: 3,
}); // Err("Key 'b' failed to decode: Not a number")

const dictResult: Result<string, Map<string, number>> = dict(number).decodeAny({
  a: 1,
  b: 2,
  c: 3,
}); // Ok(Map(3) { 'a' => 1, 'b' => 2, 'c' => 3 })
const dictError: Result<string, Map<string, number>> = dict(number).decodeAny({
  a: 1,
  b: 'hello',
  c: 3,
}); // Err("Key 'b' failed to decode: Not a number")
```

### Working with Custom Types

Jsonous provides a way to infer the type of a decoder:

```typescript
import { createDecoderFromStructure, string, number, InferType } from 'jsonous';

const userDecoder = createDecoderFromStructure({
  name: string,
  age: number,
});

type User = InferType<typeof userDecoder>;
// User is now { name: string; age: number; }
```

### Working with Custom Decoder Functions

Jsonous provides a way to infer the type of a decoder function:

```typescript
import { Result } from 'resulty';
import { InferTypeFromFn } from 'jsonous';

const stringDecoderFn = (value: any): Result<string, string> => {
  if (typeof value === 'string') {
    return ok(value);
  }
  return err('Not a string');
};

type InferredStringType = InferTypeFromFn<typeof stringDecoderFn>;
// InferredStringType is now string
```

### Working with Custom Utils

Jsonous provides some helper functions:

```typescript
import { camelCase, identity, safeStringify, snakeCase } from 'jsonous';

const camelCaseResult = camelCase('hello_world'); // helloWorld
const snakeCaseResult = snakeCase('helloWorld'); // hello_world
const identityResult = identity('hello'); // hello
const safeStringifyResult = safeStringify({ a: 1, b: 2 }); // {"a":1,"b":2}
```

### API Documentation

For a complete list of decoders and their usage, please refer to the API Documentation.

### Contributing

Contributions are welcome! Please feel free to open issues and pull requests.

### License

MIT
