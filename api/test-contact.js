export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get form data
  const { name, email, phone, inquiryType, message } = req.body;

  // Log the attempt
  console.log('Contact form submission:', { name, email, inquiryType });

  // Check if API key exists
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    return res.status(200).json({ 
      success: false, 
      message: 'API key not configured',
      debug: 'BREVO_API_KEY environment variable is missing'
    });
  }

  // Try a minimal Brevo request
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: { email: 'no-reply@brevo.com' },
        to: [{ email: 'info@idlewoodcapital.com' }],
        subject: 'Test from Idlewood Capital Website',
        textContent: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
      })
    });

    const responseText = await response.text();
    
    if (response.ok) {
      return res.status(200).json({ 
        success: true, 
        message: 'Email sent successfully!'
      });
    } else {
      return res.status(200).json({ 
        success: false, 
        message: 'Brevo API error',
        status: response.status,
        error: responseText
      });
    }
    
  } catch (error) {
    return res.status(200).json({ 
      success: false, 
      message: 'Network error',
      error: error.message
    });
  }
}