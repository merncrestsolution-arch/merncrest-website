import { setRequestLocale } from "next-intl/server";

export const metadata = {
  title: "Privacy Policy | MERNcrest Solutions",
  description: "Privacy Policy and Data Protection Framework for MERNcrest Solutions.",
};

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="stitch-page">
      <div className="stitch-container stitch-section pt-32 max-w-4xl mx-auto">
      <div className="stitch-card !p-8 md:!p-12">
        <div className="mb-12 border-b border-white/10 pb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Privacy Policy</h1>
          <div className="text-muted space-y-2">
            <p><strong>Company:</strong> MERNcrest Solutions (Pvt) Ltd</p>
            <p><strong>Website:</strong> merncrest.lk</p>
            <p><strong>Effective Date:</strong> June 20, 2025</p>
            <p><strong>Last Updated:</strong> June 20, 2025</p>
            <p><strong>Contact:</strong> merncrestsolution@gmail.com</p>
          </div>
        </div>

        <div className="space-y-8 text-foreground/80 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction and Legal Framework</h2>
            <p className="mb-4">
              MERNcrest Solutions (Pvt) Ltd (hereinafter referred to as "MERNcrest," "we," "us," or "our") is a private limited company incorporated and registered under the Companies Act No. 07 of 2007 of the Democratic Socialist Republic of Sri Lanka. We are committed to protecting the privacy and personal data of all individuals who interact with our website, products, and services.
            </p>
            <p className="mb-2 font-semibold">This Privacy Policy is drafted in compliance with the following legal frameworks:</p>
            <p className="font-semibold mt-4 mb-2">Sri Lankan Law:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Personal Data Protection Act No. 09 of 2022 (PDPA) — Sri Lanka's primary data protection legislation</li>
              <li>Computer Crimes Act No. 24 of 2007 — governs unauthorized access and cybercrime</li>
              <li>Electronic Transactions Act No. 19 of 2006 — governs electronic records and communications</li>
              <li>Consumer Affairs Authority Act No. 09 of 2003 — consumer protection obligations</li>
              <li>Telecommunications Act No. 25 of 1991 (as amended) — communications data regulations</li>
            </ul>
            <p className="font-semibold mt-4 mb-2">International Standards and Frameworks:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>General Data Protection Regulation (GDPR) — European Union Regulation 2016/679 (applicable to EU residents)</li>
              <li>California Consumer Privacy Act (CCPA) — applicable to California residents</li>
              <li>ISO/IEC 27001:2022 — international standard for information security management</li>
              <li>OECD Guidelines on the Protection of Privacy and Transborder Flows of Personal Data</li>
              <li>UN Guidelines for the Regulation of Computerized Personal Data Files (1990)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Definitions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>"Personal Data"</strong> means any information relating to an identified or identifiable natural person, as defined under Section 2 of the Personal Data Protection Act No. 09 of 2022 of Sri Lanka and Article 4(1) of the EU GDPR.</li>
              <li><strong>"Processing"</strong> means any operation performed on personal data, including collection, recording, storage, alteration, retrieval, consultation, use, disclosure, combination, restriction, erasure, or destruction.</li>
              <li><strong>"Data Controller"</strong> means MERNcrest Solutions (Pvt) Ltd, which determines the purposes and means of processing personal data.</li>
              <li><strong>"Data Subject"</strong> means the natural person whose personal data is being processed.</li>
              <li><strong>"Consent"</strong> means freely given, specific, informed, and unambiguous indication of the data subject's agreement to the processing of their personal data.</li>
              <li><strong>"Third Party"</strong> means any natural or legal person other than the data subject, the data controller, or persons authorized to process data under the direct authority of the controller.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Personal Data We Collect</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4 text-accent">3.1 Information You Provide Directly</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Full name and contact details (email address, telephone number, postal address)</li>
              <li>Company name, job title, and business information</li>
              <li>Project requirements, technical specifications, and business objectives shared during consultations</li>
              <li>Payment information (processed securely through third-party payment processors; we do not store card data)</li>
              <li>Login credentials for client portals and administrative systems (passwords are encrypted using industry-standard hashing algorithms)</li>
              <li>Communications, feedback, support requests, and correspondence</li>
              <li>Curriculum vitae, cover letters, and employment application materials</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">3.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>IP address and approximate geographic location</li>
              <li>Browser type, version, and device information</li>
              <li>Operating system and screen resolution</li>
              <li>Pages visited, time spent on pages, and navigation patterns</li>
              <li>Referring website or search engine</li>
              <li>Cookie identifiers and session tokens</li>
              <li>Error logs and technical diagnostic information</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">3.3 Information From Third Parties</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Publicly available business information from LinkedIn and professional directories</li>
              <li>Information from referral partners with your consent</li>
              <li>Analytics data from Google Analytics and similar services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Legal Basis for Processing (PDPA & GDPR)</h2>
            <p className="mb-4">Under Section 5 of the Sri Lanka Personal Data Protection Act No. 09 of 2022 and Article 6 of the EU GDPR, we process your personal data on the following legal bases:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Contractual Necessity:</strong> Processing required to fulfill our service agreements and contracts with clients.</li>
              <li><strong>Legitimate Interests:</strong> Processing necessary for our legitimate business interests, including improving our services, preventing fraud, and maintaining business security, where these interests are not overridden by your rights.</li>
              <li><strong>Legal Obligation:</strong> Processing required to comply with applicable Sri Lankan laws and regulations, including tax laws, accounting requirements, and court orders.</li>
              <li><strong>Consent:</strong> Where you have provided explicit consent for specific processing activities, such as marketing communications. You may withdraw consent at any time without affecting the lawfulness of prior processing.</li>
              <li><strong>Vital Interests:</strong> Processing necessary to protect the vital interests of the data subject or another person in emergency situations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. How We Use Your Personal Data</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4 text-accent">5.1 Service Delivery</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Providing, maintaining, and improving our software development, cloud, cybersecurity, and digital services</li>
              <li>Processing project requirements and communicating project status</li>
              <li>Managing client accounts, billing, and contractual obligations</li>
              <li>Providing technical support and customer service</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">5.2 Business Operations</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Conducting due diligence and client verification as required by Sri Lankan law</li>
              <li>Maintaining business records as required under the Companies Act No. 07 of 2007</li>
              <li>Processing financial transactions and maintaining accounting records under the Inland Revenue Act No. 24 of 2017</li>
              <li>Managing employment records and payroll in compliance with the Shop and Office Employees Act and the Employees' Provident Fund Act</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">5.3 Marketing and Communications (With Consent)</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Sending newsletters, technical updates, and promotional content (only with opt-in consent)</li>
              <li>Conducting surveys and collecting feedback to improve services</li>
              <li>Retargeting campaigns through digital advertising platforms</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">5.4 Security and Compliance</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Monitoring for security threats, fraud, and unauthorized access</li>
              <li>Complying with legal obligations, court orders, and regulatory requirements</li>
              <li>Maintaining audit logs as required for cybersecurity compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Data Sharing and Disclosure</h2>
            <p className="mb-4">We do not sell your personal data. We may share your data with:</p>
            
            <h3 className="text-xl font-semibold mb-2 mt-4 text-accent">6.1 Service Providers and Sub-Processors</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Amazon Web Services (AWS) — cloud hosting and infrastructure (US servers; covered by AWS Data Processing Agreement and Standard Contractual Clauses for GDPR)</li>
              <li>Cloudinary — media storage and delivery</li>
              <li>Brevo (formerly Sendinblue) — email communication services (EU-based, GDPR compliant)</li>
              <li>Google Analytics — website analytics (data anonymized; EU-US Data Privacy Framework applies)</li>
              <li>Stripe / PayHere — payment processing (PCI DSS Level 1 certified processors)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">6.2 Legal and Regulatory Disclosure</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Sri Lanka Police and law enforcement authorities pursuant to the Code of Criminal Procedure Act No. 15 of 1979</li>
              <li>Sri Lanka Telecommunications Regulatory Commission under lawful orders</li>
              <li>Department of Inland Revenue under the Inland Revenue Act</li>
              <li>Any court of competent jurisdiction within Sri Lanka or internationally</li>
              <li>The Information and Communication Technology Agency (ICTA) of Sri Lanka under applicable ICT regulations</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">6.3 Business Transfers</h3>
            <p>In the event of a merger, acquisition, or sale of assets, your personal data may be transferred to the successor entity, subject to the same privacy protections described in this Policy. You will be notified of any such transfer.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. International Data Transfers</h2>
            <p className="mb-4">Some of our service providers are located outside Sri Lanka. When we transfer personal data internationally, we ensure appropriate safeguards are in place, including:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission for transfers to and from EU/EEA</li>
              <li>Adequacy decisions where applicable</li>
              <li>Binding Corporate Rules where appropriate</li>
              <li>Your explicit consent for specific transfers, where required under Section 28 of the Personal Data Protection Act No. 09 of 2022</li>
            </ul>
            <p>All international transfers comply with Chapter V of the EU GDPR and the international transfer provisions of the Sri Lanka PDPA.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Your Rights as a Data Subject</h2>
            <p className="mb-4">Under the Personal Data Protection Act No. 09 of 2022 of Sri Lanka and the EU GDPR (for EU residents), you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Right to Access (Section 18, PDPA):</strong> You may request a copy of the personal data we hold about you.</li>
              <li><strong>Right to Rectification (Section 19, PDPA / Article 16, GDPR):</strong> You may request correction of inaccurate or incomplete personal data.</li>
              <li><strong>Right to Erasure (Section 20, PDPA / Article 17, GDPR):</strong> You may request deletion of your personal data, subject to legal retention requirements.</li>
              <li><strong>Right to Restriction of Processing (Article 18, GDPR):</strong> You may request that we restrict processing of your data under certain circumstances.</li>
              <li><strong>Right to Data Portability (Article 20, GDPR):</strong> You may receive your data in a structured, machine-readable format.</li>
              <li><strong>Right to Object (Section 21, PDPA / Article 21, GDPR):</strong> You may object to processing based on legitimate interests or for direct marketing.</li>
              <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, you may withdraw it at any time.</li>
              <li><strong>Right Not to be Subject to Automated Decision-Making (Article 22, GDPR):</strong> You may request human review of automated decisions that significantly affect you.</li>
            </ul>
            <p className="mb-4">To exercise any of these rights, submit a written request to: <a href="mailto:merncrestsolution@gmail.com" className="text-accent hover:underline">merncrestsolution@gmail.com</a></p>
            <p className="mb-4">We will respond within 30 days as required by the PDPA and within the 30-day period under the GDPR. If we require additional time (up to 60 additional days under GDPR), we will notify you with reasons.</p>
            <div className="bg-accent/10 border border-accent/20 p-4 rounded-lg text-sm text-accent">
              <span className="font-bold">⚠ Note:</span> Sri Lankan residents may also lodge complaints with the Data Protection Authority of Sri Lanka established under the Personal Data Protection Act No. 09 of 2022. EU residents may lodge complaints with their local Data Protection Authority.
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Cookies and Tracking Technologies</h2>
            <p className="mb-4">Our website uses cookies and similar tracking technologies. Under the EU ePrivacy Directive (Directive 2002/58/EC) and GDPR, we obtain your consent before placing non-essential cookies.</p>
            <p className="font-semibold mb-2">Cookie Categories:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li><strong>Strictly Necessary Cookies:</strong> Required for the website to function. No consent required. Includes session tokens and security cookies.</li>
              <li><strong>Performance / Analytics Cookies:</strong> Google Analytics cookies to measure website usage. Requires opt-in consent. Data is anonymized where possible.</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences such as language selection (EN/TA/SI) and theme settings. Requires consent.</li>
              <li><strong>Marketing / Targeting Cookies:</strong> Used for retargeting campaigns. Requires explicit opt-in consent. You may withdraw consent at any time.</li>
            </ul>
            <p>You may manage cookie preferences through our cookie consent banner or your browser settings. Note that disabling certain cookies may affect website functionality.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">10. Data Retention</h2>
            <p className="mb-4">We retain personal data only for as long as necessary for the purposes described in this Policy, or as required by law:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Client project data:</strong> 7 years from project completion (required under Sri Lanka's Inland Revenue Act for tax records)</li>
              <li><strong>Employment and HR records:</strong> 5 years from end of employment (Shop and Office Employees Act requirements)</li>
              <li><strong>Marketing contact data:</strong> Until consent is withdrawn or 2 years from last interaction</li>
              <li><strong>Website analytics data:</strong> 26 months (Google Analytics default)</li>
              <li><strong>Security logs and audit trails:</strong> 1 year from creation</li>
              <li><strong>Financial transaction records:</strong> 7 years (statutory requirement under Sri Lanka accounting standards)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">11. Data Security</h2>
            <p className="mb-4">We implement appropriate technical and organizational measures to protect personal data against unauthorized access, accidental loss, destruction, or damage, in accordance with Section 30 of the Personal Data Protection Act No. 09 of 2022 and Article 32 of the EU GDPR, including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>AES-256 encryption for data at rest and TLS 1.3 for data in transit</li>
              <li>Role-based access controls (RBAC) limiting data access to authorized personnel only</li>
              <li>Multi-factor authentication for all administrative systems</li>
              <li>Regular security audits and penetration testing</li>
              <li>Automated vulnerability scanning and patch management</li>
              <li>Secure development practices compliant with OWASP Top 10 standards</li>
              <li>Employee data protection training and confidentiality agreements</li>
              <li>Incident response procedures with a maximum 72-hour breach notification timeline (as required by GDPR Article 33)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">12. Children's Privacy</h2>
            <p>Our services are not directed to individuals under the age of 18. We do not knowingly collect personal data from minors. If we become aware that we have inadvertently collected data from a child under 18, we will delete such data immediately. Parents or guardians who believe their child has provided us with personal information should contact us at <a href="mailto:merncrestsolution@gmail.com" className="text-accent hover:underline">merncrestsolution@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">13. Changes to This Privacy Policy</h2>
            <p className="mb-4">We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or business operations. When we make material changes, we will notify you by:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Posting the updated Policy on our website with a revised "Last Updated" date</li>
              <li>Sending an email notification to registered users (where we hold your email address)</li>
              <li>Displaying a prominent notice on our website for 30 days following material changes</li>
            </ul>
            <p>Continued use of our website or services after the effective date of changes constitutes acceptance of the updated Policy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">14. Contact Information and Data Protection Officer</h2>
            <p className="mb-4">For any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact:</p>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <p className="font-bold text-lg mb-2">MERNcrest Solutions (Pvt) Ltd</p>
              <p>Attn: Data Protection Officer</p>
              <p>Email: <a href="mailto:merncrestsolution@gmail.com" className="text-accent hover:underline">merncrestsolution@gmail.com</a></p>
              <p>Website: <a href="https://merncrest.lk" className="text-accent hover:underline">merncrest.lk</a></p>
              <p>Country: Sri Lanka</p>
            </div>
          </section>
        </div>
      </div>
      </div>
    </div>
  );
}
