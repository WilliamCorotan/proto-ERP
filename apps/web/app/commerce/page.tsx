import {
  checkoutPosSaleAction,
  closePosShiftAction,
  ingestChannelOrderAction,
  openPosShiftAction,
  publishChannelCatalogAction
} from "../actions";
import { getCommerceSnapshot, getSalesSnapshot } from "../data";

export default async function CommercePage() {
  const [commerce, sales] = await Promise.all([getCommerceSnapshot(), getSalesSnapshot()]);
  const openShift = commerce.shifts.find((shift) => shift.status === "open");
  const closedRegister = commerce.registers.find((register) => register.status === "closed") ?? commerce.registers[0];
  const defaultCustomer = sales.customers[0];
  const defaultProduct = sales.products[0];
  const ecommerceChannel = commerce.channels.find((channel) => channel.channelType === "ecommerce") ?? commerce.channels[0];
  const openRegisterCount = commerce.registers.filter((register) => register.status === "open").length;
  const dailySales = commerce.sales.reduce((sum, sale) => sum + sale.total.amount, 0);

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Commerce</p>
            <h2>POS and channel operations</h2>
          </div>
          <span className="status-pill">{openRegisterCount} registers open</span>
        </div>
        <div className="metric-grid">
          <article>
            <span>Channels</span>
            <strong>{commerce.channels.length}</strong>
          </article>
          <article>
            <span>Open shifts</span>
            <strong>{commerce.shifts.filter((shift) => shift.status === "open").length}</strong>
          </article>
          <article>
            <span>POS sales</span>
            <strong>{formatMoney({ amount: dailySales, currency: "USD" })}</strong>
          </article>
          <article>
            <span>Channel orders</span>
            <strong>{commerce.channelOrders.length}</strong>
          </article>
        </div>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">POS</p>
              <h2>Register control</h2>
            </div>
          </div>
          <form action={openPosShiftAction} className="record-form">
            <label>
              Register
              <select name="registerId" defaultValue={closedRegister?.id} required>
                {commerce.registers.map((register) => (
                  <option key={register.id} value={register.id}>
                    {register.code} · {register.status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Opened by
              <input name="openedBy" defaultValue="Store Lead" required />
            </label>
            <label>
              Opening cash
              <input name="openingCash" type="number" min="0" step="1" defaultValue="250" required />
            </label>
            <button type="submit" disabled={!closedRegister || closedRegister.status !== "closed"}>
              Open shift
            </button>
          </form>

          <form action={closePosShiftAction} className="record-form">
            <label>
              Open shift
              <select name="shiftId" defaultValue={openShift?.id} required>
                {commerce.shifts
                  .filter((shift) => shift.status === "open")
                  .map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.registerCode} · {formatMoney(shift.expectedCash)}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Closing cash
              <input name="closingCash" type="number" min="0" step="1" defaultValue={openShift?.expectedCash.amount ?? 0} required />
            </label>
            <button type="submit" disabled={!openShift}>
              Close shift
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Checkout</p>
              <h2>Post POS sale</h2>
            </div>
          </div>
          <CommerceLineForm action={checkoutPosSaleAction} products={sales.products} submitLabel="Post sale">
            <label>
              Shift
              <select name="shiftId" defaultValue={openShift?.id} required>
                {commerce.shifts
                  .filter((shift) => shift.status === "open")
                  .map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.registerCode} · {shift.openedBy}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Customer
              <select name="customerId" defaultValue={defaultCustomer?.id} required>
                {sales.customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.code} · {customer.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tender
              <select name="tenderType" defaultValue="cash">
                <option value="cash">Cash</option>
                <option value="bank_card">Bank card</option>
                <option value="digital_wallet">Digital wallet</option>
              </select>
            </label>
          </CommerceLineForm>
          {!openShift ? <p>No open shift is available for checkout.</p> : null}
          {!defaultCustomer || !defaultProduct ? <p>Customers and products are required for commerce transactions.</p> : null}
        </article>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Catalog</p>
              <h2>Publish products</h2>
            </div>
          </div>
          <form action={publishChannelCatalogAction} className="record-form">
            <label>
              Channel
              <select name="channelId" defaultValue={ecommerceChannel?.id} required>
                {commerce.channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.code} · {channel.channelType}
                  </option>
                ))}
              </select>
            </label>
            {sales.products.slice(0, 4).map((product) => (
              <label key={product.id}>
                {product.sku}
                <input name="productIds" type="checkbox" value={product.id} defaultChecked={product.id === defaultProduct?.id} />
              </label>
            ))}
            <button type="submit" disabled={!ecommerceChannel || sales.products.length === 0}>
              Publish catalog
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Channel order</p>
              <h2>Ingest external order</h2>
            </div>
          </div>
          <CommerceLineForm action={ingestChannelOrderAction} products={sales.products} submitLabel="Import order">
            <label>
              Channel
              <select name="channelId" defaultValue={ecommerceChannel?.id} required>
                {commerce.channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.code} · {channel.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              External order
              <input name="externalOrderId" defaultValue={`WEB-${Date.now()}`} required />
            </label>
            <label>
              Customer
              <select name="customerId" defaultValue={defaultCustomer?.id} required>
                {sales.customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.code} · {customer.name}
                  </option>
                ))}
              </select>
            </label>
          </CommerceLineForm>
        </article>
      </section>

      <section className="split-grid">
        <Timeline
          title="POS shifts"
          rows={commerce.shifts.map((shift) => [shift.id, shift.status, `${shift.registerCode} · ${shift.openedBy} · ${formatMoney(shift.expectedCash)}`])}
        />
        <Timeline
          title="POS sales"
          rows={commerce.sales.map((sale) => [sale.id, sale.tenderType, `${sale.receiptNumber} · ${sale.customerName} · ${formatMoney(sale.total)}`])}
        />
      </section>

      <section className="split-grid">
        <Timeline
          title="Catalog"
          rows={commerce.catalogItems.map((item) => [item.id, item.published ? "published" : "hidden", `${item.sku} · ${formatMoney(item.price)}`])}
        />
        <Timeline
          title="Channel orders"
          rows={commerce.channelOrders.map((order) => [
            order.id,
            order.status,
            `${order.externalOrderId} · ${order.channelName} · ${formatMoney(order.total)}`
          ])}
        />
      </section>
    </div>
  );
}

