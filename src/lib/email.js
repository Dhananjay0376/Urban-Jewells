export const sendOrderEmail = async (orderData, items) => {
  // EmailJS Configuration
  // Replace these with your actual EmailJS credentials:
  // 1. Go to https://www.emailjs.com/ and create an account
  // 2. Create an email service (Gmail, Outlook, etc.)
  // 3. Create an email template with variables: {{to_email}}, {{customer_name}}, {{order_details}}, etc.
  // 4. Get your Service ID, Template ID, and Public Key from the dashboard
  
  const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // Replace with your EmailJS service ID
  const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // Replace with your EmailJS template ID
  const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Replace with your EmailJS public key
  
  const orderDetails = items.map(item => 
    `${item.name} (Size: ${item.size || 'N/A'}) x ${item.quantity} - R${(item.price * item.quantity).toLocaleString()}`
  ).join('\n');
  
  const templateParams = {
    to_email: 'orders@urbanjewells.co.za', // Replace with your store email
    customer_name: orderData.fullName,
    customer_email: orderData.email,
    customer_phone: orderData.phone,
    customer_address: `${orderData.address}, ${orderData.city}, ${orderData.country}`,
    order_details: orderDetails,
    total_amount: `R${orderData.total.toLocaleString()}`,
    order_notes: orderData.notes || 'None',
  };
  
  try {
    // Note: In production, you would use:
    // import emailjs from '@emailjs/browser';
    // await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    
    console.log('Order email would be sent with:', templateParams);
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
};

export const sendContactEmail = async (formData) => {
  const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
  const EMAILJS_TEMPLATE_ID = 'YOUR_CONTACT_TEMPLATE_ID';
  const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';
  
  const templateParams = {
    to_email: 'info@urbanjewells.co.za',
    from_name: formData.name,
    from_email: formData.email,
    subject: formData.subject,
    message: formData.message,
  };
  
  try {
    console.log('Contact email would be sent with:', templateParams);
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
};
