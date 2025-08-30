# Job Task Project

This project consists of two main parts:

1. **API**: A PHP-based backend that provides data for the frontend.
2. **Frontend**: A React + TypeScript application built with Vite.

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v16 or later)
- **npm** or **yarn** (for managing frontend dependencies)
- **PHP** (v7.4 or later)

---

## Setting Up the Project

### 1. Clone the Repository

```bash
git clone https://github.com/ChetanTiwari195/job_task.git
cd job_task
```

### 2. Setting Up the API

1. Navigate to the `api` folder:

   ```bash
   cd api
   ```

2. Ensure your web server is configured to serve the `api` folder. For example, if using Apache, set the document root to the `api` directory.

3. Start the PHP built-in server (for development purposes):

   ```bash
   php -S localhost:8000
   ```

4. The API will now be accessible at `http://localhost:8000`.

---

### 3. Setting Up the Frontend

1. Navigate to the `frontend` folder:

   ```bash
   cd ../frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the URL provided by Vite (e.g., `http://localhost:5173`).

---

## Running the Project

- **API**: Ensure the PHP server is running (`php -S localhost:8000`).
- **Frontend**: Start the Vite development server (`npm run dev`).

---

## Building for Production

To build the frontend for production:

1. Navigate to the `frontend` folder:

   ```bash
   cd frontend
   ```

2. Run the build command:

   ```bash
   npm run build
   ```

3. The production-ready files will be available in the `frontend/dist` folder.

---

## Additional Notes

- The API uses JSON files for data storage. These files are located in the `api` folder.
- The frontend is configured with TypeScript and Vite for fast development and builds.
- For any issues, please open a GitHub issue in this repository.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
