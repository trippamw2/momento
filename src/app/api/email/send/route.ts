import { json, badRequest, serverError, handleRouteError, getUser } from "@/lib/api-helpers";
import { sendBookingConfirmation, sendBookingCancellation, sendGiftCardEmail, type SendEmailResult } from "@/lib/brevo";

export async function POST(request: Request) {
  try {
    const user = await getUser(request);
    if (!user) {
      return json({ error: "Authentication required to send emails" }, 401);
    }

    const body = await request.json();
    const { type } = body;

    if (!type) {
      return badRequest("Missing email notification type");
    }

    let result: SendEmailResult;

    switch (type) {
      case "booking_confirmation": {
        const { email, guestName, experienceTitle, experienceDate, experienceTime, guests, totalPrice, currency, bookingId, location, partnerName } = body;
        if (!email || !guestName || !experienceTitle || !experienceDate || !bookingId) {
          return badRequest("Missing required fields for booking_confirmation");
        }
        result = await sendBookingConfirmation({
          email,
          guestName,
          experienceTitle,
          experienceDate,
          experienceTime: experienceTime || "N/A",
          guests: guests || 1,
          totalPrice: totalPrice || 0,
          currency: currency || "MWK",
          bookingId,
          location: location || "",
          partnerName: partnerName || "",
        });
        break;
      }

      case "booking_cancelled": {
        const { email, guestName, experienceTitle, bookingId, refundStatus } = body;
        if (!email || !guestName || !experienceTitle || !bookingId) {
          return badRequest("Missing required fields for booking_cancelled");
        }
        result = await sendBookingCancellation({
          email,
          guestName,
          experienceTitle,
          bookingId,
          refundStatus: refundStatus || "No refund applicable.",
        });
        break;
      }

      case "gift_card": {
        const { recipientEmail, recipientName, senderName, amount, currency, code, message, occasion } = body;
        if (!recipientEmail || !recipientName || !senderName || !amount || !code) {
          return badRequest("Missing required fields for gift_card");
        }
        result = await sendGiftCardEmail({
          recipientEmail,
          recipientName,
          senderName,
          amount,
          currency: currency || "MWK",
          code,
          message,
          occasion,
        });
        break;
      }

      default:
        return badRequest(`Unknown email notification type: ${type}`);
    }

    if (!result.success) {
      return json({ error: result.error }, 500);
    }

    return json({ success: true, messageId: result.messageId });
  } catch (error) {
    return handleRouteError(error);
  }
}
