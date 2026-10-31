# AI Copilot API

## `POST /api/v1/ai/copilot/`

Requires an authenticated Django session and CSRF token. Requests are limited to 20 per user per hour.

### Request

```json
{
  "mode": "billing_copilot",
  "question": "How much is currently overdue?",
  "history": []
}
```

`mode` is one of `billing_copilot`, `renewal_insights`, or `customer_support`. `question` is limited to 1,000 characters. `history` is optional and accepts at most eight `{ "role": "user" | "assistant", "content": "..." }` turns.

Billing and renewal modes are limited to Admin and Staff. Customer support mode is limited to a Customer account linked to its own Customer profile. Customer context is filtered by that profile and excludes contact, address, tax ID, and internal notes. AI receives an ephemeral snapshot only; responses are not stored by the API request. Monetary facts and renewal risk bands are calculated in Django; the model only explains and summarizes them.

### Response

```json
{
  "mode": "billing_copilot",
  "answer": "There are 2 overdue invoices totaling ₹1,800.00...",
  "as_of": "2026-10-31",
  "currency": "INR"
}
```

### Errors

- `400`: invalid mode, question, or history.
- `403`: role is not allowed to use the selected mode or customer profile is not linked.
- `429`: request throttle exceeded.
- `502`: OpenAI request failed.
- `503`: `OPENAI_API_KEY` is missing.

Set `OPENAI_API_KEY` in `backend/.env` for local use or the backend host's secret manager. Never add a real key to `.env.example`, frontend environment variables, or source control. The model defaults to `gpt-6-luna` and can be overridden by `OPENAI_MODEL`.
