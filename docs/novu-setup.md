# Novu Notification Setup

This document describes the Novu in-app notification workflows configured for Orochat, including what to fill in the Novu Dashboard **In-App Editor** for each workflow.

---

## Environment Variables

Ensure the following are set in `.env.local`:

```env
NEXT_PUBLIC_NOVU_APP_IDENTIFIER=your_app_identifier
NEXT_PUBLIC_NOVU_BACKEND_URL=https://novu.feendesk.com/api
NEXT_PUBLIC_NOVU_SOCKET_URL=wss://novu.feendesk.com/socket
NOVU_SECRET_KEY=your_secret_key
```

---

## NovuInbox Component

Located at: `components/feature/Notifications/NovuInbox.tsx`

The `<Inbox />` component from `@novu/nextjs` is used to render the in-app notification dropdown. It is initialised with the subscriber's user ID and the application identifier from environment variables.

---

## Workflows

You have **5 active workflows** triggered from the codebase. Each must be configured in the [Novu Dashboard](https://dashboard.novu.co) → Workflows → \[workflow name\] → In-App Step → In-App Editor.

> **Important:** Do not use a Bridge URL. All workflows are dashboard-defined and triggered via the Novu API from the server. Leave the Bridge URL field empty in Settings.

---

### 1. `post-comment`

Triggered when a user comments on someone else's post.

**Trigger location:** `features/feed/actions.ts`

**Payload sent:**
```ts
{
  message: `${session.user.name} commented on your post`,
  userName: session.user.name,
  postId: post.id,
  commentContent: content
}
```

**In-App Editor:**

| Field        | Value                                      |
|--------------|--------------------------------------------|
| Subject      | `{{payload.userName}} commented on your post` |
| Body         | `{{payload.commentContent}}`               |
| Redirect URL | `/feed`                                    |

---

### 2. `post-like`

Triggered when a user likes someone else's post.

**Trigger location:** `features/feed/actions.ts`

**Payload sent:**
```ts
{
  message: `${session.user.name} liked your post`,
  userName: session.user.name,
  postId: post.id
}
```

**In-App Editor:**

| Field        | Value                                  |
|--------------|----------------------------------------|
| Subject      | `{{payload.userName}} liked your post` |
| Body         | `Someone liked one of your posts`      |
| Redirect URL | `/feed`                                |

---

### 3. `connection-request`

Triggered when a user sends a connection request.

**Trigger location:** `features/connections/actions.ts`

**Payload sent:**
```ts
{
  message: `${sender.name} sent you a connection request`,
  senderName: sender.name,
  type: 'connection_request'
}
```

**In-App Editor:**

| Field        | Value                                              |
|--------------|----------------------------------------------------|
| Subject      | `{{payload.senderName}} sent you a connection request` |
| Body         | `You have a new connection request waiting`        |
| Redirect URL | `/connections`                                     |

---

### 4. `connection-accepted`

Triggered when a user accepts a connection request.

**Trigger location:** `features/connections/actions.ts`

**Payload sent:**
```ts
{
  message: `${currentUser.name} accepted your connection request`,
  userName: currentUser.name,
  type: 'connection_accepted'
}
```

**In-App Editor:**

| Field        | Value                                                  |
|--------------|--------------------------------------------------------|
| Subject      | `{{payload.userName}} accepted your connection request` |
| Body         | `You are now connected with {{payload.userName}}`      |
| Redirect URL | `/connections`                                         |

---

### 5. `new-message`

Triggered when a user sends a message in a collab conversation.

**Trigger location:** `features/collab/actions.ts`

**Payload sent:**
```ts
{
  message: 'You have a new message',
  type: 'new_message',
  conversationId: conversationId
}
```

**In-App Editor:**

| Field        | Value                                    |
|--------------|------------------------------------------|
| Subject      | `You have a new message`                 |
| Body         | `Someone sent you a message`             |
| Redirect URL | `/collab/{{payload.conversationId}}`     |

---

## Troubleshooting

### "Bridge execution failed"
This means Novu is trying to call a Bridge URL that doesn't exist or isn't reachable.
- Go to **Novu Dashboard → Settings → Bridge URL** and make sure it is **empty**.
- All workflows should be defined in the dashboard UI, not in code (no code-first bridge needed).

### Notifications not appearing
- Make sure the subscriber ID passed to `<Inbox />` matches the `subscriberId` used when triggering the notification.
- Check that `NEXT_PUBLIC_NOVU_APP_IDENTIFIER` is correctly set.
- Verify the workflow is set to **Active** in the Novu Dashboard.
