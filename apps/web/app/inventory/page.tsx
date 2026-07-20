import { Badge, DataCard, DataTable, MetricTile, RecordPanel, Timeline, TimelineRow, statusTone } from "../../components/design-system";
import {
  confirmPickTaskAction,
  confirmPutAwayTaskAction,
  createPickListAction,
  createPutAwayTasksAction,
  packPickListAction,
  postCycleCountAction,
  reserveStockAction,
  shipPackRecordAction,
  transferStockAction
} from "../actions";
import { getInventorySnapshot, getProcurementSnapshot, getSalesSnapshot } from "../data";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function InventoryPage() {
  const [inventory, sales, procurement] = await Promise.all([getInventorySnapshot(), getSalesSnapshot(), getProcurementSnapshot()]);
  const mainBin = inventory.bins.find((bin) => bin.code === "MAIN-01") ?? inventory.bins[0];
  const targetBin = inventory.bins.find((bin) => bin.id !== mainBin?.id) ?? inventory.bins[1] ?? inventory.bins[0];
  const product = sales.products[0];
  const activeReservations = inventory.reservations.filter((reservation) => reservation.status === "active");
  const stockValue = inventory.valuationLayers.reduce((sum, layer) => sum + layer.remainingQuantity * layer.unitCost.amount, 0);
  const order = sales.orders[0];
  const receipt = procurement.purchaseReceipts[0];
  const openPickTask = inventory.pickTasks.find((task) => task.status !== "picked");
  const pickedList = inventory.pickLists.find((list) => list.status === "picked");
  const packedRecord = inventory.packRecords.find((record) => record.status === "packed");
  const openPutAway = inventory.putAwayTasks.find((task) => task.status === "open");

  return (
    <div className="page-stack">
      <RecordPanel
        badge={<Badge tone={inventory.reconciled ? "success" : "warning"}>{inventory.reconciled ? "Ledger reconciled" : "Needs review"}</Badge>}
        eyebrow="Inventory"
        title="Warehouse control"
      >
        <div className="metric-grid">
          <MetricTile label="Warehouses" tone="info" value={inventory.warehouses.length} />
          <MetricTile label="Bins" tone="processing" value={inventory.bins.length} />
          <MetricTile label="Reserved units" tone="warning" value={activeReservations.reduce((sum, reservation) => sum + reservation.quantity, 0)} />
          <MetricTile label="Layer value" tone="success" value={money(stockValue, "USD")} />
        </div>
      </RecordPanel>

      <section className="split-grid">
        <RecordPanel badge={<Badge tone="neutral">{inventory.bins.length} bins</Badge>} eyebrow="Locations" title="Warehouses and bins">
          <div className="data-grid">
            {inventory.bins.map((bin) => (
              <DataCard key={bin.id} eyebrow={bin.warehouseCode} title={bin.code}>
                <span>
                  {bin.name} - {bin.warehouseCode}
                </span>
                <Badge tone={statusTone(bin.status)}>{bin.status}</Badge>
              </DataCard>
            ))}
          </div>
        </RecordPanel>

        <RecordPanel eyebrow="Controls" title="Reserve stock">
          <form action={reserveStockAction} className="record-form">
            <ProductSelect products={sales.products} />
            <label>
              Quantity
              <input name="quantity" type="number" min="1" defaultValue="1" required />
            </label>
            <label>
              Source
              <input name="sourceEntity" defaultValue="ManualReservation" required />
            </label>
            <label>
              Source ID
              <input name="sourceId" defaultValue={`manual-${Date.now()}`} required />
            </label>
            <button type="submit" disabled={!product}>
              Reserve
            </button>
          </form>
        </RecordPanel>
      </section>

      <section className="split-grid">
        <RecordPanel eyebrow="Movement" title="Transfer stock">
          <form action={transferStockAction} className="record-form">
            <ProductSelect products={sales.products} />
            <label>
              From
              <select name="fromBinId" defaultValue={mainBin?.id} required>
                {inventory.bins.map((bin) => (
                  <option key={bin.id} value={bin.id}>
                    {bin.code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              To
              <select name="toBinId" defaultValue={targetBin?.id} required>
                {inventory.bins.map((bin) => (
                  <option key={bin.id} value={bin.id}>
                    {bin.code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input name="quantity" type="number" min="1" defaultValue="1" required />
            </label>
            <button type="submit" disabled={!product || !mainBin || !targetBin}>
              Transfer
            </button>
          </form>
        </RecordPanel>

        <RecordPanel eyebrow="Reconciliation" title="Cycle count">
          <form action={postCycleCountAction} className="record-form">
            <ProductSelect products={sales.products} />
            <label>
              Bin
              <select name="binId" defaultValue={mainBin?.id} required>
                {inventory.bins.map((bin) => (
                  <option key={bin.id} value={bin.id}>
                    {bin.code}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Counted quantity
              <input name="countedQuantity" type="number" min="0" defaultValue="1" required />
            </label>
            <button type="submit" disabled={!product || !mainBin}>
              Post count
            </button>
          </form>
        </RecordPanel>
      </section>

      <section className="split-grid">
        <RecordPanel badge={<Badge tone="processing">{inventory.pickLists.length} pick lists</Badge>} eyebrow="WMS" title="Pick, pack, ship">
          <form action={createPickListAction} className="record-form">
            <label>
              Sales order
              <select name="salesOrderId" defaultValue={order?.id} required>
                {sales.orders.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.number} · {item.status}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={!order}>
              Create pick list
            </button>
          </form>
          <form action={confirmPickTaskAction} className="record-form">
            <label>
              Pick task
              <select name="pickTaskId" defaultValue={openPickTask?.id} required>
                {inventory.pickTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.sku} · {task.quantity} from {task.binCode}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Picked quantity
              <input name="pickedQuantity" type="number" min="0" defaultValue={openPickTask?.quantity ?? 1} required />
            </label>
            <label>
              Barcode
              <input name="barcode" defaultValue={openPickTask?.sku ?? "PICK-SCAN"} required />
            </label>
            <button type="submit" disabled={!openPickTask}>
              Confirm pick
            </button>
          </form>
          <form action={packPickListAction} className="record-form">
            <input type="hidden" name="pickListId" value={pickedList?.id ?? ""} />
            <label>
              Package
              <input name="packageCode" defaultValue={`PKG-${Date.now()}`} required />
            </label>
            <button type="submit" disabled={!pickedList}>
              Pack
            </button>
          </form>
          <form action={shipPackRecordAction} className="record-form">
            <input type="hidden" name="packRecordId" value={packedRecord?.id ?? ""} />
            <label>
              Carrier
              <input name="carrier" defaultValue="Internal Fleet" required />
            </label>
            <label>
              Tracking
              <input name="trackingNumber" defaultValue={`TRK-${Date.now()}`} required />
            </label>
            <button type="submit" disabled={!packedRecord}>
              Ship
            </button>
          </form>
        </RecordPanel>

        <RecordPanel badge={<Badge tone="info">{inventory.putAwayTasks.length} tasks</Badge>} eyebrow="Receiving" title="Put-away">
          <form action={createPutAwayTasksAction} className="record-form">
            <label>
              Receipt
              <select name="purchaseReceiptId" defaultValue={receipt?.id} required>
                {procurement.purchaseReceipts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.number} · {item.supplierName}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={!receipt}>
              Create put-away
            </button>
          </form>
          <form action={confirmPutAwayTaskAction} className="record-form">
            <label>
              Task
              <select name="putAwayTaskId" defaultValue={openPutAway?.id} required>
                {inventory.putAwayTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.sku} · {task.fromBinCode} to {task.toBinCode}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Barcode
              <input name="barcode" defaultValue={openPutAway?.sku ?? "PUT-SCAN"} required />
            </label>
            <button type="submit" disabled={!openPutAway}>
              Confirm put-away
            </button>
          </form>
        </RecordPanel>
      </section>

      <RecordPanel badge={<Badge tone="neutral">{inventory.ledger.length} entries</Badge>} eyebrow="Ledger" title="Stock ledger entries">
        <DataTable
          caption="Stock ledger entries"
          columns={[
            { key: "source", header: "Source", render: (entry) => entry.sourceEntity },
            { key: "sku", header: "SKU", render: (entry) => <strong>{entry.sku}</strong> },
            { key: "bin", header: "Bin", render: (entry) => entry.binCode },
            { key: "quantity", header: "Qty", align: "end", render: (entry) => `${entry.quantity > 0 ? "+" : ""}${entry.quantity}` },
            { key: "value", header: "Value", align: "end", render: (entry) => money(entry.value.amount, entry.value.currency) }
          ]}
          rows={inventory.ledger.slice(0, 12)}
          rowKey={(entry) => entry.id}
        />
      </RecordPanel>

      <section className="split-grid">
        <InventoryTimeline title="Reservations" rows={inventory.reservations.map((item) => [item.id, item.status, `${item.sku} · ${item.quantity} reserved`])} />
        <InventoryTimeline title="Cycle counts" rows={inventory.cycleCounts.map((item) => [item.id, item.status, `${item.sku} · variance ${item.variance}`])} />
      </section>
      <section className="split-grid">
        <InventoryTimeline title="Pick tasks" rows={inventory.pickTasks.map((item) => [item.id, item.status, `${item.sku} · ${item.pickedQuantity}/${item.quantity}`])} />
        <InventoryTimeline title="Barcode scans" rows={inventory.barcodeScans.map((item) => [item.id, item.scanType, `${item.barcode} · ${item.entity}`])} />
      </section>
    </div>
  );
}

function ProductSelect({
  products
}: {
  products: Array<{
    id: string;
    sku: string;
    name: string;
  }>;
}) {
  return (
    <label>
      Product
      <select name="productId" required>
        {products.map((item) => (
          <option key={item.id} value={item.id}>
            {item.sku} · {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function InventoryTimeline({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <RecordPanel badge={<Badge tone="neutral">{rows.length} records</Badge>} eyebrow="Activity" title={title}>
      <Timeline>
        {rows.map(([id, label, detail]) => (
          <TimelineRow key={id} label={label}>
            {detail}
          </TimelineRow>
        ))}
        {rows.length === 0 ? <p>No records yet.</p> : null}
      </Timeline>
    </RecordPanel>
  );
}
