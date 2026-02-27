---
description: Launch frontend dev servers (calculator + website) and verify API health
---

Start the PolicyEngine frontend dev servers for debugging. Optionally verify the API is healthy.

## Port selection

If the user specifies ports, use those. Otherwise, scan upward from port 3000 to find two available ports:

```bash
for port in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009; do
  lsof -i :$port > /dev/null 2>&1 || echo "$port is available"
done
```

Pick the first two available ports. Assign the first to the calculator and the second to the website.

## Step 1: Check API health

Run:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health
```

- If the response is `200`, report "API is running on port 8000."
- If it fails, report "API is NOT running on port 8000. You'll need to start it manually in the policyengine-api-v2-alpha repo." Continue with the frontend servers anyway.

## Step 2: Start frontend dev servers

From the app directory, start **both** servers as background tasks:

**Calculator:**
```bash
cd /Users/administrator/Documents/PolicyEngine/policyengine-app-v2/app
VITE_APP_MODE=calculator npx vite --port <CALCULATOR_PORT>
```

**Website:**
```bash
cd /Users/administrator/Documents/PolicyEngine/policyengine-app-v2/app
VITE_APP_MODE=website npx vite --port <WEBSITE_PORT>
```

**Important:**
- Use `VITE_APP_MODE` env var, NOT the `--mode` flag (Vite's `--mode` sets the dotenv mode, not the app mode)
- Run both as background tasks so the user can continue working

## Step 3: Verify servers started

Wait ~15 seconds, then check both ports respond with HTTP 200:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:<CALCULATOR_PORT>/
curl -s -o /dev/null -w "%{http_code}" http://localhost:<WEBSITE_PORT>/
```

If either fails, read the background task output to diagnose the error.

## Step 4: Report status

Print a summary:

```
Dev servers running:

  Calculator: http://localhost:<CALCULATOR_PORT>
  Website:    http://localhost:<WEBSITE_PORT>
  API:        http://localhost:8000  (running / NOT running)

To stop the dev servers, use /tasks to find and stop the background tasks.
```
