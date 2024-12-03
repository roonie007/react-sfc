# React SFC

<p align="center">
Single File Components (SFC) for react, inspired by Vue/Svelte SFC, but for React.
</p>
<p align="center">
<b>Experimental</b>: This project is in the early stages of development and may not be suitable for production use. Use at your own risk.
</p>

<p align="center">
  <img src="https://github.com/roonie007/react-sfc/blob/main/images/demo.jpg?raw=true" alt="react sfc demo" />
</p>

## Why React SFC?

React SFC is a Vite plugin that enables you to define React components using a single file format, similar to Vue and Svelte Single File Components (SFC). This makes it easier to organize your components and reduces the boilerplate code required to set up a React component.

With React SFC, you can define your component's template, logic, and styles in a single `.rc` file. This allows you to keep your codebase clean and maintainable, with a familiar syntax that is easy to read and understand.

## Why React SFC? **NO BS** version

I’ve been using React for 4 years ( day to day job ). I love **React**, I love **the ecosystem**, I love **the community**. But JSX? OH, JSX MAKES ME WANT TO PUNCH A WALL. IT MAKES ME SICK. I HATE IT WITH EVERY FIBER OF MY BEING. EVERYTHING IS A FUCKING MESS. JavaScript shoved into my HTML. HTML puked into my JavaScript AAAAAAAAAAAAAAAHHHHHHHHHHHHHHHHHHHHHH.

And don’t even get me started on the FUCKING **_className_**. WHY?! Why can’t I just use class like a normal, sane person? Oh no, JSX has to be “special.” It has to remind me on every line that I’m trapped in its twisted logic. “Oh, you wanted to style this? Sorry, class is a reserved keyword. Here, take this bastardized, verbose nonsense instead!”

All I want is SEPARATION. Clean, beautiful separation. HTML stays in HTML. CSS stays in CSS. JavaScript stays in JS where it belongs. But JSX? No, JSX is the unholy cocktail of chaos, forcing you to mix it all together like some deranged lunatic.

So I snapped. I built this vite plugin a single-file component (SFC) for React inspired by the perfection of Svelte and Vue. JSX? className? ALL OF IT CAN GO STRAIGHT TO THE GARBAGE WHERE IT BELONGS. This plugin is my rebellion. My middle finger to the madness.

> If you feel the same way, you might like this plugin and contribute. If you don’t, that’s cool too. I’m just a guy who hates JSX. No big deal.

## Features

Sorry for the rant. I just really hate JSX, let's get back to business, here are some features of React SFC:

- **Single File Components**: Define your component's template, logic, and styles in a single `.rc` file.
- **Familiar Syntax**: Inspired by Vue & Svelte SFCs, making it easy for developers familiar with Vue and Svelte to get started.
- **Custom Directives**:
  - `$if`: Simplify conditional rendering in your templates.
  - `$for`: Streamline list rendering with a concise loop syntax.
- **Enhanced Template Syntax**: Use JSX-like syntax in the `<template>` block, with additional directives to reduce awkward JavaScript within your HTML.
- **Language Support**:
  - **JavaScript/TypeScript**: Use the `lang` attribute in the `<script>` block to specify `ts` or `js` ( default is **JS**).
  - **CSS Preprocessors**: Write styles using `scss`, `less`, or `stylus` in the `<style>` block with the `lang` attribute ( default is **CSS**).
- **Seamless Integration**: Works with Vite for fast development and hot module replacement.

## Getting Started

To get started with React SFC, you need to install the plugin and configure it in your Vite project. Once set up, you can start creating components using the `.rc` file extension.

### Example Component

Here's an example of a React SFC component:

````svelte
<template>
  <div>
    <h1>Counter</h1>
    <button onClick={() => setCount(count + 1)}>Increment</button>
    <p $if={count > 0}>Count: {count}</p>
    <p $if={count === 0}>Start counting!</p>
  </div>
</template>

<script lang="ts">
import { useState } from 'react';

const [count, setCount] = useState<number>(0);
</script>

<style>
button {
  padding: 10px 20px;
  font-size: 16px;
}
</style>

## Installation

First, install the plugin as a development dependency:

```bash
npm install --save-dev vite-plugin-react-sfc
````

Or with Yarn/Bun:

```bash
yarn add --dev vite-plugin-react-sfc
```

Or with PNPM:

```bash
pnpm add --save-dev vite-plugin-react-sfc
```

## Usage

Add the plugin to your Vite configuration:

```js
import { defineConfig } from "vite";
import reactSFC from "vite-plugin-react-sfc";

export default defineConfig({
  plugins: [
    reactSFC(),
    // other plugins...
  ],
});
```

Now, you can start creating .rc files in your project.

## Template Syntax

The `<template>` block uses JSX syntax, enhanced with custom directives like $if and $for to simplify your code and avoid embedding awkward JavaScript within your HTML structure. This allows for a more declarative and readable template.

### Directives

#### $if Directive

Use the `$if` attribute to conditionally render elements in your template.

Syntax:

```svelte
<element $if="{condition}">Content</element>
```

Example:

```svelte
<span $if="{count > 0}">Count is positive</span>
```

#### $for Directive

Use the `$for` attribute to render lists efficiently.

Syntax:

```svelte
<element $for="{item in items}">{item}</element>
```

Example:

```svelte
<li $for="{fruit in fruits}">{fruit}</li>
```

## Script and Style Blocks

### Script Block

You can write your component logic in the <script> block. Use the lang attribute to specify the scripting language:

- `lang="ts"` for TypeScript.
- `lang="js"` for JavaScript. (default if lang is omitted)

Example:

```vue
<script lang="ts">
import { useState } from "react";

const [count, setCount] = useState<number>(0);
</script>
```

### Style Block

Define your component styles in the `<style>` block. You can use CSS or preprocessors like SCSS, Less, or Stylus by specifying the lang attribute:

- `lang="scss"` for SCSS.
- `lang="less"` for Less.
- `lang="stylus"` for Stylus.
- `lang="css"` for standard CSS (default if lang is omitted).

Example:

```vue
<style lang="scss">
button {
  padding: 10px 20px;
  font-size: 16px;
}
</style>
```

## VS Code Extension

For a better development experience, you can install the [React SFC VS Code extension](https://marketplace.visualstudio.com/items?itemName=roonie007.react-sfc) to get syntax highlighting and snippets for React SFC files, I know it's not perfect, but it's a start.

> Note: To use preprocessors, ensure you have the corresponding module installed, see the [Vite documentation](https://vitejs.dev/guide/features.html#css-pre-processors) for more information.

## Limitations

- Only Supports .rc Files: The plugin processes files with the .rc extension. Ensure your components use this extension.
- Custom Directives: Only $if and $for directives are supported at this time.
- No Scoped Styles: Styles are global. Scoped styles are not yet implemented.
- Limited Error Handling: Syntax errors in your templates may lead to build-time errors. Ensure your templates are valid.

## License

This project is licensed under the [MIT License](LICENSE).

---

Thank you for using React SFC! If you have any questions or need support, feel free to open an issue on the GitHub repository.
