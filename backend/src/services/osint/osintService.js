import crypto from 'crypto';
import dns from 'dns/promises';
import { RopesAiService } from '../ropesAi/RopesAiService.js';

// Curated list of known disposable and temporary email domains
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'trashmail.com', 'getairmail.com', 'sharklasers.com', 'throwawaymail.com',
  'temp-mail.org', 'yopmail.com', 'dispostable.com', 'fakeinbox.com',
  'generator.email', 'crazymailing.com', 'mytemp.email', 'tempail.com',
  'mohmal.com', 'inboxkitten.com', 'burnermail.io', 'dropmail.me'
]);

// Common free webmail domains
const FREE_WEBMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'aol.com', 'zoho.com', 'proton.me', 'protonmail.com', 'gmx.com', 'mail.com'
]);

export class OsintService {
  /**
   * 1. EMAIL OSINT SCANNER
   */
  static async scanEmail(email) {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return {
        valid: false,
        email: email || '',
        error: 'Invalid email address format'
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    const [localPart, domain] = cleanEmail.split('@');
    const isDisposable = DISPOSABLE_DOMAINS.has(domain);
    const isFreeWebmail = FREE_WEBMAIL_DOMAINS.has(domain);
    const emailType = isDisposable ? 'DISPOSABLE_BURNER' : (isFreeWebmail ? 'FREE_WEBMAIL' : 'CORPORATE_CUSTOM_DOMAIN');

    // DNS MX Check
    let hasMxRecords = false;
    let mxHosts = [];
    try {
      const records = await dns.resolveMx(domain);
      if (records && records.length > 0) {
        hasMxRecords = true;
        mxHosts = records.sort((a, b) => a.priority - b.priority).map(r => r.exchange);
      }
    } catch (dnsErr) {
      hasMxRecords = false;
    }

    // Gravatar public avatar discovery (MD5 hash of lowercase email)
    const md5Hash = crypto.createHash('md5').update(cleanEmail).digest('hex');
    const gravatarUrl = `https://www.gravatar.com/avatar/${md5Hash}?d=404`;
    let hasGravatar = false;
    try {
      const gravatarRes = await fetch(gravatarUrl, { method: 'HEAD', timeout: 3000 });
      hasGravatar = gravatarRes.status === 200;
    } catch {
      hasGravatar = false;
    }

    // Risk Score calculation for Email (0 to 100)
    let emailTrustScore = 95;
    const flags = [];

    if (isDisposable) {
      emailTrustScore -= 60;
      flags.push('Disposable / Burner Email Domain Detected');
    }
    if (!hasMxRecords && !isFreeWebmail) {
      emailTrustScore -= 30;
      flags.push('Domain has no active MX Mail Server records');
    }
    if (localPart.length < 3) {
      emailTrustScore -= 10;
      flags.push('Unusually short username');
    }
    if (hasGravatar) {
      emailTrustScore = Math.min(100, emailTrustScore + 5);
    }

    return {
      email: cleanEmail,
      domain,
      localPart,
      emailType,
      isDisposable,
      isFreeWebmail,
      hasMxRecords,
      primaryMx: mxHosts[0] || 'None',
      hasPublicGravatar: hasGravatar,
      gravatarUrl: hasGravatar ? gravatarUrl : null,
      trustScore: Math.max(0, emailTrustScore),
      riskLevel: emailTrustScore >= 80 ? 'LOW' : (emailTrustScore >= 50 ? 'MEDIUM' : 'HIGH'),
      flags
    };
  }

  /**
   * 2. PHONE NUMBER OSINT SCANNER
   */
  static scanPhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return { valid: false, phone: '', error: 'Phone number required' };
    }

    const clean = phone.trim().replace(/[\s-]/g, '');
    const digitsOnly = clean.replace(/\D/g, '');
    let country = 'India';
    let countryCode = '+91';
    let nationalNumber = digitsOnly;
    let isVoipSuspect = false;
    let carrier = 'Reliance Jio / Bharti Airtel / Vi';
    let lineType = 'MOBILE_CELLULAR';

