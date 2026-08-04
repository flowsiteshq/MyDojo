import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.EIGHT_HUNDRED_API_KEY;
const fromNumber = process.env.EIGHT_HUNDRED_FROM_NUMBER;
const toNumber = '8326655442';

console.log('API key present:', !!apiKey);
console.log('From number:', fromNumber);

const body = JSON.stringify({
  sender: fromNumber,
  recipient: toNumber,
  message: 'Hi Brenda, this is MyDojo. We are sorry to see you go! It has been a pleasure having you as part of our family. If you ever want to return, we would love to have you back. Wishing you all the best! - MyDojo Team'
});

const resp = await fetch('https://api.800.com/message', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
  },
  body
});

const data = await resp.json();
console.log('Status:', resp.status);
console.log('Response:', JSON.stringify(data, null, 2));
