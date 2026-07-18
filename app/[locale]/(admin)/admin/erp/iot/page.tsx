import { ErpIotPanel } from "@/components/erp/erp-iot-panel";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Industrial IoT (5.13)</h1>
        <p className="text-sm text-muted mt-1">Devices, sensor readings, health scores, and alerts.</p>
      </div>
      <ErpIotPanel />
    </div>
  );
}
