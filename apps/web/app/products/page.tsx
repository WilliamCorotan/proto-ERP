import { getSalesSnapshot } from "../data";
import { createProductAction, updateProductAction } from "../actions";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default async function ProductsPage() {
  const { products, stockMovements } = await getSalesSnapshot();

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2>Products</h2>
          </div>
          <span className="status-pill">{products.length} skus</span>
        </div>
        <div className="data-grid">
          {products.map((product) => (
            <article key={product.id} className="data-card">
              <em>{product.sku}</em>
              <strong>{product.name}</strong>
              <span>{product.category}</span>
              <span>{money(product.price.amount, product.price.currency)}</span>
              <span>Stock on hand: {product.stockOnHand}</span>
              <form action={updateProductAction} className="mini-form">
                <input type="hidden" name="id" value={product.id} />
                <input name="sku" defaultValue={product.sku} aria-label="Product SKU" required />
                <input name="name" defaultValue={product.name} aria-label="Product name" required />
                <input name="category" defaultValue={product.category} aria-label="Product category" required />
                <input
                  name="price"
                  defaultValue={product.price.amount}
                  type="number"
                  min="0"
                  step="1"
                  aria-label="Product price"
                  required
                />
                <input
                  name="stockOnHand"
                  defaultValue={product.stockOnHand}
                  type="number"
                  min="0"
                  step="1"
                  aria-label="Stock on hand"
                  required
                />
                <button type="submit">Update</button>
              </form>
            </article>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Create</p>
            <h2>New product</h2>
          </div>
        </div>
        <form action={createProductAction} className="record-form">
          <label>
            SKU
            <input name="sku" placeholder="SKU-NEW" required />
          </label>
          <label>
            Name
            <input name="name" placeholder="Product name" required />
          </label>
          <label>
            Category
            <input name="category" placeholder="Software" required />
          </label>
          <label>
            Price
            <input name="price" type="number" min="0" step="1" defaultValue="1000" required />
          </label>
          <label>
            Stock
            <input name="stockOnHand" type="number" min="0" step="1" defaultValue="10" required />
          </label>
          <button type="submit">Create product</button>
        </form>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Inventory</p>
            <h2>Recent stock movements</h2>
          </div>
          <span className="status-pill">{stockMovements.length} moves</span>
        </div>
        <div className="timeline">
          {stockMovements.map((movement) => (
            <div key={movement.id} className="timeline-row">
              <span>{movement.quantity}</span>
              <p>
                <strong>{movement.sku}</strong> {movement.reason}
              </p>
            </div>
          ))}
          {stockMovements.length === 0 ? <p>No stock movements yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
