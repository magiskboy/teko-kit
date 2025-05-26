const { exec } = require('child_process');

const remote = 'origin',
  ticketRegex = /[A-Z0-9]+-[0-9]+/g;

// https://jira.teko.vn/browse/UX4BUYER-3217?jql=issue%20in%20(%22UX4BUYER-3217%22%2C%20%22UX4BUYER-3034%22)
function extractTicket(gitDiff) {
  const tickets = new Set();
  let match;
  while ((match = ticketRegex.exec(gitDiff)) !== null) {
    tickets.add(match[0]);
  }
  const ticketsArr = Array.from(tickets);
  if (ticketsArr.length > 0) {
    const jql = `issue in ("${ticketsArr.join('","')}")`;
    return `https://jira.teko.vn/issues/?jql=${encodeURIComponent(jql)}`;
  }
}

// git log origin/master..origin/develop --oneline --no-merges
/**
 * @param {string[]} args
 */
function releaseNotes(args) {
  const destBranch = args[0];
  if (!destBranch) {
    console.error('Please enter the currently released branch');
    return;
  }
  const srcBranch = args[1] || 'master';

  exec(
    `git log ${remote}/${destBranch}..${remote}/${srcBranch} --oneline --no-merges`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(error.message);
        return;
      }
      if (stderr) {
        console.error(stderr);
        return;
      }
      console.log(stdout);
      console.log('JIRA filter: ');
      console.log(extractTicket(stdout));
    },
  );
}

module.exports = {
  releaseNotes,
};
