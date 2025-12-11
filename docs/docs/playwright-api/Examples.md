---
sidebar_position: 2
---

# ⚙️Examples of API automation

Lets see how we can use the power of Playwright MCP Server to automate API of our application

## Authentication Examples

### Bearer Token Authentication

Use the `token` parameter for Bearer token authentication:

```typescript
// GET request with Bearer token
await playwright_get({
  url: 'https://api.example.com/protected-data',
  token: 'your-bearer-token-here'
});

// POST request with Bearer token
await playwright_post({
  url: 'https://api.example.com/create',
  value: '{"name":"test"}',
  token: 'your-bearer-token-here'
});

// DELETE request with Bearer token
await playwright_delete({
  url: 'https://api.example.com/resource/123',
  token: 'your-bearer-token-here'
});
```

### Custom Headers Authentication

Use the `headers` parameter for other authentication methods:

```typescript
// Basic authentication
await playwright_get({
  url: 'https://api.example.com/data',
  headers: {
    'Authorization': 'Basic dXNlcjpwYXNzd29yZA==',
    'X-API-Version': '2.0'
  }
});

// API Key authentication
await playwright_post({
  url: 'https://api.example.com/data',
  value: '{"data":"test"}',
  headers: {
    'X-API-Key': 'your-api-key-here',
    'X-Request-ID': 'unique-request-id'
  }
});

// Custom authentication header
await playwright_put({
  url: 'https://api.example.com/update/123',
  value: '{"status":"active"}',
  headers: {
    'X-Custom-Auth': 'custom-token',
    'X-Client-ID': 'client-123'
  }
});
```

### Combining Token and Headers

You can combine both `token` and `headers` parameters. Custom `Authorization` header will override the token:

```typescript
// Token takes precedence if no Authorization header in custom headers
await playwright_get({
  url: 'https://api.example.com/data',
  token: 'bearer-token',
  headers: {
    'X-Custom-Header': 'value'
  }
});

// Custom Authorization header overrides token parameter
await playwright_get({
  url: 'https://api.example.com/data',
  token: 'this-will-be-ignored',
  headers: {
    'Authorization': 'Basic xyz123',  // This takes precedence
    'X-Custom-Header': 'value'
  }
});
```

## CRUD Operations Example

### Scenario

```json
// Basic POST request
Perform POST operation for the URL https://api.restful-api.dev/objects with body
{
   "name": "Apple MacBook Pro 16",
   "data": {
      "year": 2024,
      "price": 2499,
      "CPU model": "M4",
      "Hard disk size": "5 TB"
   }
}
And verify if the response has createdAt and id property and store the ID in a variable for future reference say variable productID

// POST request with Bearer token authorization
Perform POST operation for the URL https://api.restful-api.dev/objects with Bearer token "your-token-here" set in the headers
{
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-token-here'
      },
and body
{
   "name": "Secure MacBook Pro",
   "data": {
      "year": 2024,
      "price": 2999,
      "CPU model": "M4 Pro",
      "Hard disk size": "8 TB",
      "security": "enhanced"
   }
}

Perform GET operation for the created ProductID using URL https://api.restful-api.dev/objects/productID and verify the response has properties like Id, name, data

Perform PUT operation for the created ProductID using URL https://api.restful-api.dev/objects/productID with body {
   "name": "Apple MacBook Pro 16",
   "data": {
      "year": 2025,
      "price": 4099,
      "CPU model": "M5",
      "Hard disk size": "10 TB",
      "color": "Titanium"
   }
}

And verify if the response has createdAt and id property

Perform PATCH operation for the created ProductID using URL https://api.restful-api.dev/objects/productID with body
{
   "name": "Apple MacBook Pro 19 (Limited Edition)"
}
And verify if the response has updatedAt property with value Apple MacBook Pro 19 (Limited Edition)

```

And once the entire test operation completes, we will be presented with the entire details of how the automation did happened.

![Playwright MCP Server](./img/playwright-api.png)

:::tip
You can also see the `Request/Response/StatusCode` from the execution of Playwright MCP Server

![Playwright MCP Server](./img/api-response.png)
:::