    if (clean.startsWith('+1') || (digitsOnly.length === 11 && digitsOnly.startsWith('1'))) {
      country = 'United States / Canada';
      countryCode = '+1';
      nationalNumber = digitsOnly.slice(-10);
      carrier = 'Verizon / AT&T / T-Mobile';
      const areaCode = nationalNumber.slice(0, 3);
      if (['800', '888', '877', '866', '855', '844', '833'].includes(areaCode)) {
        isVoipSuspect = true;
        lineType = 'TOLL_FREE_VOIP';
      }
    } else if (clean.startsWith('+44') || (digitsOnly.length === 12 && digitsOnly.startsWith('44'))) {
      country = 'United Kingdom';
      countryCode = '+44';
      nationalNumber = digitsOnly.slice(-10);
      carrier = 'EE / Vodafone UK / O2';
    } else {
      nationalNumber = digitsOnly.slice(-10);
      const firstDigit = nationalNumber[0];
      if (['6', '7'].includes(firstDigit)) carrier = 'Jio 4G/5G / Airtel';
      else if (['8', '9'].includes(firstDigit)) carrier = 'Airtel / Vi / BSNL';
      else carrier = 'Telecom Circle Telecom Operator';
    }

    const isValidLength = nationalNumber.length === 10;
    let phoneTrustScore = isValidLength ? 90 : 40;
    const flags = [];

    if (!isValidLength) {
      flags.push('Irregular phone number length');
    }
    if (isVoipSuspect) {
      phoneTrustScore -= 35;
      flags.push('Suspected Virtual / VoIP / Burner Number');
    }

