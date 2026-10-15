const configuredSite = new URL(process.env.SITE_URL || 'https://prestamosplus.com');
if (!['https:', 'http:'].includes(configuredSite.protocol) || configuredSite.pathname !== '/' || configuredSite.search || configuredSite.hash || configuredSite.username || configuredSite.password) throw new Error('SITE_URL must be an HTTP(S) origin without a path, query or credentials');
export const site = configuredSite.origin;
export const verification = process.env.GOOGLE_SITE_VERIFICATION || '';
export const organization = {
  '@type': 'Organization', '@id': `${site}/#organization`, name: 'Bonexa', url: `${site}/`,
  logo: `${site}/branding/icono-bonexa.svg`, email: 'adrien1138@gmail.com',
  contactPoint: { '@type': 'ContactPoint', telephone: '+1-829-690-8175', contactType: 'customer support', availableLanguage: 'Spanish' },
};
export const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [organization,
    { '@type': 'WebSite', '@id': `${site}/#website`, name: 'Bonexa', alternateName: 'PréstamoPlus', url: `${site}/`, inLanguage: 'es-DO', publisher: { '@id': organization['@id'] } },
    { '@type': 'SoftwareApplication', name: 'Bonexa', url: `${site}/`, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', inLanguage: 'es-DO', provider: { '@id': organization['@id'] }, offers: { '@type': 'Offer', price: '0', priceCurrency: 'DOP', url: `${site}/precios/`, description: 'Acceso inicial: 100 clientes, 50 préstamos activos y 3 usuarios.' } },
  ],
};
