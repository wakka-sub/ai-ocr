# AI OCR Web App

This project is a React + TypeScript + Vite application that performs client-side image cropping and parallel OCR using the Gemini 2.5 Flash API.

## Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Set the API key in a `.env` file:

```
VITE_GEMINI_APIKEY=your_api_key_here
```

## Testing

Run the unit tests with:

```bash
npm test
```
Ensure dependencies are installed with `npm install` before running the tests so
that Vitest and other development packages are available.

The tests download an image from i.imgur.com, so internet access is required.
