export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1338),  // Use 1338 to avoid conflict with Gennexion's Strapi on 1337
  app: {
    keys: env.array('APP_KEYS'),
  },
});
