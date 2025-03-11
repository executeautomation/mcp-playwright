---
sidebar_position: 2
---

# ⚙️Examples of API automation
Lets see how we can use the power of Playwright MCP Server to automate API of our application

### Scenario
```json
Perform POST operation for the URL https://api.restful-api.dev/objects with body 
{
   "name": "Apple MacBook Pro 16",
   "data": {
      "year": 2024,
      "price": 2499,
      "CPU model": “M4”,
      "Hard disk size": “5 TB"
   }
}
And verify if the response has createdAt and id property and store the ID in a variable for future reference say variable productID

Perform GET operation for the created ProductID using URL https://api.restful-api.dev/objects/productID and verify the response has properties like Id, name, data

Perform PUT operation for the created ProductID using URL https://api.restful-api.dev/objects/productID with body {
   "name": "Apple MacBook Pro 16",
   "data": {
      "year": 2025,
      "price": 4099,
      "CPU model": “M5”,
      "Hard disk size": "10 TB",
      "color": “Titanium”
   }
}

And verify if the response has createdAt and id property

Perform PATCH operation for the created ProductID using URL https://api.restful-api.dev/objects/productID with body 
{
   "name": "Apple MacBook Pro 19 (Limited Edition)”
}
And verify if the response has updatedAt property with value Apple MacBook Pro 19 (Limited Edition)

```

And once the entire test operation completes, we will be presented with the entire details of how the automation did happened.

![Playwright MCP Server](./img/playwright-api.png)

:::tip
You can also see the `Request/Response/StatusCode` from the execution of Playwright MCP Server

![Playwright MCP Server](./img/api-response.png)
:::