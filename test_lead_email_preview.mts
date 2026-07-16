import { sendLeadConfirmationEmail } from './server/emailService';

// Override the RESEND_API_KEY with the correct one for testing
process.env.RESEND_API_KEY = 're_idXYYsNm_AVdwtT4bhD4x2Xnn3eFuakCN';
process.env.VITE_EMAIL_FROM = 'noreply@mydojoma.com';

async function main() {
  console.log('Sending branded lead confirmation email preview...');
  const result = await sendLeadConfirmationEmail({
    toEmail: 'Vincent.Holmes00@gmail.com',
    toName: 'Vincent',
    program: 'Kickboxing',
  });
  console.log('Result:', result);
}

main().catch(console.error);
