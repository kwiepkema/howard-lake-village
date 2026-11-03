const reply = (status, message) => Response.json({message}, {status, headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
const email = value => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/form-config' && request.method === 'GET') {
      return Response.json({sitekey:env.TURNSTILE_SITE_KEY || ''}, {headers:{'Cache-Control':'no-store'}});
    }
    if (url.pathname !== '/api/contact') return reply(404,'Not found.');
    if (request.method !== 'POST') return reply(405,'Method not allowed.');
    if (request.headers.get('Origin') !== url.origin) return reply(403,'Please send your request from this website.');
    if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM || !env.TURNSTILE_SECRET_KEY || !env.CONTACT_RATE_LIMITER) return reply(503,'The form is not available yet. Please use the email or phone link.');
    const recipients = env.CONTACT_TO.split(',').map(value => value.trim()).filter(Boolean);
    if (!recipients.length || recipients.some(value => !email(value))) return reply(503,'The form is not available yet. Please use the email or phone link.');
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415,'Invalid request.');
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!(await env.CONTACT_RATE_LIMITER.limit({key:ip})).success) return reply(429,'Too many attempts. Please wait a minute and try again.');
    let data;
    try {
      const reader = request.body.getReader();
      let bytes = 0, chunks = [];
      while (true) {
        const {value,done} = await reader.read();
        if(done) break;
        bytes += value.byteLength;
        if(bytes > 16000) { await reader.cancel(); return reply(413,'Your message is too long.'); }
        chunks.push(value);
      }
      data = JSON.parse(await new Blob(chunks).text());
      if(!data || typeof data !== 'object' || Array.isArray(data)) throw Error();
    } catch { return reply(400,'Invalid request.'); }
    const fields = data.fields;
    if(!fields || typeof fields !== 'object' || Array.isArray(fields)) return reply(400,'Invalid form.');
    if(fields.website) return reply(400,'Please try again.');
    const contact = data.kind === 'contact';
    if (!contact && data.kind !== 'availability') return reply(400,'Invalid form.');
    const allowed = contact ? ['contact-name','contact-email','contact-subject','contact-message'] : ['accommodation','arrival-date','departure-date','guest-count','pets','first-name','last-name','email','phone','guest-message'];
    const clean = {};
    for(const key of allowed) {
      const value = fields[key] ?? '';
      if(typeof value !== 'string' || value.length > (key.includes('message') ? 4000 : 254) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) return reply(400,'Please check your form entries.');
      clean[key] = value.trim();
    }
    const required = contact ? allowed : ['accommodation','arrival-date','departure-date','guest-count','first-name','last-name','email'];
    if(required.some(key=>!clean[key])) return reply(400,'Please complete all required fields.');
    const sender = clean[contact ? 'contact-email' : 'email'];
    if(!email(sender)) return reply(400,'Please enter a valid email address.');
    if(!contact) {
      const dateValid = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s;
      if(!['The Villa','The Manor','Rent Both Townhomes','Not Sure Yet'].includes(clean.accommodation) ||
        !dateValid(clean['arrival-date']) || !dateValid(clean['departure-date']) || clean['departure-date'] <= clean['arrival-date'] ||
        !/^\d+$/.test(clean['guest-count']) || Number(clean['guest-count'])<1 || Number(clean['guest-count'])>999) return reply(400,'Please check your stay, dates and guest count.');
    }
    if(typeof data.token !== 'string' || data.token.length > 2048 || !data.token) return reply(400,'Please complete the security check.');
    const displayDate = value => new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric', timeZone:'UTC'});
    const messageText = contact
      ? [`Name: ${clean['contact-name']}`, `Email: ${sender}`, `Subject: ${clean['contact-subject']}`, '', 'Message:', clean['contact-message']].join('\n')
      : ['New availability enquiry', '', `Guest: ${clean['first-name']} ${clean['last-name']}`, `Email: ${sender}`, `Phone: ${clean.phone || 'Not provided'}`, '', `Property: ${clean.accommodation}`, `Check-in: ${displayDate(clean['arrival-date'])}`, `Check-out: ${displayDate(clean['departure-date'])}`, `Guests: ${clean['guest-count']}`, `Pets: ${clean.pets || 'Not provided'}`, '', 'Message:', clean['guest-message'] || 'Not provided'].join('\n');
    try {
      const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:data.token,remoteip:ip}),signal:AbortSignal.timeout(10000)
      });
      const result = await verify.json();
      if(!verify.ok || !result.success || result.hostname !== url.hostname || result.action !== 'contact') return reply(400,'The security check expired. Please try again.');
      const sent = await fetch('https://api.resend.com/emails', {
        method:'POST', headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
        body:JSON.stringify({from:env.CONTACT_FROM,to:recipients,reply_to:sender,
          subject:contact ? 'Howard Lake Village — contact enquiry' : 'Howard Lake Village — availability enquiry',
          text:messageText}),signal:AbortSignal.timeout(15000)
      });
      if(!sent.ok) return reply(502,'We could not send your message. Please try again later or use the email link.');
      return reply(200,'Your enquiry has been sent. This does not confirm a reservation.');
    } catch { return reply(502,'We could not confirm sending. Please contact us by email before submitting again.'); }
  }
};
