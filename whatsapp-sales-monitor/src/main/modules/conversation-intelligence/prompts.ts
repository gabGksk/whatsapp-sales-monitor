import { ClassificationInput, SellerMetricBreakdown } from "./types";

export const buildConversationClassificationPrompt = (
  input: ClassificationInput,
  metrics: SellerMetricBreakdown,
): string => {
  const compactMessages = input.messages.map((message) => ({
    ts: message.timestamp,
    direction: message.direction,
    text: message.messageText,
  }));

  return `
SYSTEM:
You are a strict sales conversation classifier. Output ONLY valid JSON.
No markdown, no explanations outside JSON.
Decide outcome from conversation evidence and seller behavior.

Allowed outcome values:
- converted
- lost
- pending
- no-response

Allowed reason values:
- price
- no network availability
- low credit score
- competitor
- no interest
- delayed response
- no follow-up
- customer stopped responding
- other

Return EXACT schema:
{
  "conversation_id": "<string>",
  "outcome": "<allowed_outcome>",
  "reason": "<allowed_reason_or_other>",
  "seller_score": <integer 0-100>,
  "response_quality": "<excellent|good|average|poor>",
  "summary": "<max 280 chars>",
  "confidence": <number 0-1>
}

Scoring guidance:
- response_speed_score (0-25): faster, consistent replies score higher.
- follow_up_consistency (0-25): regular proactive follow-ups score higher.
- closing_attempt_detection (0-25): clear attempts to close/deal next step.
- objection_handling_quality (0-25): addresses objections with clarity and alternatives.
- seller_score = sum of the four components (0-100).

Outcome guidance:
- converted: clear positive purchase/approval/contract/payment signal.
- lost: clear rejection or competitor/constraint reason.
- no-response: customer silence after meaningful seller attempts and elapsed time.
- pending: still in progress / insufficient evidence.

USER INPUT JSON:
${JSON.stringify(
  {
    conversation_id: input.conversationId,
    seller_id: input.sellerId,
    messages: compactMessages,
    derived_metrics: metrics,
  },
  null,
  2,
)}
`.trim();
};
