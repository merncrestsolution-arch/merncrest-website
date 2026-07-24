import { ErpDocumentsPanel } from "@/components/erp/erp-documents-panel";

export default function Page() {
  return (
    <div>
      <h1 className="rlk-welcome">Documents &amp; knowledge</h1>
      <p className="rlk-empty !mb-5">
        Repository · folders · versions · ACL · OCR search · e-sign · wiki/FAQ · workflows
      </p>
      <ErpDocumentsPanel />
    </div>
  );
}
