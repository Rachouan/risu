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

Example defining a **resource** with **drizzle**.

```typescript
import { createResource } from "@rachouan/risu";
import { usersTable } from "@/db/schema";
import { db } from "@/db";

export const userResource = createResource("user")
.setContext({
  db: db,
})
.createAction(
  "create",
  async ({ db }, input: typeof usersTable.$inferInsert) => {
    return db
      .insert(usersTable)
      .values(input)
      .returning()
      .then(([res]) => res);
  }
)
//expose api route for a resource
.addApi("/create", "create", "POST")
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

### **4️⃣ Add Notifiers**

Use notifiers to track and log action executions.

```typescript
const LoggedResource = createResource("LoggedResource", apiContext)
  .addNotifier((name, result) => {
    console.log(`Action ${name} completed with result:`, result);
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
