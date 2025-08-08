// Temporary server configuration fix for Fly.io
// This shows what needs to be changed in your server

const PORT = process.env.PORT || 8080; // Fly.io uses PORT env var, defaults to 8080
const HOST = '0.0.0.0'; // MUST bind to 0.0.0.0, not localhost

// Your server.js needs to be updated to:
// app.listen(PORT, HOST, () => {
//   console.log(`Server running on http://${HOST}:${PORT}`);
// });

console.log(`
To fix your server on Fly.io:

1. Update your server.js file to use:
   - Port: process.env.PORT || 8080
   - Host: '0.0.0.0'

2. Redeploy with:
   fly deploy -a one-shot

Your server is currently not binding to the correct port/host,
which is why it's not accessible.
`);