# AI OCR Web App

This project is a React + TypeScript + Vite application that performs client-side image cropping and parallel OCR using the Gemini 2.5 Flash API. The interface is styled with Tailwind CSS using Material Design 3 tokens and the Inter typeface.

Each cropped region can be rotated in 90° steps before sending to the Gemini API. Thumbnails of the selected areas appear beneath the canvas with rotate and delete controls. OCR results show in a right-hand panel where each block has its own copy and redo buttons along with a global copy-all control. No more than five requests run in parallel and any 429 responses are retried indefinitely with exponential backoff. Running OCR processes only regions without text and indicates progress.

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
