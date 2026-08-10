# Development Notes

- The frontend Vite dev origin is `https://localhost:5173`.
- The ASP.NET Core development API is expected at `https://localhost:7119`.
- Trust the ASP.NET Core development HTTPS certificate locally.
- The Vite development certificate may also need to be trusted/accepted by the browser.
- Configure backend CORS to allow `https://localhost:5173` with credentials.
- Do not disable TLS verification in frontend code.
