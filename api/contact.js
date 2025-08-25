export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get form data
  const { name, email, phone, inquiryType, message } = req.body;

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Get Brevo API key from environment variable
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.error('BREVO_API_KEY not configured');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    // Send email using Brevo API
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: {
          name: 'Idlewood Capital',
          email: 'no-reply@brevo.com'  // Using Brevo's default sender that doesn't need verification
        },
        to: [
          {
            email: 'info@idlewoodcapital.com',
            name: 'Idlewood Capital'
          }
        ],
        replyTo: {
          email: email,
          name: name
        },
        subject: `New ${inquiryType || 'Website'} Inquiry from ${name}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e293b;">New Contact Form Submission</h2>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #475569; margin-top: 0;">Contact Information</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
              <p><strong>Inquiry Type:</strong> ${inquiryType || 'General'}</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <h3 style="color: #475569; margin-top: 0;">Message</h3>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
            
            <p style="color: #94a3b8; font-size: 12px;">
              This email was sent from the contact form on idlewoodcapital.com
            </p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brevo API error:', response.status, errorText);
      
      // Parse common Brevo errors
      if (response.status === 401) {
        return res.status(500).json({ error: 'Email service authentication failed. Please check API key.' });
      } else if (response.status === 400) {
        return res.status(500).json({ error: 'Invalid email configuration. Please verify sender email.' });
      }
      
      throw new Error(`Failed to send email: ${errorText}`);
    }

    // Also add contact to Brevo (optional - for CRM features)
    // Commented out temporarily for troubleshooting
    /*
    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          FIRSTNAME: name.split(' ')[0],
          LASTNAME: name.split(' ').slice(1).join(' '),
          PHONE: phone || '',
          INQUIRY_TYPE: inquiryType || 'General'
        },
        listIds: [2], // You'll need to create a list in Brevo and update this ID
        updateEnabled: true
      })
    }).catch(err => {
      // Don't fail if contact creation fails
      console.log('Contact creation failed (non-critical):', err);
    });
    */

    return res.status(200).json({ success: true, message: 'Message sent successfully' });
    
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
}