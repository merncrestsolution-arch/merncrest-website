import { setRequestLocale } from "next-intl/server";

export const metadata = {
  title: "Terms of Service | MERNcrest Solutions",
  description: "Terms of Service and Legal Agreements for MERNcrest Solutions.",
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container-wide section-padding pt-32 min-h-screen">
      <div className="max-w-4xl mx-auto glass-panel p-8 md:p-12 rounded-3xl border border-white/10">
        <div className="mb-12 border-b border-white/10 pb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">Terms of Service</h1>
          <div className="text-muted space-y-2">
            <p><strong>Company:</strong> MERNcrest Solutions (Pvt) Ltd</p>
            <p><strong>Effective Date:</strong> June 20, 2025</p>
            <p><strong>Governing Law:</strong> Laws of the Democratic Socialist Republic of Sri Lanka</p>
            <p><strong>Jurisdiction:</strong> Courts of Sri Lanka</p>
          </div>
        </div>

        <div className="space-y-8 text-foreground/80 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Agreement to Terms</h2>
            <p className="mb-4">
              By accessing or using the website at merncrest.lk (the "Website"), engaging our services, entering into any agreement, or otherwise interacting with MERNcrest Solutions (Pvt) Ltd ("MERNcrest," "we," "us," or "our"), you ("Client," "User," or "you") agree to be legally bound by these Terms of Service ("Terms").
            </p>
            <p className="mb-4">
              These Terms constitute a legally binding agreement under Sri Lankan contract law, governed by the Contract Law principles established under the Civil Code, the Sale of Goods Ordinance No. 11 of 1896, and the Electronic Transactions Act No. 19 of 2006, which gives legal validity to electronic agreements and signatures.
            </p>
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg text-sm text-destructive">
              <span className="font-bold">⚠ Important:</span> If you do not agree to these Terms, you must not use our Website or engage our services. By proceeding, you confirm that you are at least 18 years of age and have legal capacity to enter into binding contracts under Sri Lankan law.
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Company Information</h2>
            <p className="mb-4">MERNcrest Solutions (Pvt) Ltd is incorporated and registered as a private limited company under the Companies Act No. 07 of 2007 of the Democratic Socialist Republic of Sri Lanka. We provide software development, web development, mobile application development, cloud services, cybersecurity solutions, digital marketing, IT consulting, hosting, and domain services.</p>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p><strong>Registered Address:</strong> Sri Lanka</p>
              <p><strong>Contact Email:</strong> merncrestsolution@gmail.com</p>
              <p><strong>Website:</strong> merncrest.lk</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Services</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4 text-accent">3.1 Scope of Services</h3>
            <p className="mb-2">MERNcrest provides the following categories of services ("Services"):</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Custom Software Development (web applications, mobile apps, enterprise systems)</li>
              <li>Cloud Infrastructure Setup, Migration, and Management (AWS, Azure, Google Cloud)</li>
              <li>Cybersecurity Assessments, Penetration Testing, and Security Implementation</li>
              <li>Digital Marketing Services (SEO, Social Media Management, PPC Advertising)</li>
              <li>IT Consulting and Digital Transformation Advisory</li>
              <li>Web Hosting and Domain Registration Services</li>
              <li>Software as a Service (SaaS) Product Licensing</li>
              <li>Training and Technical Support Services</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">3.2 Service Agreements</h3>
            <p>Specific Services will be governed by individual Service Agreements, Statements of Work (SOW), or Project Contracts entered into between MERNcrest and the Client. In the event of any conflict between these Terms and a specific Service Agreement, the Service Agreement shall prevail with respect to the specific Services described therein.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">3.3 Service Availability</h3>
            <p>We strive to maintain maximum uptime for all hosted services. However, we do not guarantee uninterrupted availability and shall not be liable for downtime caused by factors outside our reasonable control, including but not limited to Sri Lanka Telecom network outages, AWS infrastructure issues, natural disasters, or force majeure events as defined under Sri Lankan law.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Client Obligations</h2>
            <p className="mb-4">By engaging our Services, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate, complete, and up-to-date information required for service delivery</li>
              <li>Cooperate with our team within agreed timelines and respond to queries within reasonable timeframes</li>
              <li>Ensure that any materials, content, data, or intellectual property you provide to us does not infringe the rights of any third party</li>
              <li>Comply with all applicable Sri Lankan laws and regulations in connection with your use of our Services</li>
              <li>Maintain the confidentiality of login credentials and notify us immediately of any unauthorized access</li>
              <li>Pay all fees in accordance with agreed payment schedules and terms</li>
              <li>Not use our Services for any unlawful, fraudulent, or harmful purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Payment Terms</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4 text-accent">5.1 Fees and Invoicing</h3>
            <p className="mb-2">All fees are agreed upon in writing prior to commencement of Services. Unless otherwise specified in a Service Agreement, the following standard payment terms apply:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li><strong>Project Deposit:</strong> 40% of the total project value payable upon signing of the Service Agreement</li>
              <li><strong>Milestone Payments:</strong> As specified in the Statement of Work, typically tied to defined deliverables</li>
              <li><strong>Final Payment:</strong> Remaining balance payable upon project completion and client acceptance, prior to final handover</li>
              <li><strong>Monthly Retainer Services:</strong> Payable in advance on the first business day of each month</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">5.2 Currency and Taxes</h3>
            <p>All invoices may be issued in Sri Lankan Rupees (LKR) or US Dollars (USD) as agreed. Prices are exclusive of Value Added Tax (VAT) where applicable under the Value Added Tax Act No. 14 of 2002 of Sri Lanka. All applicable taxes will be added to invoices in accordance with Sri Lankan tax law.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">5.3 Late Payment</h3>
            <p>Invoices not paid within 14 days of the due date may attract a late payment charge of 2% per month on the outstanding balance, calculated from the due date. MERNcrest reserves the right to suspend Services for accounts with outstanding overdue payments exceeding 30 days.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">5.4 Refund Policy</h3>
            <p>Refunds are governed by individual Service Agreements. Generally: (a) deposits are non-refundable once project work has commenced; (b) milestone payments for completed and accepted work are non-refundable; (c) advance payments for services not yet rendered may be refunded at our discretion, subject to deduction of work already performed and administrative costs.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Intellectual Property Rights</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4 text-accent">6.1 Client-Owned Deliverables</h3>
            <p>Upon receipt of full payment for a project, MERNcrest assigns to the Client all intellectual property rights in custom-developed software, code, designs, and content created exclusively for that Client under the applicable Service Agreement. This assignment is made subject to the rights described in Clause 6.2 and 6.3 below.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">6.2 MERNcrest Retained Rights</h3>
            <p className="mb-2">Notwithstanding Clause 6.1, MERNcrest retains ownership of:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>All pre-existing intellectual property, frameworks, libraries, tools, methodologies, and know-how used in developing deliverables ("Background IP")</li>
              <li>Generic, reusable code components and development templates</li>
              <li>MERNcrest's proprietary development processes and technical documentation</li>
              <li>MERNcrest trademarks, brand assets, and corporate identity materials</li>
            </ul>
            <p>MERNcrest grants the Client a non-exclusive, perpetual, royalty-free license to use Background IP solely as incorporated into the delivered project.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">6.3 Third-Party Licenses</h3>
            <p>Some deliverables may incorporate open-source software, third-party APIs, or licensed components. The Client is responsible for complying with the respective licenses of such third-party components. MERNcrest will disclose significant third-party dependencies in project documentation.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">6.4 Sri Lankan IP Law Compliance</h3>
            <p>All intellectual property matters are governed by the Intellectual Property Act No. 36 of 2003 of Sri Lanka, which protects copyright, trademarks, patents, and related rights. International protections are recognized under the Berne Convention for the Protection of Literary and Artistic Works and the TRIPS Agreement, to which Sri Lanka is a signatory.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">6.5 Portfolio Rights</h3>
            <p>MERNcrest reserves the right to include completed projects in our portfolio, case studies, and marketing materials, unless the Client has entered into a written confidentiality agreement specifically excluding such use.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Confidentiality</h2>
            <p className="mb-2">Both parties agree to maintain strict confidentiality regarding all non-public information disclosed during the course of the business relationship, including but not limited to:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Business strategies, financial information, and trade secrets</li>
              <li>Technical specifications, source code, and system architectures</li>
              <li>Customer data, employee information, and operational procedures</li>
              <li>Pricing, contractual terms, and commercial arrangements</li>
            </ul>
            <p className="mb-4">These confidentiality obligations survive termination of any Service Agreement for a period of five (5) years. Disclosure is permitted only where required by law, court order, or regulatory authority of competent jurisdiction in Sri Lanka.</p>
            <p>This confidentiality obligation is enforceable under the general principles of contract law in Sri Lanka and may be supplemented by a separate Non-Disclosure Agreement (NDA) where required.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Warranties and Representations</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4 text-accent">8.1 MERNcrest Warranties</h3>
            <p className="mb-2">MERNcrest warrants that:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Services will be performed with reasonable skill, care, and diligence by qualified professionals</li>
              <li>Deliverables will materially conform to the specifications agreed in the Statement of Work</li>
              <li>We hold all necessary rights to provide the Services and grant the licenses described herein</li>
              <li>We will comply with all applicable Sri Lankan laws and regulations in delivering Services</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">8.2 Warranty Period</h3>
            <p>Unless otherwise specified in a Service Agreement, MERNcrest provides a 30-day post-launch warranty period for custom software development projects. During this period, we will rectify defects that prevent the software from performing its specified functions at no additional charge. This warranty does not cover issues arising from client modifications, third-party integrations, hosting environment changes, or misuse.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">8.3 Disclaimer</h3>
            <p className="uppercase font-semibold text-sm tracking-wider opacity-80 border-l-4 border-accent pl-4 py-2 bg-white/5">
              Except as expressly provided in these terms, MERNcrest makes no warranties, express or implied, including any implied warranties of merchantability, fitness for a particular purpose, or non-infringement, to the maximum extent permitted by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Limitation of Liability</h2>
            <p className="mb-4">To the maximum extent permitted by applicable Sri Lankan law and international law:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>MERNcrest's total aggregate liability to any Client in connection with any Service Agreement shall not exceed the total fees paid by that Client to MERNcrest in the twelve (12) months immediately preceding the event giving rise to the claim.</li>
              <li>MERNcrest shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including loss of profits, loss of data, loss of business, or reputational damage, even if advised of the possibility of such damages.</li>
              <li>MERNcrest shall not be liable for any damages arising from third-party service failures, including but not limited to AWS outages, payment processor failures, or telecommunications disruptions.</li>
            </ul>
            <div className="bg-accent/10 border border-accent/20 p-4 rounded-lg text-sm text-accent">
              <span className="font-bold">⚠ Note:</span> Some jurisdictions do not allow exclusion of certain warranties or limitation of liability. In such cases, our liability will be limited to the maximum extent permitted by applicable law.
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">10. Indemnification</h2>
            <p className="mb-2">You agree to indemnify, defend, and hold harmless MERNcrest Solutions (Pvt) Ltd and its directors, officers, employees, agents, and contractors from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising from:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your breach of these Terms or any Service Agreement</li>
              <li>Your violation of any applicable law or regulation, including Sri Lankan law</li>
              <li>Your infringement of any intellectual property or other rights of any third party</li>
              <li>Any content or data you provide to MERNcrest that is unlawful, infringing, or harmful</li>
              <li>Your negligence or willful misconduct</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">11. Termination</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4 text-accent">11.1 Termination by Client</h3>
            <p>The Client may terminate a Service Agreement by providing written notice. Termination fees apply as specified in the Service Agreement. Work completed and accepted prior to termination is not refundable.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">11.2 Termination by MERNcrest</h3>
            <p className="mb-2">MERNcrest may terminate or suspend Services immediately upon written notice if:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>The Client breaches any material term of these Terms or a Service Agreement and fails to cure such breach within 14 days of written notice</li>
              <li>The Client fails to make payment when due</li>
              <li>The Client engages in illegal, fraudulent, or abusive conduct</li>
              <li>Providing Services would require MERNcrest to violate applicable law</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">11.3 Effect of Termination</h3>
            <p>Upon termination: (a) all outstanding invoices become immediately due and payable; (b) each party shall return or destroy the other party's confidential information; (c) clauses relating to intellectual property, confidentiality, indemnification, limitation of liability, and governing law shall survive termination.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">12. Force Majeure</h2>
            <p className="mb-4">Neither party shall be liable for any failure or delay in performance resulting from causes beyond their reasonable control, including but not limited to: acts of God, natural disasters (including floods, earthquakes, and the monsoon events common to Sri Lanka), civil unrest, government actions, pandemics, telecommunications network failures, power failures, or cyberattacks by third parties.</p>
            <p>The affected party shall notify the other party as soon as reasonably practicable and shall use reasonable efforts to resume performance. If a force majeure event continues for more than 60 days, either party may terminate the affected Service Agreement without penalty.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">13. Dispute Resolution</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4 text-accent">13.1 Negotiation</h3>
            <p>In the event of any dispute arising from or in connection with these Terms or any Service Agreement, the parties shall first attempt to resolve the dispute through good-faith negotiation within 30 days of written notice of the dispute.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">13.2 Mediation</h3>
            <p>If negotiation fails, the parties shall attempt mediation through the Sri Lanka Mediation Board or a mutually agreed mediator, in accordance with the Mediation (Special Categories of Disputes) Act No. 21 of 2003.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">13.3 Arbitration</h3>
            <p>If mediation fails within 60 days, the dispute shall be referred to and finally resolved by arbitration in accordance with the Arbitration Act No. 11 of 1995 of Sri Lanka. The seat of arbitration shall be Colombo, Sri Lanka. The language of arbitration shall be English. The arbitrator's decision shall be final and binding.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">13.4 Court Proceedings</h3>
            <p>Nothing in this clause prevents either party from seeking urgent injunctive or other equitable relief from the courts of Sri Lanka to prevent irreparable harm pending arbitration.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">14. Governing Law and Jurisdiction</h2>
            <p className="mb-4">These Terms and any disputes arising from or in connection with them shall be governed by and construed in accordance with the laws of the Democratic Socialist Republic of Sri Lanka, without regard to its conflict of law provisions.</p>
            <p>The parties irrevocably submit to the exclusive jurisdiction of the courts of Sri Lanka for any matters not resolved by arbitration. For international clients, these Terms additionally acknowledge the applicability of relevant international commercial law principles, including the United Nations Convention on Contracts for the International Sale of Goods (CISG) where applicable.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">15. General Provisions</h2>
            <h3 className="text-xl font-semibold mb-2 mt-4 text-accent">15.1 Entire Agreement</h3>
            <p>These Terms, together with any applicable Service Agreements and our Privacy Policy, constitute the entire agreement between the parties regarding the subject matter hereof and supersede all prior agreements, understandings, and representations.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">15.2 Severability</h3>
            <p>If any provision of these Terms is found by a court of competent jurisdiction to be invalid, illegal, or unenforceable, that provision shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force and effect.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">15.3 Waiver</h3>
            <p>No waiver of any breach of these Terms shall constitute a waiver of any other or subsequent breach. No waiver shall be effective unless made in writing and signed by an authorized representative of the waiving party.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">15.4 Assignment</h3>
            <p>You may not assign or transfer your rights or obligations under these Terms without our prior written consent. MERNcrest may assign these Terms or any rights hereunder in connection with a merger, acquisition, or sale of assets, with notice to you.</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">15.5 Notices</h3>
            <p>All formal notices under these Terms shall be in writing and delivered by email with confirmation of receipt or by registered post to the addresses provided by the parties. Notices to MERNcrest should be sent to: merncrestsolution@gmail.com</p>

            <h3 className="text-xl font-semibold mb-2 mt-6 text-accent">15.6 Amendments</h3>
            <p>MERNcrest reserves the right to amend these Terms at any time. Material amendments will be notified to existing clients by email with at least 30 days' notice. Continued use of our Services after the effective date of amendments constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">16. Compliance with Sri Lankan Specific Regulations</h2>
            <p className="mb-2">In connection with services provided within Sri Lanka, these Terms operate in compliance with the following additional statutory frameworks:</p>
            <ul className="list-disc pl-6 space-y-1 mb-6">
              <li>Bribery Act No. 11 of 1954 (as amended) — we maintain a zero-tolerance anti-bribery policy</li>
              <li>Prevention of Money Laundering Act No. 05 of 2006 — we comply with all AML/KYC requirements</li>
              <li>Foreign Exchange Act No. 12 of 2017 — international payments comply with Central Bank of Sri Lanka guidelines</li>
              <li>Information and Communication Technology Act No. 27 of 2003 — we comply with ICTA regulations governing IT services</li>
              <li>Payment and Settlement Systems Act No. 28 of 2005 — digital payment compliance</li>
              <li>National Data Protection Policy of Sri Lanka — alignment with national cybersecurity framework</li>
            </ul>

            <div className="bg-accent text-white p-6 rounded-xl mt-8">
              <p className="font-semibold text-lg mb-2">Acknowledgment</p>
              <p className="mb-4">By using our website or engaging our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.</p>
              <div className="pt-4 border-t border-white/20">
                <p className="font-bold">MERNcrest Solutions (Pvt) Ltd</p>
                <p className="text-white/80">merncrest.lk | merncrestsolution@gmail.com | Sri Lanka</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
