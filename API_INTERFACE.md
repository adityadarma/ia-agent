# Client-Server API Contract

This document describes the protocol for the VS Code Extension (Client) to communicate with the AI Agent Server.

## 1. Endpoint

**POST** `/agent/chat`

## 2. Request Payload (Client -> Server)

The client **MUST** gather context from the IDE before sending the request.

```typescript
export interface ChatRequestPayload {
  /**
   * The user's query or instruction.
   * Example: "Refactor this function to be async"
   */
  prompt: string;

  /**
   * Unique session ID. Stick to one ID per conversation window.
   */
  sessionId: string;

  /**
   * CRITICAL: The context provided by the Client.
   * The Server relies on THIS to understand the code.
   */
  contextFiles: ContextItem[];
}

export interface ContextItem {
  /**
   * Relative path from workspace root.
   * Example: "src/utils/helper.ts"
   */
  path: string;

  /**
   * The content of the file.
   * If `isStructure` is true, this should differ (see below).
   */
  content: string;

  /**
   * Set to TRUE if this file is currently open in the editor.
   */
  isActive?: boolean;

  /**
   * Set to TRUE if this item represents the file list/tree.
   */
  isStructure?: boolean;
}
```

## 3. Client Implementation Logic

The VS Code Client should perform these steps **before** calling the API:

### Step A: Get Active File
1. Check `vscode.window.activeTextEditor`.
2. If exists, read its content (`document.getText()`).
3. Get its relative path (`vscode.workspace.asRelativePath(...)`).
4. Add to `contextFiles` with `isActive: true`.

### Step B: Get Project Structure
1. Run `vscode.workspace.findFiles('**/*', '**/node_modules/**')`.
2. Format the list of paths into a single string (e.g. tree structure or line-by-line).
3. Add to `contextFiles` with `isStructure: true`, `path: "PROJECT_STRUCTURE"`, and `content: <the_list_string>`.

### Step C: Send Request
Send JSON payload to `http://localhost:3000/agent/chat`.

## 4. Example Payload

```json
{
  "prompt": "Fix the bug in the auth middleware",
  "sessionId": "session-123",
  "contextFiles": [
    {
      "path": "server/src/middleware/auth.ts",
      "content": "export function auth(req, res) { ... }",
      "isActive": true
    },
    {
      "path": "PROJECT_STRUCTURE",
      "content": "server/src/index.ts\nserver/src/middleware/auth.ts\npackage.json",
      "isStructure": true
    }
  ]
}
```

## 5. Server Behavior

1. The Server receives this payload.
2. It formats `contextFiles` into a special `[CONTEXT]` block in the LLM prompt.
3. The AI reads this context FIRST.
4. If the AI needs *more* files (that are not in `contextFiles`), it may ask the user or try to use tools (but tools are limited in container).
5. Ideally, Client should provide enough context upfront.
