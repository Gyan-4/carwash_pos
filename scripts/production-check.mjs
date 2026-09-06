const rawBaseUrl = process.env.APP_URL || process.argv[2];

if (!rawBaseUrl) {
  console.error('Production check failed.');
  console.error('- Provide APP_URL or pass the deployed application URL as the first argument.');
  console.error('  Example: APP_URL=https://your-app.vercel.app pnpm production:check');
  process.exit(1);
}

let baseUrl;
try {
  baseUrl = new URL(rawBaseUrl);
} catch {
  console.error('Production check failed.');
  console.error('- APP_URL must be a valid absolute URL.');
  process.exit(1);
}

if (!['http:', 'https:'].includes(baseUrl.protocol)) {
  console.error('Production check failed.');
  console.error('- APP_URL must use http or https.');
  process.exit(1);
}

baseUrl.pathname = baseUrl.pathname.replace(/\/$/, '');
const healthUrl = new URL('/api/health', baseUrl);

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 15000);

try {
  const startedAt = Date.now();
  const response = await fetch(healthUrl, {
    method: 'GET',
    headers: { accept: 'application/json' },
    cache: 'no-store',
    signal: controller.signal,
  });
  const duration = Date.now() - startedAt;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // The status/body validation below will report a useful error.
  }

  if (!response.ok || data?.success !== true || data?.status !== 'ok' || data?.database !== 'connected') {
    console.error('Production check failed.');
    console.error(`- Health URL: ${healthUrl}`);
    console.error(`- HTTP status: ${response.status}`);
    console.error(`- Expected: success=true, status=ok, database=connected.`);
    process.exit(1);
  }

  console.log('Production check passed.');
  console.log(`- Application: ${baseUrl.origin}`);
  console.log('- Health endpoint: OK');
  console.log('- Database connectivity: OK');
  console.log(`- Response time: ${duration} ms`);
} catch (error) {
  console.error('Production check failed.');
  if (error?.name === 'AbortError') {
    console.error('- Health endpoint timed out after 15 seconds.');
  } else {
    console.error(`- ${error instanceof Error ? error.message : String(error)}`);
  }
  process.exit(1);
} finally {
  clearTimeout(timeout);
}
