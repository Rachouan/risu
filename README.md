Here's your **README.md** for the **Risu** package! 🚀

---

# **Risu** – Type-Safe Resource Builder for Actions with Context

## 📖 Overview

**Risu** is a lightweight, type-safe library for defining and managing **asynchronous actions** within a **shared context**. It provides a structured way to execute functions while automatically handling context injection, allowing you to build **extensible, reusable resources**.

---

## ✨ Features

✅ **Automatic Context Injection** – No need to pass context manually when calling actions.  
✅ **Strong Type Safety** – Ensures all actions, inputs, and outputs are fully typed.  
✅ **Extensible Notifier System** – Track and log action executions.  
✅ **Fluent API for Composition** – Define and extend resources effortlessly.

---

## 🚀 Installation

```sh
npm install @rachouan/risu
# or
yarn add @rachouan/risu
# or
bun add @rachouan/risu
```

---

## 🔧 **Usage**

### **1️⃣ Define a Resource with Context**

Define a **resource** with a **shared context** (e.g., API keys, user sessions).

```typescript
import { createResource } from "@rachouan/risu";

// Define the shared context
const apiContext = { apiKey: "12345-SECRET" };

// Create a resource with context
const UserResource = createResource("UserResource", apiContext)
  .createAction("fetchUser", async (ctx, userId: string) => {
    return { userId, apiKey: ctx.apiKey }; // Context is automatically injected!
  })
  .addNotifier((name, result) => {
    console.log(`Action ${name} executed with result:`, result);
  })
  .build();
```

---

### **2️⃣ Call an Action\***

Once the resource is built, actions can be executed without manually passing context.

```typescript
async function main() {
  const user = await UserResource.callAction("fetchUser", "42");
  console.log(user); // { userId: "42", apiKey: "12345-SECRET" }
}

main();
```

---

### **3️⃣ Retrieve Registered Actions**

You can also retrieve an action and execute it manually if needed.

```typescript
const fetchUserAction = UserResource.getAction("fetchUser");

if (fetchUserAction) {
  fetchUserAction(UserResource.context, "42").then(console.log);
}
```

---

### **4️⃣ Change Context Dynamically**

You can update the context dynamically using `.setContext()`.

```typescript
const updatedUserResource = UserResource.setContext({ apiKey: "NEW-SECRET" });

// Now all actions will use the new context
const user = await updatedUserResource.callAction("fetchUser", "42");
console.log(user); // { userId: "42", apiKey: "NEW-SECRET" }
```

---

### **5️⃣ Add Notifiers**

Use notifiers to track and log action executions.

```typescript
const LoggedResource = createResource("LoggedResource", apiContext)
  .createAction("fetchUser", async (context, id) => {
    const response = await fetch(`https://api.example.com/users/${id}`, {
      headers: { Authorization: `Bearer ${context.apiKey}` },
    });
    return response.json();
  })
  .addNotifier("fetchUser", (result) => {
    console.log(`User fetched with result:`, result);
  })
  .build();
```

---

## 🛠 **Example Use Cases**

✅ **API Clients** – Define reusable API call handlers with shared authentication.  
✅ **Event-Driven Systems** – Use notifiers to track and log events after an action executes.  
✅ **Command Handlers** – Manage different commands within a structured resource system.

---

## 🔥 **Why Use Risu?**

✔ Provides a **clean, declarative way** to define and manage actions.  
✔ Supports **TypeScript** for strong type safety and autocompletion.

---

## 📝 **License**

This project is licensed under the **MIT License**.

---

## 🙌 **Contributions**

Feel free to submit **issues, feature requests, or pull requests** to improve the library! 🚀