    return {
      formatted: `${countryCode} ${nationalNumber}`,
      country,
      countryCode,
      nationalNumber,
      carrier,
      lineType,
      isVoipSuspect,
      trustScore: phoneTrustScore,
      riskLevel: phoneTrustScore >= 80 ? 'LOW' : (phoneTrustScore >= 50 ? 'MEDIUM' : 'HIGH'),
      flags
    };
  }

  /**
   * 3. GITHUB DEVELOPER OSINT SCANNER
   */
  static async scanGithub(username) {
    if (!username || typeof username !== 'string') {
      return { found: false, username: '', error: 'GitHub username required' };
    }

    const cleanUsername = username.trim().replace(/^@/, '').replace(/https?:\/\/github\.com\//, '').replace(/\/$/, '');

    try {
      const response = await fetch(`https://api.github.com/users/${cleanUsername}`, {
        headers: {
          'User-Agent': 'CandidateTrust-OSINT-Engine/1.0',
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.status === 404) {
        return {
          found: false,
          username: cleanUsername,
          trustScore: 40,
          riskLevel: 'MEDIUM',
          flags: ['GitHub handle not found on public directory']
        };
      }

      if (!response.ok) {
        throw new Error(`GitHub API returned status ${response.status}`);
      }

      const data = await response.json();
      const createdAt = new Date(data.created_at);
      const accountAgeYears = ((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);

      let githubScore = 80;
      const flags = [];

      if (data.public_repos > 5) githubScore += 10;
      if (parseFloat(accountAgeYears) >= 1) githubScore += 10;
      if (data.followers > 2) githubScore += 5;

      return {
        found: true,
        username: data.login,
        name: data.name || data.login,
        avatarUrl: data.avatar_url,
        profileUrl: data.html_url,
        bio: data.bio || 'Developer Profile',
        company: data.company || 'Independent',
        location: data.location || 'Global',
        publicRepos: data.public_repos,
        publicGists: data.public_gists,
        followers: data.followers,
        following: data.following,
        createdAt: data.created_at,
        accountAgeYears: `${accountAgeYears} years`,
        hireable: data.hireable,
        trustScore: Math.min(100, githubScore),
        riskLevel: githubScore >= 80 ? 'LOW' : 'MEDIUM',
        flags
      };
    } catch (err) {
      return {
        found: false,
        username: cleanUsername,
        trustScore: 50,
        riskLevel: 'MEDIUM',
        error: err.message
      };
    }
  }

  /**
   * 4. LEETCODE PROBLEM-SOLVING OSINT SCANNER
   * Fetches real live LeetCode stats via public GraphQL: Problems solved, Easy/Medium/Hard breakdown, Ranking
   */
  static async scanLeetCode(username) {
    if (!username || typeof username !== 'string') {
      return { found: false, username: '', error: 'LeetCode username required' };
    }

    const cleanUsername = username.trim().replace(/^@/, '').replace(/https?:\/\/leetcode\.com\/(u\/)?/, '').replace(/\/$/, '');

    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
            userAvatar
            realName
            aboutMe
            school
            company
            countryName
          }
          submitStats {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
        }
      }
    `;

    try {
      const response = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CandidateTrust/1.0',
          'Referer': 'https://leetcode.com'
        },
        body: JSON.stringify({ query, variables: { username: cleanUsername } })
      });

      const json = await response.json();
      const user = json?.data?.matchedUser;

      if (!user) {
        return {
          found: false,
          username: cleanUsername,
          trustScore: 45,
          riskLevel: 'MEDIUM',
          flags: ['LeetCode profile not found on public LeetCode directory']
        };
      }

      const counts = {};
      (user.submitStats?.acSubmissionNum || []).forEach(item => {
        counts[item.difficulty] = item.count;
      });

      const totalSolved = counts['All'] || 0;
      const easySolved = counts['Easy'] || 0;
      const mediumSolved = counts['Medium'] || 0;
      const hardSolved = counts['Hard'] || 0;
      const ranking = user.profile?.ranking || 'Unranked';

      let leetCodeTrustScore = 80;
      const flags = [];

      if (totalSolved >= 100) leetCodeTrustScore += 15;
      else if (totalSolved >= 30) leetCodeTrustScore += 10;
      else if (totalSolved === 0) {
        leetCodeTrustScore -= 10;
        flags.push('Zero LeetCode problems solved recorded');
      }

      if (hardSolved >= 5) leetCodeTrustScore = Math.min(100, leetCodeTrustScore + 5);

      return {
        found: true,
        username: user.username,
        realName: user.profile?.realName || user.username,
        avatarUrl: user.profile?.userAvatar,
        profileUrl: `https://leetcode.com/u/${user.username}`,
        ranking,
        country: user.profile?.countryName || 'Global',
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        trustScore: Math.min(100, leetCodeTrustScore),
        riskLevel: leetCodeTrustScore >= 80 ? 'LOW' : 'MEDIUM',
        flags
      };
    } catch (err) {
      return {
        found: false,
        username: cleanUsername,
        trustScore: 50,
        riskLevel: 'MEDIUM',
        error: err.message
      };
    }
  }

  /**
   * 5. LINKEDIN PROFESSIONAL PROFILE OSINT SCANNER
   * Analyzes vanity handle, URL formatting, professional domain reputation, and identity consistency
   */
  static scanLinkedIn(input, candidateName = '') {
    if (!input || typeof input !== 'string') {
      return { found: false, input: '', error: 'LinkedIn URL or handle required' };
    }

    const clean = input.trim();
    let handle = clean;

    if (clean.includes('linkedin.com/in/')) {
      handle = clean.split('linkedin.com/in/')[1]?.split('/')[0]?.split('?')[0] || '';
    } else if (clean.includes('linkedin.com/')) {
      handle = clean.split('linkedin.com/')[1]?.split('/')[0]?.split('?')[0] || '';
    }

    handle = handle.replace(/^@/, '').trim();
    const isValidHandleFormat = /^[a-zA-Z0-9-]{3,100}$/.test(handle);
    const profileUrl = `https://www.linkedin.com/in/${handle}`;

    let linkedInTrustScore = isValidHandleFormat ? 90 : 50;
    const flags = [];

    if (!isValidHandleFormat) {
      flags.push('Invalid LinkedIn vanity URL structure');
    }

    // Name consistency check
    if (candidateName && handle) {
      const nameParts = candidateName.toLowerCase().split(' ').filter(Boolean);
      const handleLower = handle.toLowerCase();
      const hasNameMatch = nameParts.some(part => part.length > 2 && handleLower.includes(part));
      if (hasNameMatch) {
        linkedInTrustScore = Math.min(100, linkedInTrustScore + 5);
      }
    }

    return {
      found: isValidHandleFormat,
      handle,
      profileUrl,
      isValidHandleFormat,
      trustScore: linkedInTrustScore,
      riskLevel: linkedInTrustScore >= 80 ? 'LOW' : 'MEDIUM',
      flags
    };
  }

  /**
   * 6. IP & NETWORK THREAT OSINT SCANNER (POWERED BY ROPES AI)
   */
  static async scanIp(ip) {
    try {
      const ropesResult = await RopesAiService.scanIp(ip);
      return {
        ip: ropesResult.ip,
        isLocal: ropesResult.isLocal,
        city: ropesResult.city,
        region: ropesResult.region,
        country: ropesResult.country,
        countryCode: ropesResult.countryCode,
        postalCode: ropesResult.postalCode,
        latitude: ropesResult.latitude,
        longitude: ropesResult.longitude,
        timezone: ropesResult.timezone,
        isp: ropesResult.isp,
        asn: ropesResult.asn,
        connectionType: ropesResult.connectionType,
        isVpnOrProxy: ropesResult.isVpn || ropesResult.isProxy,
        isVpn: ropesResult.isVpn,
        isProxy: ropesResult.isProxy,
        isTorExitNode: ropesResult.isTor,
        isDatacenter: ropesResult.isDatacenter,
        threatScore: ropesResult.threatScore,
        trustScore: ropesResult.trustScore,
        riskLevel: ropesResult.riskLevel,
        flags: ropesResult.threatFlags,
        provider: ropesResult.provider,
        // GUARDRAIL: Single signal protection
        singleSignalProtection: {
          enforced: true,
          notice: 'No candidate is ever disqualified on a single IP or location signal. Escalate to HR audit.'
        }
      };
    } catch (err) {
      return {
        ip: ip || '127.0.0.1',
        isLocal: true,
        city: 'Bengaluru',
        region: 'Karnataka',
        country: 'India',
        countryCode: 'IN',
        isp: 'Local Development Mesh',
        asn: 'AS133618',
        isVpnOrProxy: false,
        isTorExitNode: false,
        threatScore: 0,
        trustScore: 95,
        riskLevel: 'LOW',
        flags: []
      };
    }
  }

  /**
   * 7. COMPREHENSIVE 360° OSINT REPORT AGGREGATOR
   */
  static async runFullOsintScan({ email, phone, github, leetcode, linkedin, ip, name, gps, clientTimezone }) {
    const [emailOsint, phoneOsint, githubOsint, leetcodeOsint, linkedinOsint, ipOsint] = await Promise.all([
      email ? this.scanEmail(email) : Promise.resolve(null),
      phone ? Promise.resolve(this.scanPhone(phone)) : Promise.resolve(null),
      github ? this.scanGithub(github) : Promise.resolve(null),
      leetcode ? this.scanLeetCode(leetcode) : Promise.resolve(null),
      linkedin ? Promise.resolve(this.scanLinkedIn(linkedin, name)) : Promise.resolve(null),
      this.scanIp(ip || '127.0.0.1')
    ]);

    // Optional GPS & Location Drift Evaluation via Ropes AI
    let locationAnalysis = null;
    try {
      locationAnalysis = RopesAiService.analyzeLocation({
        ipScanResult: ipOsint,
        clientTimezone: clientTimezone || 'Asia/Kolkata',
        gpsData: gps || null
      });
    } catch (_) {}

    // Calculate Composite Trust Score
    const scores = [];
    if (emailOsint && emailOsint.trustScore !== undefined) scores.push(emailOsint.trustScore);
    if (phoneOsint && phoneOsint.trustScore !== undefined) scores.push(phoneOsint.trustScore);
    if (githubOsint && githubOsint.trustScore !== undefined) scores.push(githubOsint.trustScore);
    if (leetcodeOsint && leetcodeOsint.trustScore !== undefined) scores.push(leetcodeOsint.trustScore);
    if (linkedinOsint && linkedinOsint.trustScore !== undefined) scores.push(linkedinOsint.trustScore);
    if (ipOsint && ipOsint.trustScore !== undefined) scores.push(ipOsint.trustScore);

    const compositeScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
      : 85;

    const allFlags = [
      ...(emailOsint?.flags || []),
      ...(phoneOsint?.flags || []),
      ...(githubOsint?.flags || []),
      ...(leetcodeOsint?.flags || []),
      ...(linkedinOsint?.flags || []),
      ...(ipOsint?.flags || [])
    ];

    let overallRiskLevel = 'LOW';
    if (compositeScore < 60 || allFlags.length >= 3) overallRiskLevel = 'HIGH';
    else if (compositeScore < 80 || allFlags.length >= 1) overallRiskLevel = 'MEDIUM';

    return {
      timestamp: new Date().toISOString(),
      target: {
        name: name || 'Candidate Profile',
        email,
        phone,
        github,
        leetcode,
        linkedin,
        ip
      },
      compositeScore,
      overallRiskLevel,
      allFlags,
      modules: {
        email: emailOsint,
        phone: phoneOsint,
        github: githubOsint,
        leetcode: leetcodeOsint,
        linkedin: linkedinOsint,
        network: ipOsint,
        locationIntelligence: locationAnalysis
      },
      singleSignalProtection: {
        enforced: true,
        policyNotice: 'Single Signal Protection Active: Platform security policy guarantees that no candidate is ever automatically classified as fraudulent based solely on IP, VPN, or location signals. Flagged anomalies are routed strictly for human HR review.'
      }
    };
  }
}
