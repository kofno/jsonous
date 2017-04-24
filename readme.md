# jsonous

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

    string().decodeJson('"foo"')   // --> Ok("foo")
    string().decodeJson('42')      // --> Err("42 is not a string")

    number().decodeJson('42')      // --> Ok(42)
    number().decodeJson('"foo"')   // --> Err("foo is not a number")

    boolean().decodeJson('true')   // --> Ok(true)
    boolean().decodeJson('"foo"')  // --> Err("foo is not a boolean")

The array primitive applies another decoder to an array of values.

    array(string()).decodeJson('["foo", "bar"]') // --> Ok(["foo", "bar"])
    array(string()).decodeJson('["foo", 42]')    // --> Err("42 is not a string")

The `field` and `at` decoders are used to extract values from objects.

    field('bar', string()).decodeAny({ bar: 'baz' }) // --> Ok('baz')
    at(['foo', 0, 'bar'], number()).decodeAny({ foo: [{ bar: 42 }] }) // --> Ok(42)

Object decoders can be chained together to build more complex data structures.

    field('userId', number()).andThen(id =>
    field('emailAddress', string()).andThen(email =>
    succeed({ id, email })))
      .decodeAny({ userId: 213, emailAddress: 'foo@example.com' })
      // --> Ok({ id: 213, email: 'foo@example.com'})

Of course, your code editor may try to reformat this code.

    field('userId', number()).andThen(id =>
      field('emailAddress', string()).andThen(email =>
        succeed({ id, email })))
      .decodeAny({ userId: 213, emailAddress: 'foo@example.com' })
      // --> Ok({ id: 213, email: 'foo@example.com'})

For an object of any moderate complexity, this nesting may become an eyesore.

Objects can also be built using the applicative style.

    const ctor = (id: number) => (email: string) => ({ id, email });
    const decoder = succeed(ctor)
      .ap(field('userId', number()))
      .ap(field('emailAddress', string()));

    decoder.decodeAny({ userId: 213, emailAddress: 'foo@example.com' })
    // --> Ok({ id: 213, email: 'foo@example.com'})

One stumbling block for this style is that your constructor function must be
curried. I've manually curried this function, but you could also use a `curry`
function from an FP library like [Ramda](http://ramdajs.com/docs/#curry)

Applicative style requires that the object decoders are applied in the same
order as the function parameters are declared. Also, for a significantly
complex object, the constructor function will require a boatload of arguments.
That's never fun.

Both `andThen` and `ap` have their strengths and weaknesses. Which one is 'correct'?
That depends on your own preferences and what's appropriate for the situation.

In any case, the best strategy for handling object construction with decoders
is to compose complex decoders from smaller, simpler decoders.

    field("user", userDecoder).andThen(user =>
    at(["student", "courses"], array(courseDecoder)).andThen(courses =>
    succeed({ user, courses })
    .decodeJson('... some json ... ')

    const userDecoder = //...
    const courseDecoder = //...





# docs

[API](https://kofno.github.io/jsonous)
