# perevozkin-gulp

## Development

Use Node 20 or 22 for the gulp toolchain:

```bash
nvm use
npm run dev
```

BrowserSync serves static files from `docs`, so PHP form handlers do not run there. To test real form submission locally, run a PHP server:

```bash
npm run php:serve
```

Then open `http://localhost:8000`.

The Yandex Maps browser key is public by design. Keep it restricted by allowed domains in the Yandex developer console.
