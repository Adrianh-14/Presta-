// Only anonymous interaction names; no requests, cookies or customer data.
// A consent-aware analytics integration may subscribe to this event later.
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  const name = href === '/registro' ? 'registration_click'
    : href.startsWith('https://wa.me/') ? 'whatsapp_click'
    : href.startsWith('mailto:') ? 'email_click'
    : href.startsWith('/downloads/') ? 'resource_download_click' : null;
  if (name) window.dispatchEvent(new CustomEvent('bonexa:marketing', { detail: { name, page: location.pathname } }));
});
