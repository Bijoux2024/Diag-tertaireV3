const { getPublicSupabaseConfig } = require('./_lib/supabase-server');

module.exports = function handler(req, res) {
  res.status(200).json(getPublicSupabaseConfig());
};
