const spawn = require('child-process-promise').spawn;

async function clearCache() {
  const domains = ['agribankmb.vnshop.vn',
  'bidvmb.vnshop.vn',
  'bidv-vip.vnshop.vn',
  'vietinbankmb.vnshop.vn',
  'vnmart.vnshop.vn',
  'vcbmb.vnshop.vn',
  'vpbankmb.vnshop.vn',
  'ivbmb.vnshop.vn',
  'eximbankmb.vnshop.vn',
  'abbankmb.vnshop.vn',
  'tripi.vnshop.vn',
  'dinogo.vnshop.vn',
  'icheck.vnshop.vn',
  'sacombankpaymb.vnshop.vn',
  'sacombankmb.vnshop.vn',
  'saigonbankmb.vnshop.vn',
  'bidcmb.vnshop.vn',
  'vietabankmb.vnshop.vn',
  'namabankmb.vnshop.vn',
  'wecare.vnshop.vn',
  'vnptpay.vnshop.vn',
  'vietinbankweb.vnshop.vn',
  'viviet.vnshop.vn',
  'vcb-loyalty.vnshop.vn',
  'vnshop.vn',
  'tailoc68.vnshop.vn'];


  const promises = [];
  for (const domain of domains) {
    const params = [`https://${domain}/`,
    '-H', `authority: ${domain}`,
    '-H', 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    '-H', 'accept-language: en-US,en;q=0.9',
    '-H', 'cache-control: max-age=0',
    '-H', 'cookie: pdts=referral; pushdy_player_id=0406c615-1615-3689-acf2-ba7e708d3733; _track_campaign=[%22sms-vns%22%2C%22double12%22%2C%22ctw%22%2C%22allcate%22%2C%2220211209-doubleday%22%2C%22duyentm%22]; _track__track=0c08a99b-c16a-4315-9c2e-599661a34028; _fbp=fb.1.1663581866508.2132556475; _tt_enable_cookie=1; _ttp=e8c08231-0649-417e-97a0-1f9517b1b7a8; _gcl_au=1.1.841865791.1663581868; _ga=GA1.2.683001013.1663581868; G_ENABLED_IDPS=google; terminal_mobile=VNS_OLN_WEB_0001; terminal_id_mobile=114; location_code_mobile=01; terminal=vnshop; terminal_id=45; location_code=01; _gid=GA1.2.1274464641.1669258780; _gat_gtag_UA_156452483_2=1; _gat_UA-156452483-2=1; pushdy_last_sub=1669262577356; pushdy_view_times=809; pushdy_last=1669262578068; _track_ref=[%22%22%2C%22%22%2C1669262578%2C%22https://www.google.com%22]; no=; _track_sessionId={%22sessionId%22:%229b29e799-a5bc-4b1c-a2e8-c96da3696979%22%2C%22createdAt%22:1669258781%2C%22lastActiveAt%22:1669262597}; nocache=true',
    '-H', 'sec-ch-ua: "Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
    '-H', 'sec-ch-ua-mobile: ?1',
    '-H', 'sec-ch-ua-platform: "Android"',
    '-H', 'sec-fetch-dest: document',
    '-H', 'sec-fetch-mode: navigate',
    '-H', 'sec-fetch-site: same-origin',
    '-H', 'sec-fetch-user: ?1',
    '-H', 'upgrade-insecure-requests: 1',
    '-H', 'user-agent: Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Mobile Safari/537.36',
    '--compressed'];
    const promise = spawn('curl', params);
    const childProcess = promise.childProcess;
    promises.push(promise);
    childProcess.stderr.on('data', data => console.error(data.toString()));
  }

  await Promise.all(promises);
}

module.exports = {
  clearCache
};
