import 'dotenv/config';
import { notifyStaffNewLead } from './server/notifyStaffNewLead';

console.log('Testing staff lead notification SMS...');

await notifyStaffNewLead({
  name: 'Test-Vincent (Live Test)',
  phone: '2818189288',
  program: 'Not Sure',
  source: 'website',
});

console.log('Done — check phones for SMS');
process.exit(0);
