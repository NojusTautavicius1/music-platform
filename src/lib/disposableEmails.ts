const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","guerrillamailblock.com","grr.la","guerrillamail.info",
  "guerrillamail.biz","guerrillamail.de","guerrillamail.net","guerrillamail.org",
  "spam4.me","yopmail.com","yopmail.fr","cool.fr.nf","jetable.fr.nf","nospam.ze.tc",
  "nomail.xl.cx","mega.zik.dj","speed.1s.fr","courriel.fr.nf","moncourrier.fr.nf",
  "monemail.fr.nf","monmail.fr.nf","dispostable.com","mailnull.com","spamgourmet.com",
  "trashmail.at","trashmail.me","trashmail.io","trashmail.net","trashmail.org","trashmail.xyz",
  "throwam.com","throwam.net","throwam.org","sharklasers.com","guerrillamail.info",
  "grr.la","guerrillamailblock.com","spam4.me","spamgourmet.com","spamgourmet.net",
  "spamgourmet.org","spamherelots.com","spamhereplease.com","spamthisplease.com",
  "tempr.email","discard.email","spambox.us","mailnesia.com","mailnull.com",
  "spaml.com","tempemail.net","fakeinbox.com","throwam.com","throwam.net",
  "mailsac.com","nwldx.com","spamgob.com","gufum.com","tafmail.com","vomoto.com",
  "getairmail.com","filzmail.com","l33r.eu","spamfree24.org","spamfree24.de",
  "spamfree24.net","spamfree24.info","spamfree24.eu","spamfree.eu","spamfree.ee",
  "discardmail.com","discardmail.de","spamtrail.com","tempinbox.com","tempinbox.co.uk",
  "spamhole.com","spaml.de","spamstack.net","temporaryinbox.com","mailexpire.com",
  "mailnew.com","spamgoblin.com","spambin.xyz","maildrop.cc","mailnull.com",
  "dispostable.com","mail-filter.com","notmailinator.com","safetymail.info",
  "fakemailgenerator.com","tempmail.com","tempr.email","temp-mail.org","temp-mail.de",
  "wegwerfmail.de","wegwerfmail.net","wegwerfmail.org","jetable.net","jetable.org",
  "jetable.pp.ua","jetable.com","jetable.fr","no-spam.ws","mailnoreply.com",
  "throwam.com","spamthisplease.com","spamherelots.com","sharklasers.com",
  "spam4.me","trashmail.at","trashmail.com","trashmail.io","trashmail.me",
  "trashmail.net","trashmail.org","trashmail.xyz","10minutemail.com","10minutemail.net",
  "10minutemail.org","10minutemail.de","10minutemail.co.za","10minutemail.us",
  "10minutemail.info","minutemail.com","spaml.com","spamex.com","spaml.de",
  "bspamfree.org","bobmail.info","chammy.info","letthemeatspam.com","spamavert.com",
])

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase()
  if (!domain) return false
  return DISPOSABLE_DOMAINS.has(domain)
}
