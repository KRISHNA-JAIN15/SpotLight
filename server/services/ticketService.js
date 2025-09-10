const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

class TicketService {
  static async generateTicket(ticketData) {
    try {
      const {
        eventTitle,
        eventDate,
        eventTime,
        eventLocation,
        attendeeName,
        attendeeEmail,
        ticketType,
        ticketNumber,
        qrData,
      } = ticketData;

      // Create new PDF document
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: "M",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Convert base64 to buffer
      const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(",")[1], "base64");

      // Header
      doc
        .fillColor("#4F46E5")
        .fontSize(28)
        .font("Helvetica-Bold")
        .text("EVENT TICKET", 50, 50, { align: "center" });

      // Event title
      doc
        .fillColor("#1F2937")
        .fontSize(24)
        .font("Helvetica-Bold")
        .text(eventTitle, 50, 120, { align: "center" });

      // Ticket details box
      const boxY = 180;
      doc.rect(50, boxY, 495, 200).stroke("#E5E7EB");

      // Event details
      doc
        .fillColor("#374151")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Event Details:", 70, boxY + 20);

      doc
        .fillColor("#6B7280")
        .fontSize(12)
        .font("Helvetica")
        .text(`Date: ${eventDate}`, 70, boxY + 45)
        .text(`Time: ${eventTime}`, 70, boxY + 65)
        .text(`Location: ${eventLocation}`, 70, boxY + 85)
        .text(`Ticket Type: ${ticketType}`, 70, boxY + 105);

      // Attendee details
      doc
        .fillColor("#374151")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Attendee Details:", 70, boxY + 135);

      doc
        .fillColor("#6B7280")
        .fontSize(12)
        .font("Helvetica")
        .text(`Name: ${attendeeName}`, 70, boxY + 160)
        .text(`Email: ${attendeeEmail}`, 70, boxY + 180);

      // QR Code
      doc.image(qrCodeBuffer, 400, boxY + 40, { width: 120, height: 120 });

      // Ticket number
      doc
        .fillColor("#4F46E5")
        .fontSize(16)
        .font("Helvetica-Bold")
        .text(`Ticket #${ticketNumber}`, 50, 420, { align: "center" });

      // Footer
      doc
        .fillColor("#9CA3AF")
        .fontSize(10)
        .font("Helvetica")
        .text("Please present this ticket at the event entrance.", 50, 460, {
          align: "center",
        })
        .text(
          "This ticket is non-transferable and valid for one entry only.",
          50,
          475,
          { align: "center" }
        );

      // Instructions
      doc
        .fillColor("#6B7280")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Important Instructions:", 50, 520)
        .fontSize(10)
        .font("Helvetica")
        .text("• Arrive 30 minutes before the event start time", 50, 540)
        .text("• Bring a valid photo ID along with this ticket", 50, 555)
        .text("• Entry may be denied without proper identification", 50, 570)
        .text("• For support, contact: support@spotlight.com", 50, 585);

      // Return the PDF buffer
      return new Promise((resolve, reject) => {
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        doc.end();
      });
    } catch (error) {
      console.error("Error generating ticket:", error);
      throw error;
    }
  }

  static generateTicketNumber() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TKT-${timestamp}-${random}`;
  }

  static generateQRData(ticketData) {
    return JSON.stringify({
      ticketNumber: ticketData.ticketNumber,
      eventId: ticketData.eventId,
      attendeeEmail: ticketData.attendeeEmail,
      timestamp: Date.now(),
    });
  }
}

module.exports = TicketService;