function CommerceLineForm({
  action,
  children,
  products,
  submitLabel
}: {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  products: Array<{
    id: string;
    sku: string;
    name: string;
    price: { amount: number; currency: string };
  }>;
  submitLabel: string;
}) {
  const product = products[0];
  return (
    <form action={action} className="record-form">
      {children}
      <label>
        Product
        <select name="productId" defaultValue={product?.id} required>
          {products.map((item) => (
            <option key={item.id} value={item.id}>
              {item.sku} · {item.name}
            </option>
          ))}
        </select>
      </label>
      <input type="hidden" name="sku" value={product?.sku ?? ""} />
      <input type="hidden" name="description" value={product?.name ?? ""} />
      <label>
        Quantity
        <input name="quantity" type="number" min="1" defaultValue="1" required />
      </label>
      <label>
        Unit price
        <input name="unitPrice" type="number" min="0" step="1" defaultValue={product?.price.amount ?? 0} required />
      </label>
      <button type="submit" disabled={!product}>
        {submitLabel}
      </button>
    </form>
  );
}

function Timeline({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <article className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Records</p>
          <h2>{title}</h2>
        </div>
        <span className="status-pill">{rows.length} records</span>
      </div>
      <div className="timeline">
        {rows.map(([id, label, detail]) => (
          <div key={id} className="timeline-row">
            <span>{label}</span>
            <p>{detail}</p>
          </div>
        ))}
        {rows.length === 0 ? <p>No records yet.</p> : null}
      </div>
    </article>
  );
}

function formatMoney(value: { amount: number; currency: string }) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: value.currency,
    maximumFractionDigits: 0
  }).format(value.amount);
}
