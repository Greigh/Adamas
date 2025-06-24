# Call Center Helper

## Overview

Call Center Helper is a modern web application designed to assist call center agents with workflow, note-taking, number formatting, and more. It is built using HTML, JavaScript (ES Modules), and SCSS, and features modular code, persistent storage, and a responsive UI.

---

## Project Structure

```text
Call Center Help/client
├── src
│   ├── index.html
│   ├── privacy.html
│   ├── terms.html
│   ├── contact.html
│   ├── LICENSE.html
│   ├── main.js
│   ├── js
│   │   ├── main.js
│   │   └── modules
│   │       ├── callflow.js
│   │       ├── notes.js
│   │       ├── patterns.js
│   │       ├── settings.js
│   │       ├── storage.js
│   │       ├── themes.js
│   │       ├── timer.js
│   │       ├── floating.js
│   │       ├── draggable.js
│   │   └── utils
│   │       ├── app-globals.js
│   │       ├── app-state.js
│   │       ├── audio.js
│   │       ├── form-fixer.js
│   │       ├── helpers.js
│   └── styles
│       ├── main.scss
│       ├── main.css
│       ├── main.css.map
│       ├── base/
│       ├── components/
│       ├── features/
│       ├── layout/
│       ├── sections/
│       └── vendor/
├── dist/
├── dist_clean/
├── package.json
├── webpack.config.js
├── upload.sh
├── server.js
├── README.md
```

---

## Dev Dependencies

This project uses the following dev dependencies (see `package.json` for details):

- **webpack** & **webpack-cli**: Bundling and asset pipeline
- **webpack-dev-server**: Local development server with hot reload
- **mini-css-extract-plugin**: Extracts CSS into separate files
- **sass**: SCSS compilation
- **sass-loader**: Loads SCSS for webpack
- **html-webpack-plugin**: Generates HTML files for your bundles
- **terser-webpack-plugin**: JS minification
- **babel-loader**, **@babel/core**, **@babel/preset-env**, **@babel/plugin-syntax-dynamic-import**: ES6+ transpilation
- **eslint**: Linting for JavaScript
- **stylelint**: Linting for SCSS/CSS (recommended)
- **prettier**: Code formatting (recommended)
- **concurrently**: Run multiple npm scripts in parallel
- **cross-env**: Set environment variables across platforms
- **assert**, **buffer**, **crypto-browserify**, **events**, **os-browserify**, **process**, **querystring-es3**, **stream-browserify**, **url**, **util**, **vm-browserify**: Node.js polyfills for browser compatibility

You may also want to add:

- **npm-run-all** (for advanced script orchestration)
- **husky** and **lint-staged** (for pre-commit hooks)
- **jest** or **vitest** (for unit testing, if you add tests)
- **cypress** or **playwright** (for end-to-end testing, if needed)

---

## Getting Started

### Prerequisites

- Node.js (v18+) and npm installed on your machine.

### Installation

1. Clone the repository:

   ```sh
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```sh
   cd "Call Center Help/client"
   ```

3. Install the dependencies:

   ```sh
   npm install
   ```

### Running the Application

- **Development:**

  ```sh
  npm run start
  ```

  This runs the webpack dev server at [http://localhost:8080](http://localhost:8080).

- **Production Build:**

  ```sh
  npm run build
  ```

  Output is placed in the `dist/` directory.

- **Upload/Deploy:**

  ```sh
  ./upload.sh
  ```

  This script prepares a clean build and uploads it to your server.

- **Local Server (for static files):**

  ```sh
  node server.js
  ```

---

## Usage

- **Call Flow Builder:** Create, edit, reorder, and check off call flow steps.
- **Notes:** Take and manage notes per call or session.
- **Pattern Formatter:** Format numbers using custom patterns (auto-copy supported).
- **Timer:** Use a hold timer with pause/resume.
- **Settings & Themes:** Switch between light/dark mode and customize preferences.
- **Floating Windows:** Pop out sections for multitasking.
- **Privacy & Terms:** See `privacy.html` and `terms.html` for policies.
- **License:** See `LICENSE.html` for the full license text.

---

## Contributing

Pull requests and issues are welcome! Please lint and format your code before submitting.

---

## License

**License:** [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)

This software and its documentation are the exclusive property of Daniel Hipskind.
Unauthorized reproduction or distribution of this work, or any portion of it, may result in severe civil and criminal penalties, and will be prosecuted to the maximum extent possible under law.

See [`LICENSE.html`](./src/LICENSE.html) for the full license text.
