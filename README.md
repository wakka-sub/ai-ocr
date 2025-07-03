# AI OCR Web App

This project is a React + TypeScript + Vite application that performs client-side image cropping and parallel OCR using the Gemini 2.5 Flash API.

Each cropped region can be rotated in 90° steps before sending to the Gemini API. Selected areas are listed below the canvas where they can be rotated or deleted. OCR results appear in the right panel and can be copied with one click.

## Development

```bash
npm install
npm run dev
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
The tests download an image from i.imgur.com, so internet access is required.
