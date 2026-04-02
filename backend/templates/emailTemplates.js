export const escapeHTML = (str) => {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
};

export const custodianAssignmentTemplate = (user, hall, setPasswordLink) => `
<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:0.75rem;padding:2rem">
  <h2 style="color:#1e40af;margin-top:0">Custodian Assignment</h2>
  <p>Hello <strong>${escapeHTML(user.name)}</strong>,</p>
  <p>You have been assigned as the custodian for:</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:0.5rem;padding:1rem;margin:1rem 0">
    <p style="margin:0;color:#64748b;font-size:0.875rem">Hall</p>
    <p style="margin:0.25rem 0 0;color:#0f172a;font-size:1.1rem;font-weight:700">${escapeHTML(hall.name)}</p>
  </div>
  <p>Please set your password to activate your account.</p>
  <p>Click the link below:</p>
  <a href="${setPasswordLink}" style="display:inline-block;padding:0.75rem 1.5rem;background:#1e40af;color:#ffffff;text-decoration:none;border-radius:0.5rem;font-weight:600;margin:1rem 0">
    Set Password
  </a>
  <p style="color:#64748b;font-size:0.875rem;margin-top:1.5rem">This link will expire in 1 hour.</p>
  <p style="margin-top:2rem">Regards,<br/><strong>Admin</strong></p>
</div>
`;

export const newBookingRequestTemplate = (data) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:0.75rem;overflow:hidden">
  <div style="background:#1e3a8a;padding:1.25rem 1.5rem">
    <h2 style="color:#fff;margin:0;font-size:1.1rem">📋 New Hall Booking Request</h2>
  </div>
  <div style="padding:1.5rem">
    <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
      <tr>
        <td style="padding:0.55rem 0;color:#64748b;width:40%;vertical-align:top">Booking ID</td>
        <td style="padding:0.55rem 0;font-weight:700;color:#1e3a8a;font-size:1rem;letter-spacing:0.05em">${escapeHTML(data.bookingRef)}</td>
      </tr>
      <tr><td colspan="2" style="border-top:1px solid #f1f5f9;padding:0"></td></tr>
      <tr>
        <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Requested by</td>
        <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${escapeHTML(data.userName)}</td>
      </tr>
      <tr>
        <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Email</td>
        <td style="padding:0.55rem 0;color:#0f172a">${escapeHTML(data.userEmail)}</td>
      </tr>
      <tr><td colspan="2" style="border-top:1px solid #f1f5f9;padding:0.3rem 0"></td></tr>
      <tr>
        <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Facility</td>
        <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${escapeHTML(data.hallName)}</td>
      </tr>
      ${data.msgEvent ? `<tr>
        <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Event Name</td>
        <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${escapeHTML(data.msgEvent)}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Requested Date</td>
        <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${escapeHTML(data.slotDate)}</td>
      </tr>
      <tr>
        <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Available Slot</td>
        <td style="padding:0.55rem 0;color:#0f172a">${escapeHTML(data.slotTimeSlot)}</td>
      </tr>
      <tr>
        <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Requested Time</td>
        <td style="padding:0.55rem 0;font-weight:600;color:#0f172a">${escapeHTML(data.msgTime || data.message || 'N/A')}</td>
      </tr>
      <tr><td colspan="2" style="border-top:1px solid #f1f5f9;padding:0.3rem 0"></td></tr>
      <tr>
        <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Role</td>
        <td style="padding:0.55rem 0;color:#0f172a">${escapeHTML(data.roleLabel)}</td>
      </tr>
      <tr>
        <td style="padding:0.55rem 0;color:#64748b;vertical-align:top">Requested On</td>
        <td style="padding:0.55rem 0;color:#0f172a">${escapeHTML(data.requestedOn)}</td>
      </tr>
    </table>
    <div style="margin-top:1.75rem;display:flex;gap:0.75rem">
      <a href="${data.base}&status=Approved"
        style="flex:1;text-align:center;padding:0.7rem 1rem;background:#16a34a;color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700;font-size:0.95rem">
        ✅ Approve
      </a>
      <a href="${data.base}&status=Rejected"
        style="flex:1;text-align:center;padding:0.7rem 1rem;background:#dc2626;color:#fff;text-decoration:none;border-radius:0.5rem;font-weight:700;font-size:0.95rem">
        ❌ Reject
      </a>
    </div>
    <p style="color:#94a3b8;font-size:0.72rem;margin-top:1.25rem;text-align:center">${escapeHTML(data.bookingRef)} · Campus Hall Booking System</p>
  </div>
</div>
`;

export const bookingApprovedTemplate = (data) => `
<div style="font-family:sans-serif;max-width:540px;margin:auto;background:#0f172a;color:#e2e8f0;padding:2rem;border-radius:0.75rem">
  <h2 style="color:#16a34a;margin-top:0">✅ Booking Approved!</h2>
  <div style="background:#1e293b;border:1px solid #334155;border-radius:0.5rem;padding:0.75rem 1rem;margin-bottom:1.25rem;display:inline-block">
    <span style="color:#94a3b8;font-size:0.8rem;font-weight:600">BOOKING ID</span><br/>
    <span style="color:#60a5fa;font-size:1.4rem;font-weight:800;letter-spacing:0.05em">${escapeHTML(data.bookingRef)}</span>
  </div>
  <p>Hi <b>${escapeHTML(data.userName)}</b>, your booking has been <b style="color:#86efac">approved</b> by the custodian.</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:1rem">
    <tr style="border-bottom:1px solid #1e293b"><td style="padding:0.5rem 0;color:#94a3b8;font-size:0.85rem;width:40%">Hall</td><td style="padding:0.5rem 0;color:#fff;font-weight:600">${escapeHTML(data.hallName)}</td></tr>
    <tr style="border-bottom:1px solid #1e293b"><td style="padding:0.5rem 0;color:#94a3b8;font-size:0.85rem">Date</td><td style="padding:0.5rem 0;color:#fff;font-weight:600">${escapeHTML(data.slotDate)}</td></tr>
    <tr><td style="padding:0.5rem 0;color:#94a3b8;font-size:0.85rem">Time Slot</td><td style="padding:0.5rem 0;color:#fff;font-weight:600">${escapeHTML(data.slotTimeSlot)}</td></tr>
  </table>
  <p style="color:#475569;font-size:0.75rem;margin-top:1rem">Booking ID ${escapeHTML(data.bookingRef)} · Campus Hall Booking System</p>
</div>
`;
